import { prisma } from '@database/prisma/client';
import { hashPassword, verifyPassword } from '@utils/hash';
import { signToken } from '@utils/jwt';
import { toSafeUser } from '@interfaces/UserInterface';

export async function createUser(data: { email: string; name: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({ data: { ...data, passwordHash } });
  const token = signToken({ userId: user.id, role: user.role });

  return { user: toSafeUser(user), token };
}

export async function authenticateUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toSafeUser(user), token };
}
