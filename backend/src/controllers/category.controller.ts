import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { ApiResponse } from '@types';
import { StakeholderType } from '@prisma/client';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const stakeholderType = req.query.stakeholderType as StakeholderType | undefined;

    const where = stakeholderType ? { stakeholderType } : {};

    const categories = await prisma.grievanceCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
      },
    });

    const tree = categories.filter((c) => !c.parentId);
    res.json({ success: true, data: tree } as ApiResponse);
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