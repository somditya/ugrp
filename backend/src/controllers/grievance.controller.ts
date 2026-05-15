import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { GrievanceStatus, PriorityFlag, Role } from '@prisma/client';
import { AuthRequest, ApiResponse } from '@types';
import { generateGrievanceId } from '@utils/grievanceId';
import { calculateSlaDeadline } from '@utils/slaCalculator';

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
    const { categoryId, departmentId, description, isAnonymous, priorityFlag } = req.body;

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

    const workflowRule = await prisma.workflowRule.findFirst({
      where: {
        categoryId,
        stakeholderType: req.user.role === 'STUDENT' ? 'STUDENT' :
                        req.user.role === 'TEACHING' ? 'TEACHING' :
                        req.user.role === 'NON_TEACHING' ? 'NON_TEACHING' : 'ALL',
        isActive: true,
      },
    });

    let responderId = workflowRule?.responderId ?? null;
    if (!responderId) {
      const committeeMember = await prisma.user.findFirst({
        where: { role: 'COMMITTEE', isActive: true },
      });
      responderId = committeeMember?.id ?? null;
    }

    const grievanceId = await generateGrievanceId(departmentId, new Date());
    const slaDeadline = await calculateSlaDeadline(new Date(), category.slaWorkingDays);

    const finalizedPriorityFlag = category.isPriorityCritical ? PriorityFlag.CRITICAL : priorityFlag || PriorityFlag.NORMAL;

    const result = await prisma.$transaction(async (tx) => {
      const grievance = await tx.grievance.create({
        data: {
          grievanceId,
          complainantId: isAnonymous ? null : req.user!.id,
          categoryId,
          departmentId,
          description,
          isAnonymous: isAnonymous ?? false,
          priorityFlag: finalizedPriorityFlag,
          status: GrievanceStatus.SUBMITTED,
          slaDeadline,
          responderId,
        },
      });

      await tx.grievanceTimeline.create({
        data: {
          grievanceId: grievance.id,
          status: GrievanceStatus.SUBMITTED,
          note: isAnonymous ? 'Anonymous grievance submitted' : 'Grievance submitted',
        },
      });

      return grievance;
    });

    res.status(201).json({
      success: true,
      data: {
        grievanceId: result.grievanceId,
        status: result.status,
        slaDeadline: result.slaDeadline,
      },
    } as ApiResponse);
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

export async function uploadAttachments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized') as any;
      err.status = 401;
      return next(err);
    }

    const { id } = req.params;
    const grievance = await prisma.grievance.findUnique({
      where: { id },
    });

    if (!grievance) {
      const err = new Error('Grievance not found') as any;
      err.status = 404;
      return next(err);
    }

    if (grievance.complainantId !== req.user.id && req.user.role !== 'COMMITTEE' && req.user.role !== 'ADMIN') {
      const err = new Error('Not authorized to add attachments') as any;
      err.status = 403;
      return next(err);
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      const err = new Error('No files uploaded') as any;
      err.status = 400;
      return next(err);
    }

    const attachmentCount = await prisma.attachment.count({
      where: { grievanceId: id },
    });

    if (attachmentCount + files.length > 5) {
      const err = new Error('Maximum 5 attachments allowed per grievance') as any;
      err.status = 400;
      return next(err);
    }

    for (const file of files) {
      console.log(`[SCAN_PENDING] filename=${file.originalname}`);
    }

    const attachments = await Promise.all(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            grievanceId: id,
            filename: file.originalname,
            storagePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
          },
        })
      )
    );

    res.status(200).json({
      success: true,
      data: attachments,
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
}