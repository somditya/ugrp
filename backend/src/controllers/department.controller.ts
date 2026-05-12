import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { ApiResponse } from '@types';

export async function getDepartments(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { grievances: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        hod: { select: { id: true, name: true, universityId: true } },
        _count: { select: { grievances: true, users: true } },
      },
    });

    if (!department) {
      const err = new Error('Department not found') as any;
      err.status = 404;
      return next(err);
    }

    res.json({ success: true, data: department } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code } = req.body;
    const department = await prisma.department.create({ data: { name, code } });
    res.status(201).json({ success: true, data: department } as ApiResponse);
  } catch (err) {
    next(err);
  }
}