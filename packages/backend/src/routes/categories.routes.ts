import { Router } from 'express';
import { categoryRepository } from '../database/repositories/category.repository';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '@mail-to-notion/shared';
import { asyncHandler } from './async-handler';

const router = Router();

// GET / — list all categories
router.get('/', asyncHandler(async (_req, res) => {
  const categories = categoryRepository.findAll();
  res.json({ success: true, data: categories });
}));

// POST / — create category
router.post('/', validate(createCategorySchema), asyncHandler(async (req, res) => {
  const category = categoryRepository.create(req.body);
  res.status(201).json({ success: true, data: category });
}));

// PUT /:id — update category
router.put('/:id', validate(updateCategorySchema), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid category ID' });
    return;
  }

  const category = categoryRepository.update(id, req.body);
  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  res.json({ success: true, data: category });
}));

// DELETE /:id — delete category
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid category ID' });
    return;
  }

  const result = categoryRepository.delete(id);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.message });
    return;
  }

  res.json({ success: true, data: { message: result.message } });
}));

export const categoryRoutes = router;
