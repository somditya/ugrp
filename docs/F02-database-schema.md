# F02 — Database Schema & Seed Data

| Field | Value |
|-------|-------|
| **Feature ID** | F02 |
| **Phase** | Phase 1 — MVP |
| **Type** | Backend |
| **Stack** | Prisma, PostgreSQL, TypeScript |
| **Depends on** | F01 |
| **Blocks** | F03, F04, F05, F06, F07, F08, F09, F13 |

---

## Overview

Defines the complete relational data model for UGRP using Prisma ORM. Includes all tables, enums, relations, indexes, and seed data covering departments, grievance categories (with correct SLA values per UGC norms), and initial users.

---

## Enums

```prisma
enum Role {
  STUDENT
  TEACHING
  NON_TEACHING
  COMMITTEE
  HOD
  ADMIN
  REGISTRAR
}

enum StakeholderType {
  STUDENT
  TEACHING
  NON_TEACHING
  HEI
  ALL
}

enum GrievanceStatus {
  SUBMITTED
  ACKNOWLEDGED
  UNDER_REVIEW
  CLARIFICATION_REQUESTED
  DELEGATED
  ACTION_TAKEN
  RESOLVED
  APPEALED
  CLOSED
  SLA_BREACHED
}

enum PriorityFlag {
  NORMAL
  HIGH
  CRITICAL
}

enum NotificationChannel {
  EMAIL
  SMS
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

enum ResponderRole {
  COMMITTEE
  HOD
  REGISTRAR
  ADMIN
}
```

---

## Models

### User
```prisma
model User {
  id           String   @id @default(uuid())
  universityId String   @unique
  role         Role
  name         String
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  email        String
  mobile       String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  grievancesFiled    Grievance[]        @relation("Complainant")
  grievancesAssigned Grievance[]        @relation("Responder")
  timelineActions    GrievanceTimeline[]
  messagesSent       Message[]
  notifications      Notification[]
  auditLogs          AuditLog[]
  workflowRules      WorkflowRule[]

  @@index([role])
  @@index([departmentId])
}
```

### Department
```prisma
model Department {
  id         String  @id @default(uuid())
  name       String
  code       String  @unique   // e.g. CSE, MECH, ADM
  hodId      String?
  hod        User?   @relation(fields: [hodId], references: [id])
  users      User[]
  grievances Grievance[]
  categories GrievanceCategory[]
}
```

### GrievanceCategory
```prisma
model GrievanceCategory {
  id                 String          @id @default(uuid())
  name               String
  slug               String          @unique
  parentId           String?
  parent             GrievanceCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children           GrievanceCategory[] @relation("CategoryHierarchy")
  stakeholderType    StakeholderType
  slaWorkingDays     Int
  isPriorityCritical Boolean         @default(false)
  isActive           Boolean         @default(true)
  grievances         Grievance[]
  workflowRules      WorkflowRule[]

  @@index([stakeholderType])
  @@index([isPriorityCritical])
}
```

### Grievance
```prisma
model Grievance {
  id            String          @id @default(uuid())
  grievanceId   String          @unique  // UGRP-2026-CSE-00142
  complainantId String?
  complainant   User?           @relation("Complainant", fields: [complainantId], references: [id])
  categoryId    String
  category      GrievanceCategory @relation(fields: [categoryId], references: [id])
  departmentId  String
  department    Department      @relation(fields: [departmentId], references: [id])
  description   String          @db.Text
  status        GrievanceStatus @default(SUBMITTED)
  priorityFlag  PriorityFlag    @default(NORMAL)
  isAnonymous   Boolean         @default(false)
  responderId   String?
  responder     User?           @relation("Responder", fields: [responderId], references: [id])
  slaDeadline   DateTime
  resolvedAt    DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  timeline      GrievanceTimeline[]
  messages      Message[]
  attachments   Attachment[]
  notifications Notification[]
  feedback      GrievanceFeedback?

  @@index([grievanceId])
  @@index([status])
  @@index([complainantId])
  @@index([slaDeadline])
  @@index([priorityFlag])
  @@index([departmentId])
}
```

