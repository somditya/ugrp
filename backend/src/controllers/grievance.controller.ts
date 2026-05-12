import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { GrievanceStatus, PriorityFlag } from '@prisma/client';
import { AuthRequest, ApiResponse } from '@types';

const ITEMS_PER_PAGE = 20;

export async function getGrievances(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const status = req.query.status as string | undefined;
    const priorityFlag = req.query.priorityFlag as string | undefined;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priorityFlag) where.priorityFlag = priorityFlag;

    const [data, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: {
          complainant: { select: { id: true, name: true, universityId: true } },
          category: { select: { id: true, name: true, slug: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.grievance.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit: ITEMS_PER_PAGE,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function getMyGrievances(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const [data, total] = await Promise.all([
      prisma.grievance.findMany({
        where: { complainantId: req.user.id },
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.grievance.count({ where: { complainantId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data,
      meta: { total, page, limit: ITEMS_PER_PAGE, totalPages: Math.ceil(total / ITEMS_PER_PAGE) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getGrievancesByDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { deptId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const [data, total] = await Promise.all([
      prisma.grievance.findMany({
        where: { departmentId: deptId },
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: {
          complainant: { select: { id: true, name: true, universityId: true } },
          category: { select: { id: true, name: true, slug: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.grievance.count({ where: { departmentId: deptId } }),
    ]);

    res.json({
      success: true,
      data,
      meta: { total, page, limit: ITEMS_PER_PAGE, totalPages: Math.ceil(total / ITEMS_PER_PAGE) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const grievance = await prisma.grievance.findUnique({
      where: { id },
      include: {
        complainant: { select: { id: true, name: true, universityId: true } },
        category: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true, code: true } },
        attachments: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!grievance) {
      const err = new Error('Grievance not found') as any;
      err.status = 404;
      return next(err);
    }

    res.json({ success: true, data: grievance });
  } catch (err) {
    next(err);
  }
}

export async function createGrievance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, categoryId, departmentId, description, isAnonymous, priorityFlag } = req.body;

    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const category = await prisma.grievanceCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      const err = new Error('Category not found') as any;
      err.status = 404;
      return next(err);
    }

    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + category.slaWorkingDays);

    const grievanceId = generateGrievanceId(departmentId, new Date());

    const grievance = await prisma.grievance.create({
      data: {
        grievanceId,
        complainantId: isAnonymous ? null : req.user.id,
        categoryId,
        departmentId,
        description,
        isAnonymous: isAnonymous ?? false,
        priorityFlag: priorityFlag || PriorityFlag.NORMAL,
        status: GrievanceStatus.SUBMITTED,
        slaDeadline,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: grievance } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function updateGrievanceStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(GrievanceStatus).includes(status)) {
      const err = new Error('Invalid grievance status') as any;
      err.status = 400;
      return next(err);
    }

    let resolvedAtVal: Date | null | undefined = undefined;
    if (status === GrievanceStatus.RESOLVED) {
      resolvedAtVal = new Date();
    }

    const grievance = await prisma.grievance.update({
      where: { id },
      data: {
        status: status as GrievanceStatus,
        resolvedAt: resolvedAtVal,
        updatedAt: new Date(),
      },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: grievance } as ApiResponse);
  } catch (err: any) {
    if (err.code === 'P2025') {
      err.status = 404;
      err.message = 'Grievance not found';
    }
    next(err);
  }
}

export async function getGrievanceMetrics(_req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await prisma.grievance.groupBy({
      by: ['status'],
      _count: true,
    });

    const byPriority = await prisma.grievance.groupBy({
      by: ['priorityFlag'],
      _count: true,
    });

    const slaBreaches = await prisma.grievance.count({
      where: {
        status: { notIn: [GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED] },
        slaDeadline: { lt: new Date() },
      },
    });

    res.json({
      success: true,
      data: {
        byStatus: metrics,
        byPriority: byPriority,
        slaBreaches,
      },
    });
  } catch (err) {
    next(err);
  }
}

function generateGrievanceId(departmentCode: string, date: Date): string {
  const year = date.getFullYear();
  const deptCode = departmentCode.substring(0, 3).toUpperCase();
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return 'UGRP-' + year + '-' + deptCode + '-' + seq;
}