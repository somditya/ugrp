import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { getCategories, getCategoryById, createCategory } from '@controllers/category.controller';

const router = Router();
router.get('/', asyncHandler(getCategories));
router.get('/tree', asyncHandler(getCategories));
router.get('/:id', asyncHandler(getCategoryById));
router.post('/', asyncHandler(createCategory));

export { router as categoryRouter };
