import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { upload } from '@middleware/upload';
import { requireAuth } from '@middleware/auth';
import {
  getGrievances, getGrievanceById, createGrievance, updateGrievanceStatus,
  getMyGrievances, getGrievanceTimeline, addTimelineNote,
  getGrievancesByDepartment, getGrievanceMetrics,
  uploadAttachments,
} from '@controllers/grievance.controller';

const router = Router();

router.get('/', asyncHandler(getGrievances));
router.get('/my', requireAuth, asyncHandler(getMyGrievances));
router.get('/department/:deptId', asyncHandler(getGrievancesByDepartment));
router.get('/metrics', asyncHandler(getGrievanceMetrics));
router.get('/:id', asyncHandler(getGrievanceById));
router.post('/', requireAuth, asyncHandler(createGrievance));
router.patch('/:id/status', asyncHandler(updateGrievanceStatus));

router.get('/:id/timeline', asyncHandler(getGrievanceTimeline));
router.post('/:id/timeline', asyncHandler(addTimelineNote));

router.post('/:id/attachments', requireAuth, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds 5MB limit' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Maximum 5 files allowed' });
      }
      return res.status(415).json({ error: err.message });
    }
    next();
  });
}, asyncHandler(uploadAttachments));

export { router as grievanceRouter };
