import { prisma } from '@database/prisma/client';

export async function getAllPosts(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    }),
    prisma.post.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function createPost(data: { title: string; content?: string | null; authorId: string }) {
  return prisma.post.create({
    data,
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function updatePost(id: string, data: Partial<{ title: string; content: string | null; published: boolean }>) {
  return prisma.post.update({ where: { id }, data });
}

export async function deletePost(id: string) {
  return prisma.post.delete({ where: { id } });
}
