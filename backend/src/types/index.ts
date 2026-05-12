import {
  User, Role, Department, GrievanceCategory, StakeholderType,
  Grievance, GrievanceStatus, PriorityFlag, GrievanceTimeline,
  Message, WorkflowRule, Attachment, Notification, NotificationChannel,
  NotificationStatus, AuditLog, Prisma,
} from '@prisma/client';

export {
  User, Role, Department, GrievanceCategory, StakeholderType,
  Grievance, GrievanceStatus, PriorityFlag, GrievanceTimeline,
  Message, WorkflowRule, Attachment, Notification, NotificationChannel,
  NotificationStatus, AuditLog, Prisma,
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    departmentId: string | null;
  };
}

export interface SafeUser {
  id: string;
  universityId: string;
  role: Role;
  name: string;
  departmentId: string | null;
  email: string;
  mobile: string | null;
  isActive: boolean;
}

export function toSafeUser(user: User): SafeUser {
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
