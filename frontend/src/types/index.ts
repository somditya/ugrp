export interface User {
  id: string;
  universityId: string;
  role: Role;
  name: string;
  departmentId: string | null;
  department?: Department;
  email: string;
  mobile: string | null;
  isActive: boolean;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: GrievanceCategory;
  children?: GrievanceCategory[];
  stakeholderType: StakeholderType;
  slaWorkingDays: number;
  isPriorityCritical: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grievance {
  id: string;
  grievanceId: string;
  complainantId: string | null;
  complainant?: User;
  categoryId: string;
  category: GrievanceCategory;
  departmentId: string;
  department: Department;
  description: string;
  status: GrievanceStatus;
  isAnonymous: boolean;
  priorityFlag: PriorityFlag;
  slaDeadline: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceTimeline {
  id: string;
  grievanceId: string;
  status: GrievanceStatus;
  note: string | null;
  actorId: string | null;
  actor?: User;
  createdAt: string;
}

export interface Message {
  id: string;
  grievanceId: string;
  senderId: string;
  sender: User;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  grievanceId: string | null;
  type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: string | null;
  createdAt: string;
}

export interface Attachment {
  id: string;
  grievanceId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  targetTable: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

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

export enum Role {
  STUDENT = 'STUDENT',
  TEACHING = 'TEACHING',
  NON_TEACHING = 'NON_TEACHING',
  COMMITTEE = 'COMMITTEE',
  ADMIN = 'ADMIN',
  REGISTRAR = 'REGISTRAR',
  HOD = 'HOD',
}

export enum StakeholderType {
  STUDENT = 'STUDENT',
  TEACHING = 'TEACHING',
  NON_TEACHING = 'NON_TEACHING',
  HEI = 'HEI',
  ALL = 'ALL',
}

export enum GrievanceStatus {
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CLARIFICATION_REQUESTED = 'CLARIFICATION_REQUESTED',
  DELEGATED = 'DELEGATED',
  ACTION_TAKEN = 'ACTION_TAKEN',
  RESOLVED = 'RESOLVED',
  APPEALED = 'APPEALED',
  CLOSED = 'CLOSED',
  SLA_BREACHED = 'SLA_BREACHED',
}

export enum PriorityFlag {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface JWTPayload {
  userId: string;
  role: Role;
  departmentId: string | null;
  iat: number;
  exp: number;
}