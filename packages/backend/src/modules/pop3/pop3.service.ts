import Pop3Client from 'node-pop3';
import type { RawEmail } from '@mail-to-notion/shared';
import { settingsRepository } from '../../database/repositories/settings.repository';
import { processedEmailRepository } from '../../database/repositories/processed-email.repository';
import { logger } from '../../utils/logger';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn({ attempt, delay, error: (error as Error).message }, 'POP3 retry');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

export async function fetchNewEmails(): Promise<RawEmail[]> {
  const settings = settingsRepository.get('pop3');

  if (!settings.host || !settings.user) {
    throw new Error('POP3 settings not configured');
  }

  return withRetry(async () => {
    const client = new Pop3Client({
      host: settings.host,
      port: settings.port,
      tls: settings.tls,
      tlsOptions: { rejectUnauthorized: false },
      user: settings.user,
      password: settings.password,
    });

    try {
      // Get UIDL list
      const uidlList = await client.UIDL();
      if (!Array.isArray(uidlList) || uidlList.length === 0) {
        await client.QUIT();
        return [];
      }

      // Filter out already-processed UIDs
      const entries = uidlList as Array<string | string[]>;
      const newUidls = entries.filter((item) => {
        const uid = Array.isArray(item) ? item[1] : item;
        return !processedEmailRepository.findByUid(uid);
      });

      if (newUidls.length === 0) {
        await client.QUIT();
        return [];
      }

      logger.info({ count: newUidls.length }, 'Found new emails');

      const emails: RawEmail[] = [];
      for (const entry of newUidls) {
        const msgNum = Array.isArray(entry) ? entry[0] : entry;
        const uid = Array.isArray(entry) ? entry[1] : entry;
        try {
          const raw = await client.RETR(Number(msgNum));
          if (typeof raw === 'string') {
            // Extract Message-ID from raw content
            const messageIdMatch = raw.match(/^Message-I[Dd]:\s*<?([^>\r\n]+)>?/m);
            const messageId = messageIdMatch ? messageIdMatch[1].trim() : `uid-${uid}`;

            emails.push({
              uid,
              messageId,
              raw,
            });
          }
        } catch (error) {
          logger.error({ uid, error: (error as Error).message }, 'Failed to retrieve email');
        }
      }

      await client.QUIT();
      return emails;
    } catch (error) {
      try { await client.QUIT(); } catch { /* ignore quit errors */ }
      throw error;
    }
  });
}

export async function testPOP3Connection(): Promise<{ ok: boolean; message: string }> {
  const settings = settingsRepository.get('pop3');

  if (!settings.host || !settings.user) {
    return { ok: false, message: 'POP3 settings not configured' };
  }

  try {
    const client = new Pop3Client({
      host: settings.host,
      port: settings.port,
      tls: settings.tls,
      tlsOptions: { rejectUnauthorized: false },
      user: settings.user,
      password: settings.password,
    });

    const stat = await client.STAT();
    await client.QUIT();
    return { ok: true, message: `Connected successfully. ${stat} messages on server.` };
  } catch (error) {
    return { ok: false, message: `Connection failed: ${(error as Error).message}` };
  }
}
