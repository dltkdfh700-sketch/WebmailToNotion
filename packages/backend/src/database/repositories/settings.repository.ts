import { getDb } from '../connection';
import { encrypt, decrypt } from '../../utils/crypto';
import type { Settings } from '@mail-to-notion/shared';
import { DEFAULT_SETTINGS } from '@mail-to-notion/shared';

const SENSITIVE_PATHS: Record<string, string[]> = {
  pop3: ['password'],
  ai: ['claude.apiKey'],
  notion: ['apiKey'],
};

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function encryptSensitiveFields(key: string, value: Record<string, unknown>): Record<string, unknown> {
  const paths = SENSITIVE_PATHS[key];
  if (!paths) return value;

  const clone = JSON.parse(JSON.stringify(value));
  for (const path of paths) {
    const raw = getNestedValue(clone, path);
    if (typeof raw === 'string' && raw.length > 0) {
      setNestedValue(clone, path, encrypt(raw));
    }
  }
  return clone;
}

function decryptSensitiveFields(key: string, value: Record<string, unknown>): Record<string, unknown> {
  const paths = SENSITIVE_PATHS[key];
  if (!paths) return value;

  const clone = JSON.parse(JSON.stringify(value));
  for (const path of paths) {
    const raw = getNestedValue(clone, path);
    if (typeof raw === 'string' && raw.includes(':')) {
      try {
        setNestedValue(clone, path, decrypt(raw));
      } catch {
        // If decryption fails, leave as-is (may be plaintext from before encryption)
      }
    }
  }
  return clone;
}

export const settingsRepository = {
  get<K extends keyof Settings>(key: K): Settings[K] {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) {
      return DEFAULT_SETTINGS[key] as Settings[K];
    }
    const parsed = JSON.parse(row.value);
    return decryptSensitiveFields(key, parsed) as unknown as Settings[K];
  },

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const db = getDb();
    const encrypted = encryptSensitiveFields(key, value as unknown as Record<string, unknown>);
    db.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    ).run(key, JSON.stringify(encrypted));
  },

  getAll(): Settings {
    return {
      pop3: this.get('pop3'),
      ai: this.get('ai'),
      notion: this.get('notion'),
      scheduler: this.get('scheduler'),
    };
  },
};
