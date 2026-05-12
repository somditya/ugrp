import { User, Role } from '@prisma/client';

export function toSafeUser(user: User) {
  return {
    id: user.id,
    universityId: user.universityId,
    role: user.role,
    name: user.name,
    departmentId: user.departmentId,
    email: user.email,
    mobile: user.mobile,
    isActive: user.isActive,
  };
}
