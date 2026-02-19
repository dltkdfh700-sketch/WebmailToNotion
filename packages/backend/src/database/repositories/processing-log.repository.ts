import { getDb } from '../connection';

interface ProcessingLogRow {
  id: number;
  level: string;
  message: string;
  details: string | null;
  created_at: string;
}

export interface ProcessingLog {
  id: number;
  level: string;
  message: string;
  details: unknown | null;
  createdAt: string;
}

function toLog(row: ProcessingLogRow): ProcessingLog {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    details: row.details ? JSON.parse(row.details) : null,
    createdAt: row.created_at,
  };
}

export const processingLogRepository = {
  create(level: 'info' | 'warn' | 'error', message: string, details?: unknown): ProcessingLog {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO processing_logs (level, message, details) VALUES (?, ?, ?)'
    ).run(level, message, details ? JSON.stringify(details) : null);

    const row = db.prepare('SELECT * FROM processing_logs WHERE id = ?').get(result.lastInsertRowid) as ProcessingLogRow;
    return toLog(row);
  },

  findAll(options: { page?: number; limit?: number; level?: string } = {}): { data: ProcessingLog[]; total: number } {
    const db = getDb();
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.level) {
      conditions.push('level = ?');
      params.push(options.level);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM processing_logs ${where}`).get(...params) as { count: number };

    const rows = db.prepare(
      `SELECT * FROM processing_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as ProcessingLogRow[];

    return {
      data: rows.map(toLog),
      total: countRow.count,
    };
  },

  deleteOlderThan(days: number): number {
    const db = getDb();
    const result = db.prepare(
      "DELETE FROM processing_logs WHERE created_at < datetime('now', ?)"
    ).run(`-${days} days`);
    return result.changes;
  },
};