### GrievanceTimeline
```prisma
model GrievanceTimeline {
  id          String          @id @default(uuid())
  grievanceId String
  grievance   Grievance       @relation(fields: [grievanceId], references: [id])
  status      GrievanceStatus
  note        String?         @db.Text
  isInternal  Boolean         @default(false)  // hidden from complainant
  actorId     String?
  actor       User?           @relation(fields: [actorId], references: [id])
  createdAt   DateTime        @default(now())

  @@index([grievanceId])
}
```

### Message
```prisma
model Message {
  id          String    @id @default(uuid())
  grievanceId String
  grievance   Grievance @relation(fields: [grievanceId], references: [id])
  senderId    String
  sender      User      @relation(fields: [senderId], references: [id])
  body        String    @db.Text
  createdAt   DateTime  @default(now())

  @@index([grievanceId])
}
```

### WorkflowRule
```prisma
model WorkflowRule {
  id               String          @id @default(uuid())
  categoryId       String?         // null = applies to all categories
  category         GrievanceCategory? @relation(fields: [categoryId], references: [id])
  stakeholderType  StakeholderType @default(ALL)
  responderRole    ResponderRole   @default(COMMITTEE)
  responderId      String?         // specific user, null = all of that role
  responder        User?           @relation(fields: [responderId], references: [id])
  slaOverrideDays  Int?            // overrides category default SLA
  isActive         Boolean         @default(true)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@index([categoryId, stakeholderType])
  @@index([isActive])
}
```

### Attachment
```prisma
model Attachment {
  id          String    @id @default(uuid())
  grievanceId String
  grievance   Grievance @relation(fields: [grievanceId], references: [id])
  filename    String
  storagePath String
  mimeType    String
  size        Int       // bytes
  createdAt   DateTime  @default(now())
}
```

### Notification
```prisma
model Notification {
  id          String             @id @default(uuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id])
  grievanceId String?
  grievance   Grievance?         @relation(fields: [grievanceId], references: [id])
  type        String             // template key e.g. GRIEVANCE_SUBMITTED
  channel     NotificationChannel
  status      NotificationStatus @default(PENDING)
  sentAt      DateTime?
  isRead      Boolean            @default(false)
  createdAt   DateTime           @default(now())

  @@index([userId, isRead])
}
```

### GrievanceFeedback
```prisma
model GrievanceFeedback {
  id          String    @id @default(uuid())
  grievanceId String    @unique
  grievance   Grievance @relation(fields: [grievanceId], references: [id])
  rating      Int       // 1–5
  comment     String?   @db.Text
  createdAt   DateTime  @default(now())
}
```

