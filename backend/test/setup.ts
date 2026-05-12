// Global test setup for Jest + Supertest
import { prisma } from '../src/database/prisma/client';

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up test data between tests — delete in correct order for FK constraints
  await prisma.message.deleteMany({});
  await prisma.grievanceTimeline.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.grievance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.grievanceCategory.deleteMany({});
  await prisma.department.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
