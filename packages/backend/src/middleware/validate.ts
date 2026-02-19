import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: result.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    if (source === 'query') {
      (req as unknown as { validatedQuery: unknown }).validatedQuery = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
}
