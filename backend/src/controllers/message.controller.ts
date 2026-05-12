import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { AuthRequest, ApiResponse } from '@types';

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { grievanceId } = req.params;
    const messages = await prisma.message.findMany({
      where: { grievanceId },
      include: { sender: { select: { id: true, name: true, universityId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: messages } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { grievanceId } = req.params;
    const { body } = req.body;

    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const message = await prisma.message.create({
      data: { grievanceId, senderId: req.user.id, body },
      include: { sender: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, data: message } as ApiResponse);
  } catch (err) {
    next(err);
  }
}