# F04 — Grievance Submission Form

| Field | Value |
|-------|-------|
| **Feature ID** | F04 |
| **Phase** | Phase 1 — MVP |
| **Type** | Full-stack |
| **Stack** | Next.js, React Hook Form, Zod, Express, Prisma, Multer |
| **Depends on** | F01, F02, F03 |
| **Blocks** | F05, F06, F08, F09 |

---

## Overview

The core data-entry feature. A 3-step multi-page form allowing any authenticated user to file a grievance. Includes category selection, description, file attachments, auto-save, and grievance ID generation on submission. All grievances route directly to the Grievance Committee.

---

## Grievance ID Format

```
UGRP-{YEAR}-{DEPT_CODE}-{NNNNN}
```

- `YEAR`: 4-digit calendar year of submission
- `DEPT_CODE`: 3–5 character uppercase department code (e.g. CSE, MECH, ADM)
- `NNNNN`: 5-digit zero-padded sequence number, **reset to 00001 annually per department**

**Examples**: `UGRP-2026-CSE-00142`, `UGRP-2026-ADM-00003`

**Generation logic**: `SELECT COUNT(*) FROM Grievance WHERE departmentId = ? AND YEAR(createdAt) = ?` → pad to 5 digits.

---

## API Endpoints

### POST /api/v1/grievances

**Auth**: `requireAuth`

**Request (multipart/form-data)**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `categoryId` | UUID | ✅ | Must exist in DB |
| `departmentId` | UUID | ✅ | Must exist in DB |
| `description` | string | ✅ | 50–2000 characters |
| `isAnonymous` | boolean | ❌ | Default false |
| `attachments` | File[] | ❌ | Max 5 files, 5MB each |

**Logic**
1. Validate body with Zod
2. Load category; check `isPriorityCritical`
3. Look up active `WorkflowRule` matching `{ categoryId, stakeholderType }` → get `responderId`
4. If no rule: default `responderRole = COMMITTEE`, assign to any active COMMITTEE user
5. Generate `grievanceId`
6. Calculate `slaDeadline`: today + `category.slaWorkingDays` business days (skip weekends + holidays)
7. Create `Grievance` + `GrievanceTimeline(status=SUBMITTED)` in a DB transaction
8. If `priorityFlag = CRITICAL`: dispatch `priorityCriticalQueue` job immediately
9. Dispatch `slaQueue` jobs (warning + breach) — see F08
10. Dispatch `notificationQueue` job: event `GRIEVANCE_SUBMITTED` — see F09
11. Create `AuditLog` entry
12. Return `{ grievanceId, status: "SUBMITTED", slaDeadline }`

**Error responses**

| Code | Condition |
|------|-----------|
| 422 | Validation failure (description too short, invalid category) |
| 413 | File size exceeds 5MB |
| 400 | More than 5 attachments |
| 415 | Unsupported file type |

---

### POST /api/v1/grievances/:id/attachments

**Auth**: `requireAuth` (must be grievance complainant)

Multer config:
- `dest`: `./uploads/{grievanceId}/`
- `limits.fileSize`: 5 * 1024 * 1024 (5MB)
- `fileFilter`: allow only `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max files per grievance: 5

ClamAV integration: stub — log `[SCAN_PENDING] filename={file}` and mark as clean.

---

### GET /api/v1/categories

**Auth**: `requireAuth`

**Query**: `?stakeholderType=STUDENT`

Returns active categories for the complainant's stakeholder type. Includes parent categories with nested children.

---

## SLA Business Day Calculation

```ts
function addBusinessDays(startDate: Date, days: number, holidays: Date[]): Date {
  let count = 0;
  let current = new Date(startDate);
  while (count < days) {
    current.setDate(current.getDate() + 1);
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const isHoliday = holidays.some(h => isSameDay(h, current));
    if (!isWeekend && !isHoliday) count++;
  }
  return current;
}
```

Holidays fetched from `HolidayCalendar` table on every calculation (cached in Redis for 24h).

---

## Frontend — 3-Step Form

### Step 1: Category & Department

- Stakeholder type auto-detected from `req.user.role`
- Category dropdown (hierarchical): parent category → sub-category
- Department dropdown: all departments from API
- "I want to file anonymously" checkbox (shown only for eligible categories)
- Anonymous option hidden for: Service Matters, Pay & Allowances (identity required)

### Step 2: Description & Attachments

- `<textarea>` with character counter (50 min / 2000 max)
- File upload zone:
  - Drag-and-drop + click-to-browse
  - Preview: filename, size, remove button
  - Progress bar per file
  - Error inline: "File too large", "Unsupported type"
- Auto-save draft to `localStorage` every 60 seconds
- Draft banner on re-visit: "You have a saved draft. Continue?" [Yes] [Discard]

### Step 3: Review & Submit

- Summary of all entered data (read-only)
- "Edit" link back to each step
- Declaration checkbox: "I confirm the information provided is accurate"
- Submit button (disabled until declaration checked)
- Loading state on submit: spinner, "Submitting your grievance..."

### Success Screen

```
╔══════════════════════════════════╗
║  ✓  Grievance Registered         ║
║                                  ║
║  Your ID:                        ║
║  UGRP-2026-CSE-00142             ║
║                                  ║
║  SLA Deadline: 14 Jun 2026       ║
║  (20 working days)               ║
║                                  ║
║  [Track your grievance]          ║
╚══════════════════════════════════╝
```

---

## Claude Code Prompt

```
Build the grievance submission feature end-to-end:

