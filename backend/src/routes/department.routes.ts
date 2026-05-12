import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { getDepartments, getDepartmentById, createDepartment } from '@controllers/department.controller';

const router = Router();
router.get('/', asyncHandler(getDepartments));
router.get('/:id', asyncHandler(getDepartmentById));
router.post('/', asyncHandler(createDepartment));

export { router as departmentRouter };
