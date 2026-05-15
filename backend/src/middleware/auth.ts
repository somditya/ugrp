import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlocked } from '@services/authService';
import { Role } from '@prisma/client';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    const err = new Error('Authentication required') as any;
    err.status = 401;
    return next(err);
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    if (payload.jti) {
      const blocked = await isTokenBlocked(payload.jti as string);
      if (blocked) {
        const err = new Error('Token has been revoked') as any;
        err.status = 401;
        return next(err);
      }
    }

    (req as any).user = {
      id: payload.sub,
      universityId: payload.universityId,
      role: payload.role,
      departmentId: payload.departmentId || null,
    };

    next();
  } catch (err: any) {
    err.status = 401;
    err.message = err.message || 'Invalid or expired token';
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      const err = new Error('Authentication required') as any;
      err.status = 401;
      return next(err);
    }

    if (!roles.includes(user.role)) {
      const err = new Error('Insufficient permissions') as any;
      err.status = 403;
      return next(err);
    }

    next();
  };
}

export function requireCommittee(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    const err = new Error('Authentication required') as any;
    err.status = 401;
    return next(err);
  }

  const allowed: Role[] = [Role.COMMITTEE, Role.ADMIN, Role.REGISTRAR, Role.HOD];
  if (!allowed.includes(user.role)) {
    const err = new Error('Committee, Admin, Registrar, or HOD access required') as any;
    err.status = 403;
    return next(err);
  }

  next();
}