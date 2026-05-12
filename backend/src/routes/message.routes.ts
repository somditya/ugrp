import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { getMessages, sendMessage } from '@controllers/message.controller';

const router = Router();
router.get('/grievance/:grievanceId', asyncHandler(getMessages));
router.post('/grievance/:grievanceId', asyncHandler(sendMessage));

export { router as messageRouter };
