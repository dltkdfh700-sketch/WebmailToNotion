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

  // Batch load all processed UIDs in one query (replaces N individual DB queries)
  const processedUids = processedEmailRepository.getProcessedUidSet();

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

      // Filter out already-processed UIDs using in-memory Set (O(1) per check)
      const entries = uidlList as Array<string | string[]>;
      const newUidls = entries.filter((item) => {
        const uid = Array.isArray(item) ? item[1] : item;
        return !processedUids.has(uid);
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

/**
 * Fetch only emails received since `sinceDate` by checking headers first (TOP command).
 * Much faster than fetchNewEmails() when only recent emails are needed.
 */
export async function fetchEmailsSince(sinceDate: Date): Promise<RawEmail[]> {
  const settings = settingsRepository.get('pop3');

  if (!settings.host || !settings.user) {
    throw new Error('POP3 settings not configured');
  }

  // Batch load all processed UIDs in one query
  const processedUids = processedEmailRepository.getProcessedUidSet();

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
      const uidlList = await client.UIDL();
      if (!Array.isArray(uidlList) || uidlList.length === 0) {
        await client.QUIT();
        return [];
      }

      // Filter out already-processed UIDs using in-memory Set
      const entries = uidlList as Array<string | string[]>;
      const newUidls = entries.filter((item) => {
        const uid = Array.isArray(item) ? item[1] : item;
        return !processedUids.has(uid);
      });

      if (newUidls.length === 0) {
        await client.QUIT();
        return [];
      }

      logger.info({ total: newUidls.length }, 'Checking email headers for date filtering...');

      // Phase 1: Check headers with TOP to find emails since sinceDate
      const matchingEntries: Array<{ msgNum: string; uid: string }> = [];

      for (const entry of newUidls) {
        const msgNum = Array.isArray(entry) ? entry[0] : entry;
        const uid = Array.isArray(entry) ? entry[1] : entry;
        try {
          const headers = await client.TOP(Number(msgNum), 0);
          if (typeof headers === 'string') {
            const dateMatch = headers.match(/^Date:\s*(.+)$/mi);
            if (dateMatch) {
              const emailDate = new Date(dateMatch[1].trim());
              if (!isNaN(emailDate.getTime()) && emailDate >= sinceDate) {
                matchingEntries.push({ msgNum, uid });
              }
            }
          }
        } catch {
          // If TOP fails, skip this email
        }
      }

      logger.info({ matching: matchingEntries.length, total: newUidls.length }, 'Date-filtered emails found');

      if (matchingEntries.length === 0) {
        await client.QUIT();
        return [];
      }

      // Phase 2: Only RETR the matching emails
      const emails: RawEmail[] = [];
      for (const { msgNum, uid } of matchingEntries) {
        try {
          const raw = await client.RETR(Number(msgNum));
          if (typeof raw === 'string') {
            const messageIdMatch = raw.match(/^Message-I[Dd]:\s*<?([^>\r\n]+)>?/m);
            const messageId = messageIdMatch ? messageIdMatch[1].trim() : `uid-${uid}`;
            emails.push({ uid, messageId, raw });
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

/**
 * Fetch a single email by its UID from the POP3 server.
 * Used for reprocessing failed emails.
 */
export async function fetchEmailByUid(targetUid: string): Promise<RawEmail | null> {
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
      const uidlList = await client.UIDL();
      if (!Array.isArray(uidlList) || uidlList.length === 0) {
        await client.QUIT();
        return null;
      }

      const entries = uidlList as Array<string | string[]>;
      const match = entries.find((item) => {
        const uid = Array.isArray(item) ? item[1] : item;
        return uid === targetUid;
      });

      if (!match) {
        await client.QUIT();
        return null;
      }

      const msgNum = Array.isArray(match) ? match[0] : match;
      const raw = await client.RETR(Number(msgNum));
      await client.QUIT();

      if (typeof raw !== 'string') return null;

      const messageIdMatch = raw.match(/^Message-I[Dd]:\s*<?([^>\r\n]+)>?/m);
      const messageId = messageIdMatch ? messageIdMatch[1].trim() : `uid-${targetUid}`;

      return { uid: targetUid, messageId, raw };
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
