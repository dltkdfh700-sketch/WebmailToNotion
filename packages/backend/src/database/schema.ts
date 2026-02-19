import { getDb } from './connection';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@mail-to-notion/shared';

export function initDatabase(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#6B7280',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processed_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_uid TEXT NOT NULL,
      message_id TEXT NOT NULL,
      from_address TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'success',
      category TEXT,
      priority TEXT,
      notion_page_id TEXT,
      notion_page_url TEXT,
      error_message TEXT,
      ai_provider TEXT,
      processing_time_ms INTEGER,
      raw_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_processed_emails_uid ON processed_emails(email_uid);
    CREATE INDEX IF NOT EXISTS idx_processed_emails_message_id ON processed_emails(message_id);
    CREATE INDEX IF NOT EXISTS idx_processed_emails_status ON processed_emails(status);
    CREATE INDEX IF NOT EXISTS idx_processing_logs_level ON processing_logs(level);
    CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at);
  `);

  // Seed default categories
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (existingCount.count === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, description, color, sort_order, is_default) VALUES (?, ?, ?, ?, 1)'
    );
    for (const cat of DEFAULT_CATEGORIES) {
      insertCategory.run(cat.name, cat.description, cat.color, cat.sortOrder);
    }
  }

  // Seed default settings
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (existingSettings.count === 0) {
    const insertSetting = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?)'
    );
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insertSetting.run(key, JSON.stringify(value));
    }
  }
}
