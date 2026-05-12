import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import {
  getGrievances, getGrievanceById, createGrievance, updateGrievanceStatus,
  getMyGrievances, getGrievanceTimeline, addTimelineNote,
  getGrievancesByDepartment, getGrievanceMetrics,
} from '@controllers/grievance.controller';

const router = Router();

router.get('/', asyncHandler(getGrievances));
router.get('/my', asyncHandler(getMyGrievances));
router.get('/department/:deptId', asyncHandler(getGrievancesByDepartment));
router.get('/metrics', asyncHandler(getGrievanceMetrics));
router.get('/:id', asyncHandler(getGrievanceById));
router.post('/', asyncHandler(createGrievance));
router.patch('/:id/status', asyncHandler(updateGrievanceStatus));

router.get('/:id/timeline', asyncHandler(getGrievanceTimeline));
router.post('/:id/timeline', asyncHandler(addTimelineNote));

export { router as grievanceRouter };
