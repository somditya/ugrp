// Re-export Prisma client singleton
import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global access to PrismaClient in development to prevent
  // hot-reload from creating too many instances.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : [],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };
