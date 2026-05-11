import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { ApiResponse, PaginatedResponse, AuthRequest } from '@types';

const ITEMS_PER_PAGE = 10;

export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      prisma.post.count(),
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
    } as ApiResponse<any> & { meta: PaginatedResponse<unknown>['meta'] });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    if (!post) {
      const err = new Error('Post not found') as any;
      err.status = 404;
      return next(err);
    }

    res.json({ success: true, data: post } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, content } = req.body;
    const authorId = req.user!.id;

    const post = await prisma.post.create({
      data: { title, content: content ?? null, authorId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: post } as ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content: content ?? null }),
        ...(published !== undefined && { published }),
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.json({ success: true, data: post } as ApiResponse);
  } catch (err: any) {
    if (err.code === 'P2025') {
      err.status = 404;
      err.message = 'Post not found';
    }
    next(err);
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      err.status = 404;
      err.message = 'Post not found';
    }
    next(err);
  }
}