### AuditLog
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  actorId     String?
  actor       User?    @relation(fields: [actorId], references: [id])
  action      String   // e.g. STATUS_CHANGE, FILE_UPLOAD, SLA_BREACH
  targetTable String
  targetId    String
  metadata    Json     @default("{}")
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([targetTable, targetId])
  @@index([actorId])
}
```

### HolidayCalendar
```prisma
model HolidayCalendar {
  id          String   @id @default(uuid())
  date        DateTime @unique
  description String
  createdAt   DateTime @default(now())
}
```

---

## Seed Data

### Departments (5)

| Code | Name |
|------|------|
| CSE | Computer Science & Engineering |
| MECH | Mechanical Engineering |
| ADM | Administration |
| LIB | Library |
| EXAM | Examination Cell |

### Grievance Categories with SLA

| Category | Stakeholder | SLA (days) | Priority Critical |
|----------|-------------|------------|-------------------|
| Ragging / Anti-Ragging | STUDENT | 1 | ✅ |
| Gender Issue / POSH | ALL | 1 | ✅ |
| Student Academic | STUDENT | 20 | ❌ |
| Student Financial | STUDENT | 20 | ❌ |
| Student Infrastructure | STUDENT | 20 | ❌ |
| Student Administrative | STUDENT | 20 | ❌ |
| Student Placements | STUDENT | 20 | ❌ |
| Student Mental Health | STUDENT | 20 | ❌ |
| Faculty Service Matters | TEACHING | 15 | ❌ |
| Faculty Pay & Allowances | TEACHING | 15 | ❌ |
| Faculty Working Conditions | TEACHING | 15 | ❌ |
| Faculty Contractual | TEACHING | 15 | ❌ |
| Staff Service Matters | NON_TEACHING | 15 | ❌ |
| Staff Pay & Benefits | NON_TEACHING | 15 | ❌ |
| Staff Working Conditions | NON_TEACHING | 15 | ❌ |
| HEI Affiliation | HEI | 20 | ❌ |
| HEI Grant Disbursement | HEI | 20 | ❌ |

### Seed Users

| Role | Count | Purpose |
|------|-------|---------|
| ADMIN | 1 | System administration |
| COMMITTEE | 3 | Grievance committee members |
| HOD | 2 | Department HODs (CSE, ADM) |
| STUDENT | 5 | Test complainants |
| TEACHING | 3 | Test faculty complainants |
| NON_TEACHING | 2 | Test staff complainants |

---

## Claude Code Prompt

```
In /database/schema.prisma define all Prisma models exactly as specified in F02:
User, Department, GrievanceCategory, Grievance, GrievanceTimeline, Message, WorkflowRule,
Attachment, Notification, GrievanceFeedback, AuditLog, HolidayCalendar.

Include all enums: Role, StakeholderType, GrievanceStatus, PriorityFlag,
NotificationChannel, NotificationStatus, ResponderRole.

Add all indexes specified: grievanceId (unique), status, complainantId, slaDeadline,
priorityFlag, departmentId on Grievance. Add categoryId+stakeholderType composite on WorkflowRule.

Write database/seed.ts with:
- 5 departments (CSE, MECH, ADM, LIB, EXAM)
- 17 grievance categories with correct slaWorkingDays and isPriorityCritical flags
  (Ragging and POSH = isPriorityCritical:true, slaWorkingDays:1; students=20 days; staff/faculty=15 days)
- 1 admin user, 3 committee users, 2 HOD users, 5 students, 3 teaching faculty, 2 non-teaching staff

Use realistic Indian university names and IDs.
```

---

## Tests

### Unit — Schema integrity
- **What**: All required fields present, enums exhaustive, all FK relations resolve
- **How**: Run `npx prisma validate`; inspect generated client types
- **Pass**: `Prisma schema validated successfully`

### Unit — Seed runs clean
- **What**: `npx prisma db seed` completes without constraint violations
- **How**: Run on empty DB; check exit code
- **Pass**: Exit code 0; no FK violation errors

### Unit — Category SLA values
- **What**: Ragging and POSH categories have `isPriorityCritical=true`; correct SLA days
- **How**: Query `GrievanceCategory.findMany({ where: { isPriorityCritical: true } })`
- **Pass**: Returns ≥2 records; SLA days match table above

### Unit — Index existence
- **What**: Performance indexes exist on key columns
- **How**: `SELECT indexname FROM pg_indexes WHERE tablename = 'Grievance'`
- **Pass**: Indexes found on `grievanceId`, `status`, `slaDeadline`

### Unit — Self-relation categories
- **What**: Category hierarchy works (parent/child)
- **How**: Create parent category; create child with parentId; query with include children
- **Pass**: Child accessible via `parent.children`

---

## Acceptance Criteria

- [ ] `npx prisma migrate dev` runs without errors on fresh database
- [ ] `npx prisma db seed` populates all 17 categories with correct SLA values
- [ ] Ragging and POSH categories have `isPriorityCritical = true`
- [ ] All enum values are exhaustive (adding a new status requires explicit migration)
- [ ] Audit log table has no update/delete Prisma operations (append-only enforced by convention)
- [ ] All FK relations resolve without circular dependency issues
