import { Router } from 'express';
import { processEmails, processEmailsSince } from '../pipeline/email-pipeline';
import { asyncHandler } from './async-handler';

const router = Router();

// POST / — manually trigger email processing (AI analysis pipeline)
router.post('/', asyncHandler(async (_req, res) => {
  const result = await processEmails();
  res.json({
    success: true,
    data: result,
  });
}));

// POST /fetch-today — fetch today's emails and write all to Notion (no AI, header-filtered)
router.post('/fetch-today', asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await processEmailsSince(today);
  res.json({
    success: true,
    data: {
      ...result,
      todayCount: result.filtered,
      message: result.filtered === 0
        ? '오늘 받은 이메일이 없습니다.'
        : `오늘 메일 ${result.filtered}건 중 ${result.written}건 Notion에 작성 완료`,
    },
  });
}));

export const triggerRoutes = router;
