import { Client } from '@notionhq/client';
import { fetchNewEmails, fetchEmailsSince, fetchEmailByUid } from '../modules/pop3/pop3.service';
import { parse } from '../modules/parser/email-parser.service';
import { analyzeEmail, getCurrentProviderName, getCategories } from '../modules/analyzer/analyzer.service';
import * as notionService from '../modules/notion/notion.service';
import { processedEmailRepository } from '../database/repositories/processed-email.repository';
import { processingLogRepository } from '../database/repositories/processing-log.repository';
import { settingsRepository } from '../database/repositories/settings.repository';
import { categoryRepository } from '../database/repositories/category.repository';
import { logger } from '../utils/logger';

/**
 * Call Ollama to get a 3-line summary and category for an email.
 */
async function summarizeEmail(
  subject: string,
  from: string,
  body: string,
  categoryNames: string[],
): Promise<{ summary: string; category: string }> {
  const aiSettings = settingsRepository.get('ai');
  const host = aiSettings.ollama.host.replace(/\/+$/, '');
  const model = aiSettings.ollama.model;

  const prompt = `아래 이메일을 분석하세요.

1. 이메일 내용을 한국어 3줄로 요약하세요.
2. 다음 카테고리 중 하나를 선택하세요: ${categoryNames.join(', ')}

반드시 아래 JSON 형식으로만 응답하세요:
{"summary": "줄1\\n줄2\\n줄3", "category": "카테고리명"}

이메일:
제목: ${subject}
보낸이: ${from}
본문:
${body.substring(0, 1500)}`;

  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an email summarizer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    let content = data.message?.content?.trim() ?? '';

    // Handle markdown code block wrapping
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(content) as { summary?: string; category?: string };
    const summary = parsed.summary ?? '요약 없음';
    const category = categoryNames.includes(parsed.category ?? '') ? parsed.category! : 'Other';

    return { summary, category };
  } catch (error) {
    logger.warn({ error: (error as Error).message }, 'AI summarization failed, using fallback');
    // Fallback: first 3 lines of body as summary
    const lines = body.split('\n').filter((l) => l.trim()).slice(0, 3);
    return { summary: lines.join('\n') || 'No content', category: 'Other' };
  }
}

/**
 * Fetch emails received since `sinceDate`, summarize with AI, and write to Notion.
 * Uses TOP command to check headers first, only downloads matching emails.
 */
export async function processEmailsSince(
  sinceDate: Date,
): Promise<{ total: number; filtered: number; written: number; errors: number }> {
  let written = 0;
  let errors = 0;

  try {
    // Use date-filtered fetch (checks headers first, much faster)
    const rawEmails = await fetchEmailsSince(sinceDate);
    logger.info({ count: rawEmails.length, sinceDate: sinceDate.toISOString() }, 'Fetched date-filtered emails from POP3');

    if (rawEmails.length === 0) {
      processingLogRepository.create('info', `No emails found since ${sinceDate.toISOString()}`);
      return { total: 0, filtered: 0, written: 0, errors: 0 };
    }

    // Parse emails
    const parsedEmails = [];
    for (const raw of rawEmails) {
      try {
        const parsed = await parse(raw);
        parsedEmails.push(parsed);
      } catch (error) {
        logger.error({ uid: raw.uid, error: (error as Error).message }, 'Failed to parse email');
      }
    }

    logger.info({ count: parsedEmails.length }, 'Emails parsed for Notion');

    if (parsedEmails.length === 0) {
      processingLogRepository.create('info', `No emails found since ${sinceDate.toISOString()}`);
      return { total: rawEmails.length, filtered: 0, written: 0, errors: 0 };
    }

    // Write to Notion
    const notionSettings = settingsRepository.get('notion');
    if (!notionSettings.apiKey || !notionSettings.databaseId) {
      processingLogRepository.create('error', 'Notion settings not configured');
      return { total: rawEmails.length, filtered: parsedEmails.length, written: 0, errors: parsedEmails.length };
    }

    const client = new Client({ auth: notionSettings.apiKey });
    const categoryNames = categoryRepository.findAll().map((c) => c.name);

    for (const email of parsedEmails) {
      const startTime = Date.now();
      try {
        // Check if already processed by message-id
        const existing = processedEmailRepository.findByMessageId(email.messageId);
        if (existing) {
          logger.info({ messageId: email.messageId }, 'Email already processed, skipping');
          continue;
        }

        // AI: 3-line summary + category
        const { summary, category } = await summarizeEmail(
          email.subject, email.from, email.textBody, categoryNames,
        );

        // Build text content: summary at top, then sender + body preview
        // Ensure total <= 2000 chars for Notion rich_text limit
        const header = `[요약]\n${summary}\n\n보낸이: ${email.from}\n\n`;
        const maxBodyLen = 2000 - header.length;
        const bodyPreview = maxBodyLen > 0 ? email.textBody.substring(0, maxBodyLen) : '';
        const textContent = `${header}${bodyPreview}`;

        const page = await client.pages.create({
          parent: { database_id: notionSettings.databaseId },
          properties: {
            Name: {
              title: [{ text: { content: email.subject.substring(0, 2000) } }],
            },
            '상태': {
              select: { name: '할 일' },
            },
            '날짜': {
              date: { start: email.date.toISOString().split('T')[0] },
            },
            Category: {
              select: { name: category },
            },
            '텍스트': {
              rich_text: [{ text: { content: textContent } }],
            },
          },
        });

        const notionPageUrl = (page as unknown as { url: string }).url ?? '';

        // Record success
        processedEmailRepository.create({
          emailUid: email.uid,
          messageId: email.messageId,
          fromAddress: email.from,
          subject: email.subject,
          status: 'success',
          category,
          notionPageId: page.id,
          notionPageUrl: notionPageUrl,
          aiProvider: 'ollama',
          processingTimeMs: Date.now() - startTime,
        });

        processingLogRepository.create('info', `Written to Notion: [${category}] ${email.subject}`, {
          from: email.from,
          category,
          notionPageId: page.id,
          processingTimeMs: Date.now() - startTime,
        });

        written++;
        logger.info({ subject: email.subject, category, timeMs: Date.now() - startTime }, 'Email written to Notion');
      } catch (error) {
        errors++;
        const errorMsg = (error as Error).message;

        processedEmailRepository.create({
          emailUid: email.uid,
          messageId: email.messageId,
          fromAddress: email.from,
          subject: email.subject,
          status: 'error',
          errorMessage: errorMsg,
          aiProvider: 'ollama',
          processingTimeMs: Date.now() - startTime,
        });

        processingLogRepository.create('error', `Failed to write email to Notion: ${errorMsg}`, {
          subject: email.subject,
          error: errorMsg,
        });

        logger.error({ subject: email.subject, error: errorMsg }, 'Failed to write email to Notion');
      }
    }

    processingLogRepository.create('info', `Scheduler batch: ${written} written, ${errors} errors (since ${sinceDate.toISOString()})`);
    return { total: rawEmails.length, filtered: parsedEmails.length, written, errors };
  } catch (error) {
    const errorMsg = (error as Error).message;
    processingLogRepository.create('error', `Pipeline error: ${errorMsg}`);
    logger.error({ error: errorMsg }, 'Email pipeline error');
    throw error;
  }
}

