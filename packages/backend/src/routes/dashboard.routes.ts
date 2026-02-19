import { Router } from 'express';
import { processedEmailRepository } from '../database/repositories/processed-email.repository';
import { processingLogRepository } from '../database/repositories/processing-log.repository';
import { SchedulerService } from '../modules/scheduler/scheduler.service';
import type { DashboardStats } from '@mail-to-notion/shared';
import { asyncHandler } from './async-handler';

const router = Router();

// GET /stats — return dashboard statistics
router.get('/stats', asyncHandler(async (_req, res) => {
  const stats = processedEmailRepository.getStats();
  const recentLogsResult = processedEmailRepository.findAll({ limit: 10, page: 1 });
  const scheduler = SchedulerService.getInstance();
  const schedulerStatus = scheduler.getStatus();

  const dashboardStats: DashboardStats = {
    totalProcessed: stats.totalCount,
    todayProcessed: stats.todayCount,
    successRate: stats.successRate,
    categoryDistribution: stats.categoryDistribution,
    recentLogs: recentLogsResult.data,
    schedulerStatus: {
      enabled: schedulerStatus.enabled,
      running: schedulerStatus.running,
      lastRun: schedulerStatus.lastRun,
      nextRun: schedulerStatus.nextRun,
    },
  };

  res.json({ success: true, data: dashboardStats });
}));

export const dashboardRoutes = router;
