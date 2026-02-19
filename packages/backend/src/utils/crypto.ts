import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const KEY_FILE_PATH = path.resolve(__dirname, '../../../../data/encryption.key');

function getKey(): Buffer {
  // 1. Use env variable if set
  const hex = env.encryptionKey;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, 'hex');
  }

  // 2. Read from key file if exists
  if (fs.existsSync(KEY_FILE_PATH)) {
    const stored = fs.readFileSync(KEY_FILE_PATH, 'utf8').trim();
    if (stored.length === 64) {
      return Buffer.from(stored, 'hex');
    }
  }

  // 3. Auto-generate and save
  const dataDir = path.dirname(KEY_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const newKey = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(KEY_FILE_PATH, newKey, 'utf8');
  return Buffer.from(newKey, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
