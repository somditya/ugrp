import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { AuthRequest, ApiResponse } from '@types';

export async function getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { grievance: { select: { grievanceId: true, title: true } } },
    });

    res.json({ success: true, data: notifications } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { status: 'SENT' as any, sentAt: new Date() },
    });

    res.json({ success: true, data: notification } as ApiResponse);
  } catch (err) {
    next(err);
  }
}