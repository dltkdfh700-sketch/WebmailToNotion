import { Router } from 'express';
import { processedEmailRepository } from '../database/repositories/processed-email.repository';
import { validate } from '../middleware/validate';
import { logFiltersSchema } from '@mail-to-notion/shared';
import { asyncHandler } from './async-handler';

const router = Router();

// GET / — list processing logs with pagination and filters
router.get('/', validate(logFiltersSchema, 'query'), asyncHandler(async (req, res) => {
  const filters = (req as unknown as { validatedQuery: unknown }).validatedQuery as {
    status?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };

  const result = processedEmailRepository.findAll(filters);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
}));

export const logRoutes = router;
