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

// Bootstrap
async function bootstrap() {
  try {
    initDatabase();
    logger.info('Database initialized');

    const scheduler = SchedulerService.getInstance();
    scheduler.initialize();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
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
