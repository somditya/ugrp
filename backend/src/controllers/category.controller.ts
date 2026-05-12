import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { ApiResponse } from '@types';

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.grievanceCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const category = await prisma.grievanceCategory.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { grievances: true } },
      },
    });

    if (!category) {
      const err = new Error('Category not found') as any;
      err.status = 404;
      return next(err);
    }

    res.json({ success: true, data: category } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, parentId, stakeholderType, slaWorkingDays, isPriorityCritical } = req.body;
    const category = await prisma.grievanceCategory.create({
      data: { name, slug, parentId, stakeholderType, slaWorkingDays, isPriorityCritical },
    });
    res.status(201).json({ success: true, data: category } as ApiResponse);
  } catch (err) {
    next(err);
  }
}