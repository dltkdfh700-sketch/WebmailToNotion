import cron from 'node-cron';
import { settingsRepository } from '../../database/repositories/settings.repository';
import { processEmails } from '../../pipeline/email-pipeline';
import { logger } from '../../utils/logger';

export class SchedulerService {
  private static instance: SchedulerService;
  private task: cron.ScheduledTask | null = null;
  private running = false;
  private lastRun: Date | null = null;
  private nextRun: Date | null = null;
  private processing = false;

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  initialize(): void {
    const settings = settingsRepository.get('scheduler');
    if (settings.enabled) {
      this.start(settings.intervalMinutes);
    }
    logger.info({ enabled: settings.enabled, interval: settings.intervalMinutes }, 'Scheduler initialized');
  }

  start(intervalMinutes?: number): void {
    this.stop();

    const settings = settingsRepository.get('scheduler');
    const interval = intervalMinutes ?? settings.intervalMinutes;
    const cronExpr = `*/${interval} * * * *`;

    this.task = cron.schedule(cronExpr, async () => {
      if (this.processing) {
        logger.warn('Previous processing still running, skipping tick');
        return;
      }

      this.processing = true;
      this.lastRun = new Date();

      try {
        logger.info('Scheduler tick: starting email processing');
        const result = await processEmails();
        logger.info({ result }, 'Scheduler tick: completed');
      } catch (error) {
        logger.error({ error: (error as Error).message }, 'Scheduler tick: error');
      } finally {
        this.processing = false;
        this.computeNextRun(interval);
      }
    });

    this.running = true;
    this.computeNextRun(interval);
    logger.info({ cronExpr, intervalMinutes: interval }, 'Scheduler started');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.running = false;
    this.nextRun = null;
    logger.info('Scheduler stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  getStatus(): {
    enabled: boolean;
    running: boolean;
    lastRun?: string;
    nextRun?: string;
  } {
    const settings = settingsRepository.get('scheduler');
    return {
      enabled: settings.enabled,
      running: this.running,
      lastRun: this.lastRun?.toISOString(),
      nextRun: this.nextRun?.toISOString(),
    };
  }

  private computeNextRun(intervalMinutes: number): void {
    if (this.running) {
      this.nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }
  }
}