BACKEND:
- POST /api/v1/grievances (Zod validation, grievanceId generation, SLA calc, DB transaction)
- POST /api/v1/grievances/:id/attachments (Multer, file type filter, ClamAV stub)
- GET /api/v1/categories?stakeholderType= (hierarchical, cached)
- Working day calculator function in /backend/utils/slaCalculator.ts
  (skips weekends + HolidayCalendar table, cached in Redis 24h)

FRONTEND:
- /app/submit-grievance/page.tsx — 3-step form with stepper UI
- Step 1: category tree dropdown + department dropdown + anonymous toggle
- Step 2: textarea with char counter + drag-drop file upload with preview
- Step 3: review panel + declaration checkbox + submit
- Success screen with grievanceId displayed prominently
- Auto-save to localStorage every 60s; draft banner on return
- React Hook Form + Zod for client-side validation
- Fully keyboard accessible
```

---

## Tests

### Integration — Grievance ID format
- **What**: Submitted grievance returns ID matching correct pattern
- **Assert**: `grievanceId` matches regex `/^UGRP-\d{4}-[A-Z]{2,5}-\d{5}$/`

### Integration — SLA deadline calculation
- **What**: SLA deadline = submission date + slaWorkingDays, skipping weekends
- **Setup**: Submit on a Friday with 20-day SLA
- **Assert**: `slaDeadline` is 28 calendar days later (skipping 8 weekend days)

### Unit — Working day calculator
- **What**: Function skips weekends and public holidays
- **Cases**:
  - Friday + 1 business day = Monday
  - Friday + 5 business days = next Friday
  - Day before holiday + 1 business day = day after holiday
- **Assert**: All cases return correct dates

### Integration — Priority flag
- **What**: Ragging/POSH category submission sets `priorityFlag = CRITICAL`
- **Setup**: Submit with a category that has `isPriorityCritical = true`
- **Assert**: `Grievance.priorityFlag === "CRITICAL"` in DB

### Integration — File upload validation
- **What**: File type and size limits enforced
- **Assert 1**: Valid PDF upload → 200, attachment record created
- **Assert 2**: 6th file → 400
- **Assert 3**: File > 5MB → 413
- **Assert 4**: `.exe` file → 415

### Integration — Anonymous filing
- **What**: Anonymous flag stores null complainantId
- **Request**: Submit with `isAnonymous: true`
- **Assert**: `Grievance.complainantId === null`; `Grievance.isAnonymous === true`

### E2E — Full form submission
- **What**: User fills 3-step form and sees success screen
- **Flow**: Login → /submit-grievance → fill Step 1 → Next → fill Step 2 → Next → Review → Submit
- **Assert**: Success screen visible; grievanceId displayed in `UGRP-YYYY-XXX-NNNNN` format

### E2E — Draft auto-save
- **What**: Draft persists across page refresh
- **Flow**: Fill Step 1 + 2, wait 65 seconds, refresh page
- **Assert**: Draft banner shown; clicking "Yes" restores form data

---

## Acceptance Criteria

- [ ] Grievance ID generated in correct format on every submission
- [ ] SLA deadline skips weekends and configured holidays
- [ ] CRITICAL flag set automatically for Ragging and POSH categories
- [ ] File upload enforces 5-file limit, 5MB per file, allowed types only
- [ ] Anonymous filing stores null complainantId
- [ ] 3-step form with auto-save; draft restored on return
- [ ] Success screen shows grievanceId and SLA deadline
- [ ] All new grievances routed to Grievance Committee by default
