import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { Role } from '@prisma/client';
import { hashPassword, verifyPassword } from '@utils/hash';
import { signToken } from '@utils/jwt';
import { toSafeUser } from '@types';
import { ApiResponse } from '@types';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { universityId, email, password, name, role, departmentId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered') as any;
      err.status = 409;
      return next(err);
    }

    const uniExisting = await prisma.user.findUnique({ where: { universityId } });
    if (uniExisting) {
      const err = new Error('University ID already registered') as any;
      err.status = 409;
      return next(err);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { universityId, email, name, role: role as Role, passwordHash, departmentId },
    });

    const token = signToken({ userId: user.id, role: user.role, departmentId: user.departmentId });

    res.status(201).json({
      success: true,
      data: { user: toSafeUser(user), token },
    } as ApiResponse<{ user: object; token: string }>);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      const err = new Error('Invalid credentials') as any;
      err.status = 401;
      return next(err);
    }

    const token = signToken({ userId: user.id, role: user.role, departmentId: user.departmentId });

    res.json({
      success: true,
      data: { user: toSafeUser(user), token },
    } as ApiResponse<{ user: object; token: string }>);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    if (!user) {
      const err = new Error('User not found') as any;
      err.status = 404;
      return next(err);
    }

    res.json({ success: true, data: { user: toSafeUser(user) } });
  } catch (err) {
    next(err);
  }
}
