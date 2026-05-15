import { prisma } from '@database/prisma/client';

export async function generateGrievanceId(departmentId: string, date: Date): Promise<string> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { code: true },
  });

  if (!department) {
    throw new Error('Department not found');
  }

  const year = date.getFullYear();
  const deptCode = department.code.substring(0, 3).toUpperCase();

  const count = await prisma.grievance.count({
    where: {
      departmentId,
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `UGRP-${year}-${deptCode}-${sequence}`;
}