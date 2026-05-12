import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { getUserNotifications, markNotificationRead } from '@controllers/notification.controller';

const router = Router();
router.get('/me', asyncHandler(getUserNotifications));
router.patch('/:id/read', asyncHandler(markNotificationRead));

export { router as notificationRouter };
