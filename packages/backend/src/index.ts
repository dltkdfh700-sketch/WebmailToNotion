import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { initDatabase } from './database/schema';
import { logger } from './utils/logger';
import { healthRoutes } from './routes/health.routes';
import { categoryRoutes } from './routes/categories.routes';
import { settingsRoutes } from './routes/settings.routes';
import { logRoutes } from './routes/logs.routes';
import { triggerRoutes } from './routes/trigger.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { SchedulerService } from './modules/scheduler/scheduler.service';
import { testAIConnection } from './modules/analyzer/analyzer.service';
import { testPOP3Connection } from './modules/pop3/pop3.service';
import { testConnection as testNotionConnection, ensureCategoryProperty } from './modules/notion/notion.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/trigger', triggerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handler
app.use(errorHandler);

// Check connection status of external services
async function checkServiceStatus(): Promise<void> {
  logger.info('=== Service Status Check ===');

  const [aiResult, pop3Result, notionResult] = await Promise.allSettled([
    testAIConnection(),
    testPOP3Connection(),
    testNotionConnection(),
  ]);

  // AI status
  if (aiResult.status === 'fulfilled') {
    const ai = aiResult.value;
    logger.info({ ok: ai.ok, message: ai.message }, `[AI] ${ai.ok ? 'OK' : 'FAIL'}`);
  } else {
    logger.error({ error: aiResult.reason }, '[AI] FAIL - exception');
  }

  // POP3 (Webmail) status
  if (pop3Result.status === 'fulfilled') {
    const pop3 = pop3Result.value;
    logger.info({ ok: pop3.ok, message: pop3.message }, `[Webmail/POP3] ${pop3.ok ? 'OK' : 'FAIL'}`);
  } else {
    logger.error({ error: pop3Result.reason }, '[Webmail/POP3] FAIL - exception');
  }

  // Notion status
  if (notionResult.status === 'fulfilled') {
    const notion = notionResult.value;
    logger.info({ ok: notion.ok, message: notion.message }, `[Notion] ${notion.ok ? 'OK' : 'FAIL'}`);
  } else {
    logger.error({ error: notionResult.reason }, '[Notion] FAIL - exception');
  }

  logger.info('=== Status Check Complete ===');
}

// Bootstrap
async function bootstrap() {
  try {
    initDatabase();
    logger.info('Database initialized');

    const scheduler = SchedulerService.getInstance();
    scheduler.initialize();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);

      // Check AI, Webmail, Notion status after server is ready
      checkServiceStatus()
        .then(() => ensureCategoryProperty())
        .catch((err) => {
          logger.error({ error: (err as Error).message }, 'Status check failed');
        });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
