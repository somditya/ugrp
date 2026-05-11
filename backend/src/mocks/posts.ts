import { Post } from '@prisma/client';

export const mockPost: Post = {
  id: 'test-id-1',
  title: 'Test Post',
  content: 'Test content',
  published: true,
  authorId: 'test-author-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPostList: Post[] = [
  { ...mockPost, id: '1', title: 'First Post' },
  { ...mockPost, id: '2', title: 'Second Post' },
];
