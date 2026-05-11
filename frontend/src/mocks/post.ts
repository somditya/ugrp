import { Post } from '@/types';

export const mockPost: Post = {
  id: 'mock-id-1',
  title: 'Mock Post',
  content: 'This is mock content for testing purposes.',
  published: true,
  authorId: 'mock-author-id',
  author: {
    id: 'mock-author-id',
    name: 'Mock Author',
    email: 'mock@example.com',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockPosts: Post[] = [
  { ...mockPost, id: '1', title: 'First Mock Post' },
  { ...mockPost, id: '2', title: 'Second Mock Post' },
];
