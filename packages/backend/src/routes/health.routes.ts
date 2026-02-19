import { Router } from 'express';
import { SchedulerService } from '../modules/scheduler/scheduler.service';

const router = Router();

router.get('/', (_req, res) => {
  const scheduler = SchedulerService.getInstance();
  const status = scheduler.getStatus();

  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      scheduler: {
        enabled: status.enabled,
        running: status.running,
        lastRun: status.lastRun,
        nextRun: status.nextRun,
      },
    },
  });
});

export const healthRoutes = router;
