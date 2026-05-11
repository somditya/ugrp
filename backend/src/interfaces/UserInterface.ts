import { User, Role } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatarUrl: string | null;
  emailVerified: Date | null;
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}
