import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = (err as unknown as { statusCode?: number }).statusCode ?? 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}
