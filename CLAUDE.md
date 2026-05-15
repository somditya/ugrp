# CLAUDE.md — University Grievance Redressal Portal (UGRP)

> Drop this file in the root of the `~/ugrp/` project directory.
> Claude Code reads it automatically at the start of every session.
> It contains the full project context, rules, data model, and feature inventory.

---

## 🏛 Project Identity

| Key | Value |
|-----|-------|
| **Project name** | University Grievance Redressal Portal |
| **Short name** | UGRP |
| **Reference standard** | UGC eSamadhan Portal (https://samadhan.ugc.ac.in) |
| **Regulatory basis** | UGC Grievance Redressal Regulations 2023 |
| **Version** | 1.0 |

---

## 🗂 Monorepo Structure

```
ugrp/
├── CLAUDE.md                ← you are here
├── frontend/                ← Next.js 14 + Tailwind CSS + TypeScript
├── backend/                 ← Express.js + TypeScript
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── queues/              ← Bull job processors
│   ├── utils/
│   └── mocks/               ← LDAP + ERP stubs
├── database/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/
│   └── specs/               ← F01–F15 markdown spec files
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14 (App Router) | SSR, PWA-ready |
| Styling | Tailwind CSS | Utility-first |
| Forms | React Hook Form + Zod | Client validation |
| Data fetching | SWR | Auto-revalidation |
| Backend | Node.js 20 + Express.js | REST API |
| ORM | Prisma | PostgreSQL client |
| Database | PostgreSQL 15 | Primary data store |
| Cache / Queues | Redis 7 + Bull | Sessions, SLA timers, notifications |
| File storage | Local `/uploads/` → swap to MinIO/S3 | Multer |
| Auth | JWT (access 8h + refresh 7d) + OTP | Passport-LDAP for SSO stub |
| Real-time | Socket.io | In-portal messaging |
| Email | Nodemailer (console stub → SMTP) | |
| SMS | MSG91 (console stub → live) | DLT-registered templates |
| Testing: unit/integration | Jest + Supertest + ts-jest | Backend |
| Testing: components | Jest + React Testing Library | Frontend |
| Testing: E2E | Playwright | Full user flows |
| Containerisation | Docker + Docker Compose | |
| Language | TypeScript throughout | Strict mode |

---

## 👥 User Roles

```typescript
enum Role {
  STUDENT,         // UG/PG/PhD — files own grievances
  TEACHING,        // Faculty — files own grievances
  NON_TEACHING,    // Staff — files own grievances
  COMMITTEE,       // Grievance committee — handles all cases
  HOD,             // Head of Dept — receives delegated cases
  ADMIN,           // System admin — full config access
  REGISTRAR        // Observer — read-only dashboards + escalation recipient
}
```

### Access matrix

| Route / Feature | STUDENT | TEACHING | NON_TEACHING | COMMITTEE | HOD | ADMIN | REGISTRAR |
|----------------|---------|----------|--------------|-----------|-----|-------|-----------|
| Submit grievance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own grievances | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| View all grievances | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (read) |
| Update status | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Configure workflow rules | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Admin analytics | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Holiday calendar | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Middleware helpers**
- `requireAuth` — any authenticated user
- `requireRole(...roles)` — specific roles
- `requireCommittee` — shorthand for `COMMITTEE | HOD | ADMIN | REGISTRAR`

---

## 📋 Grievance Lifecycle — Status State Machine

```
SUBMITTED
    │
    ▼
ACKNOWLEDGED
    │
    ├──► UNDER_REVIEW ◄────────────────┐
    │         │                        │
    │    ┌────┴──────────────┐         │
    │    ▼                   ▼         │
    │  CLARIFICATION_    DELEGATED     │
    │  REQUESTED             │         │
    │    │                   └─────────┘
    │    └──────────► ACTION_TAKEN
    │                     │
    │              ┌──────┴──────┐
    │              ▼             ▼
    │           RESOLVED      APPEALED
    │              │             │
    │              ▼             └──► UNDER_REVIEW
    │           CLOSED
    │
    └── (any non-terminal) ──► SLA_BREACHED  [system only]
```

**CLOSED** and **SLA_BREACHED** → terminal for user actions.
**SLA_BREACHED** can only be set by the SLA queue job — never by a user.

---

## ⏱ SLA Policy (UGC Standard)

| Grievance Type | Stakeholder | Max Working Days | Priority |
|----------------|-------------|-----------------|---------|
| Ragging / Gender Issue | STUDENT | Immediate — per existing norms | 🔴 CRITICAL |
| POSH / Sexual Harassment | ALL | Immediate — per existing norms | 🔴 CRITICAL |
| Student Grievances | STUDENT | **20 working days** | NORMAL |
| Teaching Staff Grievances | TEACHING | **15 working days** | NORMAL |
| Non-Teaching Staff Grievances | NON_TEACHING | **15 working days** | NORMAL |
| HEI Grievances | HEI | **20 working days** | NORMAL |

### Anti-Ragging Helpline (always include in CRITICAL timelines)
```
Helpline : 1800-180-5522  (24×7)
Email    : helpline@antiragging.in
Website  : https://www.antiragging.in/
```

### SLA calculation rules
- Count **working days only** (Monday–Friday)
- Exclude dates in the `HolidayCalendar` DB table
- If deadline falls on holiday → rolls to next working day
- SLA warning fires at **90% elapsed**
- SLA breach fires at **100% (deadline)**

---

## 🔀 Routing Policy

> **ALL grievances route directly to the Grievance Committee.**
> There is NO department-level intermediate routing.
> The Committee may delegate to an HOD, but retains ownership and SLA responsibility.

### WorkflowRule override (Admin-configurable — F13)

```typescript
// WorkflowRule fields
{
  categoryId:       UUID | null,   // null = applies to all categories
  stakeholderType:  'STUDENT' | 'TEACHING' | 'NON_TEACHING' | 'HEI' | 'ALL',
  responderRole:    'COMMITTEE' | 'HOD' | 'REGISTRAR' | 'ADMIN',
  responderId:      UUID | null,   // specific user; null = all of that role
  slaOverrideDays:  number | null, // overrides category default SLA
  isActive:         boolean
}
```

**Resolution order on submission**:
1. Find active `WorkflowRule` matching `{categoryId, stakeholderType}`
2. If none: default to `responderRole = COMMITTEE`
3. If `isPriorityCritical = true`: also fire `priorityCriticalQueue` immediately

### Escalation matrix

| Level | Trigger | Notified |
|-------|---------|---------|
| Level 1 | Submission | All COMMITTEE members |
| Level 1A | CRITICAL submission | COMMITTEE + POSH Cell within 1 hour |
| Level 2 | 90% SLA elapsed | Registrar (warning) |
| Level 3 | SLA breached | Registrar + VC |

---

## 🗄 Database Models (Prisma)

### Key models

```
User            — all portal users (complainants + staff + admin)
Department      — university departments (code used in grievance ID)
GrievanceCategory — hierarchical, with slaWorkingDays + isPriorityCritical
Grievance       — core entity; grievanceId format: UGRP-YYYY-DEPT-NNNNN
GrievanceTimeline — append-only log of every status change + notes
Message         — in-portal thread messages per grievance
WorkflowRule    — admin-configured routing rules
Attachment      — uploaded files per grievance
Notification    — email/SMS/in-app records
GrievanceFeedback — post-closure 1-5 star rating + comment
AuditLog        — immutable append-only action log
HolidayCalendar — dates excluded from SLA calculation
SlaJobState     — Bull job persistence for crash recovery
```

### Grievance ID generation

```typescript
// Format: UGRP-{YEAR}-{DEPT_CODE}-{NNNNN}
// Sequence resets annually per department
// Example: UGRP-2026-CSE-00142

const seq = await prisma.grievance.count({
  where: {
    departmentId,
    createdAt: { gte: new Date(`${year}-01-01`) }
  }
});
const grievanceId = `UGRP-${year}-${deptCode}-${String(seq + 1).padStart(5, '0')}`;
```

---

## 🔔 Notification Events

| Event key | Triggered by | Recipients |
|-----------|-------------|-----------|
| `GRIEVANCE_SUBMITTED` | Submission | Complainant |
| `GRIEVANCE_ACKNOWLEDGED` | Committee ack | Complainant |
| `CLARIFICATION_REQUESTED` | Committee | Complainant |
| `ACTION_TAKEN` | Committee | Complainant |
| `SLA_WARNING` | Bull job (90%) | Committee members |
| `SLA_BREACHED` | Bull job (100%) | Committee + Registrar |
| `PRIORITY_CRITICAL` | CRITICAL submission | All COMMITTEE (within 60s) |
| `GRIEVANCE_APPEALED` | Complainant appeal | Committee |
| `CASE_RESOLVED` | Complainant accept | Committee |
| `CASE_CLOSED` | System | Complainant |
| `MESSAGE_RECEIVED` | New message | Other party |
| `DELEGATION` | Committee delegate | Old + new responder |

**Channel delivery per event** — see F09 spec for full matrix.

---

## 🧩 Feature Registry

| ID | Feature | Phase | Type | Status |
|----|---------|-------|------|--------|
| F01 | Project scaffold & Docker setup | 1 — MVP | Infra | ⬜ |
| F02 | Database schema & seed data | 1 — MVP | Backend | ⬜ |
| F03 | Authentication — OTP login & JWT | 1 — MVP | Backend | ⬜ |
| F04 | Grievance submission form | 1 — MVP | Full-stack | ⬜ |
| F05 | Grievance tracking & timeline | 1 — MVP | Full-stack | ⬜ |
| F06 | Status management & committee actions | 1 — MVP | Backend | ⬜ |
| F07 | In-portal messaging | 1 — MVP | Full-stack | ⬜ |
| F08 | SLA timer engine | 2 — Automation | Backend | ⬜ |
| F09 | Notification engine | 2 — Automation | Backend | ⬜ |
| F10 | Complainant dashboard | 2 — Automation | Frontend | ⬜ |
| F11 | Committee dashboard | 2 — Automation | Frontend | ⬜ |
| F12 | Resolution & feedback | 2 — Automation | Full-stack | ⬜ |
| F13 | Admin workflow configuration panel | 2 — Automation | Full-stack | ⬜ |
| F14 | Admin analytics dashboard | 3 — Advanced | Full-stack | ⬜ |
| F15 | LDAP / ERP integration stubs | 3 — Advanced | Backend | ⬜ |

Mark features done by replacing `⬜` with `✅`.

---

## 🧪 Testing Strategy

### Per-feature test types

| Type | Tool | Scope |
|------|------|-------|
| Unit | Jest | Pure functions (SLA calc, status transitions, template rendering) |
| Integration | Jest + Supertest | API endpoints with test PostgreSQL instance |
| E2E | Playwright | Full user flows in a real browser |
| Infra | Docker + shell | Container health, DB connection, migrations |

### Coverage target
- Backend services and controllers: **80% line coverage**
- Critical paths (auth, submission, SLA): **100% branch coverage**

### Test database
- Separate DB: `ugrp_test` — configured via `DATABASE_URL_TEST` env var
- Reset before each integration test suite: `prisma migrate reset --force`
- Seed with minimal fixture data per test file

### Running tests
```bash
# Unit + integration (backend)
cd backend && npm test

# Unit + component (frontend)
cd frontend && npm test

# E2E
cd frontend && npx playwright test

# Coverage report
cd backend && npm run test:coverage
```

---

## 🔐 Security Rules — Always Follow

1. **Never bypass JWT middleware** — all non-public routes require `requireAuth`
2. **Role checks server-side only** — client-side role checks are UI hints, not security
3. **Complainants see only their own grievances** — enforce `WHERE complainantId = req.user.id` for STUDENT/TEACHING/NON_TEACHING roles
4. **Anonymous grievances** — `complainantId = null`; never infer identity from other fields
5. **POSH/Ragging cases** — `isInternal` timeline notes never returned to complainants
6. **AuditLog is append-only** — never write UPDATE or DELETE queries on `AuditLog`
7. **File uploads** — validate MIME type + size before saving; ClamAV scan stub on every upload
8. **SQL injection** — always use Prisma parameterised queries; no raw SQL with user input
9. **OTP rate limit** — 10 OTPs per mobile per hour (Redis counter); enforce even in tests
10. **Admin routes** — `ADMIN_IP_WHITELIST` env var enforced in `requireCommittee` middleware for `/admin/*`

---

## 📁 Spec Files Location

All feature specs are in `/docs/specs/`:

```
docs/specs/
├── F01-project-scaffold.md
├── F02-database-schema.md
├── F03-authentication.md
├── F04-grievance-submission.md
├── F05-tracking.md
├── F06-status-management.md
├── F07-messaging.md
├── F08-sla-engine.md
├── F09-notifications.md
├── F10-complainant-dashboard.md
├── F11-committee-dashboard.md
├── F12-resolution-feedback.md
├── F13-workflow-config.md
├── F14-admin-analytics.md
└── F15-ldap-erp-stubs.md
```

Before implementing any feature, read its spec file first.

---

## 🚦 Development Workflow

When asked to implement a feature:

1. **Read the spec** — `read docs/specs/F{NN}-*.md` before writing any code
2. **Check dependencies** — confirm all dependent features are already built
3. **Write tests first** — create test file before implementation (TDD encouraged)
4. **Implement** — follow the spec exactly; do not add unrequested features
5. **Run tests** — all tests for the feature must pass before marking done
6. **Update CLAUDE.md** — mark the feature `✅` in the Feature Registry

### Commit convention
```
feat(F04): grievance submission form + SLA calculation
test(F04): integration tests for submission endpoint
fix(F03): OTP rate limit counter key collision
```

---

## 🌐 API Conventions

- **Base URL**: `/api/v1/`
- **Auth header**: `Authorization: Bearer {accessToken}`
- **Response envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "hasMore": false }
  }
  ```
- **Error envelope**:
  ```json
  {
    "success": false,
    "error": "Human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "details": [ ... ]
  }
  ```
- **Pagination**: cursor-based using `grievanceId`; default page size 20
- **Dates**: ISO 8601 UTC strings everywhere (`2026-05-08T10:00:00Z`)
- **Validation**: Zod on all request bodies; 422 on failure

---

## 🏗 Environment Variables Quick Reference

```env
DATABASE_URL=postgresql://ugrp_user:password@localhost:5432/ugrp_db
DATABASE_URL_TEST=postgresql://ugrp_user:password@localhost:5432/ugrp_test
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=8h
JWT_REFRESH_EXPIRES=7d
OTP_TTL_SECONDS=600
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
LDAP_MODE=stub           # stub | live
ERP_MODE=stub            # stub | live
SMS_PROVIDER=msg91       # msg91 | twilio | console
SMTP_HOST=...
FRONTEND_URL=http://localhost:3000
ADMIN_IP_WHITELIST=127.0.0.1
```

---

## ❓ Frequently Asked Questions for Claude Code

**Q: Where do all grievances go when submitted?**
A: Directly to the Grievance Committee. No department routing. Committee can later delegate to an HOD via the status DELEGATED action.

**Q: Can a department officer directly handle grievances?**
A: Only if the Admin has configured a WorkflowRule assigning that category to an HOD role. Default is always COMMITTEE.

**Q: How is the grievance ID generated?**
A: `UGRP-{YEAR}-{DEPT_CODE}-{5-digit-seq}`. Sequence resets to 00001 each year per department. See F04.

**Q: What happens to SLA jobs when the server restarts?**
A: Bull/Redis persists jobs. Additionally, `SlaJobState` table in PostgreSQL acts as a backup. On startup, the SLA service re-enqueues any jobs whose `slaDeadline > now()` and are not yet fired.

**Q: How are Ragging/POSH cases different?**
A: `isPriorityCritical = true` on the category. On submission: `priorityFlag = CRITICAL`; `priorityCriticalQueue` fires immediately (no delay); all COMMITTEE members notified within 60 seconds; anti-ragging helpline details written to grievance timeline automatically.

**Q: Can complainants send messages on closed grievances?**
A: No. Message input is disabled when `status === CLOSED`. POST /messages returns 422 for CLOSED grievances.

**Q: What's the difference between RESOLVED and CLOSED?**
A: RESOLVED = complainant accepted resolution. CLOSED = final terminal state after RESOLVED (set automatically). No further actions possible on CLOSED grievances except feedback submission.

**Q: How does anonymous filing work?**
A: `complainantId = null`, `isAnonymous = true` stored on the Grievance. The committee cannot see who filed it. The system still associates the grievance with the user internally for notification delivery, but strips PII from all API responses to non-admin roles.