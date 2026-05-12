import { prisma } from '@database/prisma/client';
import { toSafeUser } from '@interfaces/UserInterface';
import { ApiResponse } from '@types';
import { GrievanceCategory, Role, StakeholderType, NotificationStatus } from '@prisma/client';

export async function getAllCategories(): Promise<GrievanceCategory[]> {
  return prisma.grievanceCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function getCategoryBySlug(slug: string): Promise<GrievanceCategory | null> {
  return prisma.grievanceCategory.findUnique({ where: { slug } });
}

export async function createCategory(data: {
  name: string;
  slug: string;
  stakeholderType: StakeholderType;
  slaWorkingDays: number;
  parentId?: string;
}): Promise<GrievanceCategory> {
  return prisma.grievanceCategory.create({ data } as any);
}

export async function getGrievanceById(id: string) {
  return prisma.grievance.findUnique({
    where: { id },
    include: {
      complainant: { select: { id: true, name: true, universityId: true } },
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      attachments: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });
}

// -------------------- Auth Service --------------------

export async function createUserService(data: {
  universityId: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  departmentId?: string;
}) {
  const { hashPassword } = await import('@utils/hash');
  const { signToken } = await import('@utils/jwt');

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered');

  const uniExisting = await prisma.user.findUnique({ where: { universityId: data.universityId } });
  if (uniExisting) throw new Error('University ID already registered');

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      universityId: data.universityId,
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash,
      departmentId: data.departmentId ?? null,
    },
  });

  const token = signToken({ userId: user.id, role: user.role, departmentId: user.departmentId });
  return { user: toSafeUser(user), token };
}

export async function authenticateUserService(data: { email: string; password: string }) {
  const { verifyPassword } = await import('@utils/hash');
  const { signToken } = await import('@utils/jwt');

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({ userId: user.id, role: user.role, departmentId: user.departmentId });
  return { user: toSafeUser(user), token };
}

// -------------------- Notification Service --------------------

export async function createNotification(data: {
  userId: string;
  grievanceId?: string;
  type: string;
  channel: string;
}) {
  return prisma.notification.create({ data: { ...data, status: NotificationStatus.PENDING } });
}

// -------------------- Workflow Service --------------------

export async function getApplicableWorkflowRules(stakeholderType: StakeholderType, role: Role) {
  return prisma.workflowRule.findMany({
    where: { stakeholderType, responderRole: role, isActive: true },
  });
}