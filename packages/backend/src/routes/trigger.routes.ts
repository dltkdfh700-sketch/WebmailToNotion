import { Router } from 'express';
import { processEmails } from '../pipeline/email-pipeline';
import { asyncHandler } from './async-handler';

const router = Router();

// POST / — manually trigger email processing
router.post('/', asyncHandler(async (_req, res) => {
  const result = await processEmails();
  res.json({
    success: true,
    data: result,
  });
}));

export const triggerRoutes = router;
