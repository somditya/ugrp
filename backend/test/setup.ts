// Global test setup for Jest + Supertest
import { prisma } from '../src/database/prisma/client';

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up test data between tests
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});