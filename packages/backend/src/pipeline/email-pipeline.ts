import { fetchNewEmails } from '../modules/pop3/pop3.service';
import { parse } from '../modules/parser/email-parser.service';
import { analyzeEmail, getCurrentProviderName, getCategories } from '../modules/analyzer/analyzer.service';
import * as notionService from '../modules/notion/notion.service';
import { processedEmailRepository } from '../database/repositories/processed-email.repository';
import { processingLogRepository } from '../database/repositories/processing-log.repository';
import { logger } from '../utils/logger';

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