export async function processEmails(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const rawEmails = await fetchNewEmails();
    logger.info({ count: rawEmails.length }, 'Fetched emails from POP3');

    if (rawEmails.length === 0) {
      processingLogRepository.create('info', 'No new emails to process');
      return { processed: 0, errors: 0 };
    }

    const categories = getCategories();
    const providerName = getCurrentProviderName();

    for (const rawEmail of rawEmails) {
      const startTime = Date.now();

      try {
        // Parse email
        const email = await parse(rawEmail);

        // Check if already processed by message-id
        const existing = processedEmailRepository.findByMessageId(email.messageId);
        if (existing) {
          logger.info({ messageId: email.messageId }, 'Email already processed, skipping');
          processedEmailRepository.create({
            emailUid: email.uid,
            messageId: email.messageId,
            fromAddress: email.from,
            subject: email.subject,
            status: 'skipped',
            aiProvider: providerName,
            processingTimeMs: Date.now() - startTime,
          });
          continue;
        }

        // Analyze with AI
        const analysis = await analyzeEmail(email, categories);

        let notionPageId: string | undefined;
        let notionPageUrl: string | undefined;

        // Create Notion page if it's a requirement
        if (analysis.isRequirement) {
          const page = await notionService.createPage(email, analysis);
          notionPageId = page.id;
          notionPageUrl = page.url;
        }

        // Record success
        processedEmailRepository.create({
          emailUid: email.uid,
          messageId: email.messageId,
          fromAddress: email.from,
          subject: email.subject,
          status: 'success',
          category: analysis.category,
          priority: analysis.priority,
          notionPageId,
          notionPageUrl,
          aiProvider: providerName,
          processingTimeMs: Date.now() - startTime,
          rawAnalysis: JSON.stringify(analysis),
        });

        processingLogRepository.create('info', `Processed: ${email.subject}`, {
          from: email.from,
          category: analysis.category,
          priority: analysis.priority,
          isRequirement: analysis.isRequirement,
          notionPageId,
          processingTimeMs: Date.now() - startTime,
        });

        processed++;
        logger.info(
          { subject: email.subject, category: analysis.category, timeMs: Date.now() - startTime },
          'Email processed successfully',
        );
      } catch (error) {
        errors++;
        const errorMsg = (error as Error).message;

        // Record error but continue processing other emails
        processedEmailRepository.create({
          emailUid: rawEmail.uid,
          messageId: rawEmail.messageId,
          fromAddress: '',
          subject: '',
          status: 'error',
          errorMessage: errorMsg,
          aiProvider: providerName,
          processingTimeMs: Date.now() - startTime,
        });

        processingLogRepository.create('error', `Failed to process email: ${errorMsg}`, {
          uid: rawEmail.uid,
          error: errorMsg,
        });

        logger.error({ uid: rawEmail.uid, error: errorMsg }, 'Failed to process email');
      }
    }

    processingLogRepository.create('info', `Batch complete: ${processed} processed, ${errors} errors`);
  } catch (error) {
    const errorMsg = (error as Error).message;
    processingLogRepository.create('error', `Pipeline error: ${errorMsg}`);
    logger.error({ error: errorMsg }, 'Email pipeline error');
    throw error;
  }

  return { processed, errors };
}

/**
 * Reprocess a single failed email by its log entry ID.
 * Re-fetches from POP3, re-analyzes with AI, and creates Notion page if needed.
 */
export async function reprocessEmail(logId: number): Promise<{
  success: boolean;
  message: string;
  notionPageUrl?: string;
}> {
  const logEntry = processedEmailRepository.findById(logId);
  if (!logEntry) {
    throw new Error('로그 항목을 찾을 수 없습니다.');
  }
  if (logEntry.status !== 'error') {
    throw new Error('오류 상태의 항목만 재처리할 수 있습니다.');
  }

  const startTime = Date.now();

  // Try to re-fetch the email from POP3 server
  const rawEmail = await fetchEmailByUid(logEntry.emailUid);
  if (!rawEmail) {
    throw new Error('POP3 서버에서 해당 이메일을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.');
  }

  // Parse
  const email = await parse(rawEmail);

  // Analyze with AI
  const categories = getCategories();
  const providerName = getCurrentProviderName();
  const analysis = await analyzeEmail(email, categories);

  let notionPageId: string | undefined;
  let notionPageUrl: string | undefined;

  // Create Notion page if it's a requirement
  if (analysis.isRequirement) {
    const page = await notionService.createPage(email, analysis);
    notionPageId = page.id;
    notionPageUrl = page.url;
  }

  // Update the existing error record to success
  processedEmailRepository.updateStatus(logId, {
    status: 'success',
    fromAddress: email.from,
    subject: email.subject,
    category: analysis.category,
    priority: analysis.priority,
    notionPageId,
    notionPageUrl,
    errorMessage: undefined,
    aiProvider: providerName,
    processingTimeMs: Date.now() - startTime,
    rawAnalysis: JSON.stringify(analysis),
  });

  processingLogRepository.create('info', `Reprocessed: ${email.subject}`, {
    logId,
    from: email.from,
    category: analysis.category,
    isRequirement: analysis.isRequirement,
    notionPageId,
    processingTimeMs: Date.now() - startTime,
  });

  logger.info({ logId, subject: email.subject }, 'Email reprocessed successfully');

  return {
    success: true,
    message: analysis.isRequirement
      ? `요구사항으로 판별되어 Notion에 등록되었습니다: ${analysis.title}`
      : `요구사항이 아닌 것으로 판별되었습니다 (카테고리: ${analysis.category})`,
    notionPageUrl,
  };
}
