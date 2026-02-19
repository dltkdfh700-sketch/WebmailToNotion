import { getDb } from '../connection';
import type { LogEntry, LogFilters } from '@mail-to-notion/shared';

interface ProcessedEmailRow {
  id: number;
  email_uid: string;
  message_id: string;
  from_address: string;
  subject: string;
  status: string;
  category: string | null;
  priority: string | null;
  notion_page_id: string | null;
  notion_page_url: string | null;
  error_message: string | null;
  ai_provider: string | null;
  processing_time_ms: number | null;
  raw_analysis: string | null;
  created_at: string;
}

function toLogEntry(row: ProcessedEmailRow): LogEntry {
  return {
    id: row.id,
    emailUid: row.email_uid,
    messageId: row.message_id,
    from: row.from_address,
    subject: row.subject,
    status: row.status as LogEntry['status'],
    category: row.category ?? undefined,
    priority: row.priority ?? undefined,
    notionPageId: row.notion_page_id ?? undefined,
    notionPageUrl: row.notion_page_url ?? undefined,
    errorMessage: row.error_message ?? undefined,
    aiProvider: row.ai_provider ?? undefined,
    processingTimeMs: row.processing_time_ms ?? undefined,
    createdAt: row.created_at,
  };
}

export interface CreateProcessedEmailInput {
  emailUid: string;
  messageId: string;
  fromAddress: string;
  subject: string;
  status: 'success' | 'skipped' | 'error';
  category?: string;
  priority?: string;
  notionPageId?: string;
  notionPageUrl?: string;
  errorMessage?: string;
  aiProvider?: string;
  processingTimeMs?: number;
  rawAnalysis?: string;
}

export const processedEmailRepository = {
  create(data: CreateProcessedEmailInput): LogEntry {
    const db = getDb();
    const result = db.prepare(
      `INSERT INTO processed_emails (email_uid, message_id, from_address, subject, status, category, priority, notion_page_id, notion_page_url, error_message, ai_provider, processing_time_ms, raw_analysis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.emailUid,
      data.messageId,
      data.fromAddress,
      data.subject,
      data.status,
      data.category ?? null,
      data.priority ?? null,
      data.notionPageId ?? null,
      data.notionPageUrl ?? null,
      data.errorMessage ?? null,
      data.aiProvider ?? null,
      data.processingTimeMs ?? null,
      data.rawAnalysis ?? null,
    );

    const row = db.prepare('SELECT * FROM processed_emails WHERE id = ?').get(result.lastInsertRowid) as ProcessedEmailRow;
    return toLogEntry(row);
  },

  findByUid(uid: string): LogEntry | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM processed_emails WHERE email_uid = ?').get(uid) as ProcessedEmailRow | undefined;
    return row ? toLogEntry(row) : undefined;
  },

  findByMessageId(messageId: string): LogEntry | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM processed_emails WHERE message_id = ?').get(messageId) as ProcessedEmailRow | undefined;
    return row ? toLogEntry(row) : undefined;
  },

  findAll(filters: LogFilters = {}): { data: LogEntry[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }
    if (filters.dateFrom) {
      conditions.push('created_at >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('created_at <= ?');
      params.push(filters.dateTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM processed_emails ${where}`).get(...params) as { count: number };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const rows = db.prepare(
      `SELECT * FROM processed_emails ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as ProcessedEmailRow[];

    return {
      data: rows.map(toLogEntry),
      total: countRow.count,
    };
  },

  getStats(): {
    totalCount: number;
    todayCount: number;
    successRate: number;
    categoryDistribution: { category: string; count: number }[];
  } {
    const db = getDb();

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM processed_emails').get() as { count: number };
    const todayRow = db.prepare(
      "SELECT COUNT(*) as count FROM processed_emails WHERE created_at >= date('now')"
    ).get() as { count: number };
    const successRow = db.prepare(
      "SELECT COUNT(*) as count FROM processed_emails WHERE status = 'success'"
    ).get() as { count: number };

    const successRate = totalRow.count > 0 ? (successRow.count / totalRow.count) * 100 : 0;

    const catRows = db.prepare(
      "SELECT category, COUNT(*) as count FROM processed_emails WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC"
    ).all() as { category: string; count: number }[];

    return {
      totalCount: totalRow.count,
      todayCount: todayRow.count,
      successRate: Math.round(successRate * 100) / 100,
      categoryDistribution: catRows,
    };
  },
};
