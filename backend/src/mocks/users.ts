import { User, Role } from '@prisma/client';
import crypto from 'crypto';

export const mockUser: User = {
  id: crypto.randomUUID(),
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '$2a$10$dummyhash1234567890123456789012345678',
  role: Role.USER,
  emailVerified: null,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdmin: User = {
  ...mockUser,
  id: crypto.randomUUID(),
  email: 'admin@example.com',
  role: Role.ADMIN,
};
