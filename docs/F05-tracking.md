# F05 — Grievance Tracking & Timeline

| Field | Value |
|-------|-------|
| **Feature ID** | F05 |
| **Phase** | Phase 1 — MVP |
| **Type** | Full-stack |
| **Stack** | Next.js, Express, Prisma, WebSocket |
| **Depends on** | F01, F02, F03, F04 |
| **Blocks** | F10, F11 |

---

## Overview

Provides real-time visibility into grievance status for all stakeholders. Complainants track their own cases; committee members view all assigned cases. Includes public status lookup by grievance ID (no login required), a detailed timeline view, SLA countdown chips, and accept/appeal actions.

---

## API Endpoints

### GET /api/v1/grievances

**Auth**: `requireAuth`

**Behaviour by role**:
- `STUDENT / TEACHING / NON_TEACHING`: returns only own grievances
- `COMMITTEE / HOD / ADMIN / REGISTRAR`: returns all grievances with optional filters

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | GrievanceStatus | Filter by status |
| `categoryId` | UUID | Filter by category |
| `stakeholderType` | StakeholderType | Filter by stakeholder |
| `departmentId` | UUID | Filter by department |
| `dateFrom` | ISO date | Created after |
| `dateTo` | ISO date | Created before |
| `cursor` | string | Pagination cursor (grievanceId) |
| `limit` | number | Page size (default 20, max 50) |

**Default sort**: `slaDeadline ASC` (most urgent first for committee); `createdAt DESC` for complainants

**Response**
```json
{
  "data": [
    {
      "grievanceId": "UGRP-2026-CSE-00142",
      "category": { "name": "Student Academic", "isPriorityCritical": false },
      "status": "UNDER_REVIEW",
      "priorityFlag": "NORMAL",
      "slaDeadline": "2026-06-14T00:00:00Z",
      "slaPercent": 45,
      "createdAt": "2026-05-07T10:00:00Z"
    }
  ],
  "meta": { "nextCursor": "UGRP-2026-CSE-00141", "hasMore": true }
}
```

---

### GET /api/v1/grievances/:grievanceId

**Auth**: `requireAuth` OR public (limited fields)

**Public response** (no auth): `{ grievanceId, status, createdAt }` only.

**Authenticated response**: full grievance + timeline + messages + attachments.

**Privacy rules**:

| Field | Complainant (own) | Committee | Other complainant |
|-------|------------------|-----------|-------------------|
| Complainant name | ✅ | ✅ (hidden if anon) | ❌ 403 |
| Description | ✅ | ✅ | ❌ 403 |
| Messages | ✅ | ✅ | ❌ 403 |
| Internal timeline notes | ❌ | ✅ | ❌ |
| Attachments | ✅ | ✅ | ❌ 403 |

Anonymous grievance: committee sees `complainant: { name: "Anonymous", universityId: null }`.

---

### GET /api/v1/grievances/public/:grievanceId

**Auth**: None

**Response**: `{ grievanceId, status, createdAt, lastUpdated }`

Used by the public tracking page (enter your grievance ID without logging in).

---

## SLA Countdown Calculation

```ts
function getSlaPercent(createdAt: Date, slaDeadline: Date): number {
  const total = slaDeadline.getTime() - createdAt.getTime();
  const elapsed = Date.now() - createdAt.getTime();
  return Math.min(Math.round((elapsed / total) * 100), 100);
}
```

**SLA chip colours**:

| % Elapsed | Chip colour | Label |
|-----------|-------------|-------|
| < 50% | Green | `{N} days left` |
| 50–90% | Amber | `{N} days left` |
| 90–100% | Red | `{N} days left` |
| > 100% | Red (pulse) | `Overdue by {N} days` |

---

## Frontend Pages

### /track — Public tracking page

- Accessible without login
- Single input: "Enter your Grievance ID"
- On submit: calls `GET /api/v1/grievances/public/:id`
- Shows: status badge, filed date, last updated
- "Login to view full details" link

### /dashboard — Complainant view (see F10)

### /grievances/[id] — Detail page

```
┌─────────────────────────────────────────────┐
│ UGRP-2026-CSE-00142            [UNDER REVIEW]│
│ Student Academic · CSE Dept · 14 Jun SLA    │
├─────────────────────────────────────────────┤
│ TIMELINE                                    │
│ ● Submitted         7 May 2026  10:00 AM    │
│ ● Acknowledged      8 May 2026   9:15 AM    │
│   "Grievance received, under review"        │
│ ● Under Review      8 May 2026   9:16 AM    │
├─────────────────────────────────────────────┤
│ MESSAGES                    [Send message]  │
│ [Committee]  Please provide your marks...   │
│ [You]        Attached marksheet above.      │
├─────────────────────────────────────────────┤
│ ATTACHMENTS                                 │
│ 📎 marksheet.pdf (245 KB)  [Download]       │
├─────────────────────────────────────────────┤
│ [Accept Resolution]  [Appeal]               │
│ (shown only when status = ACTION_TAKEN)     │
└─────────────────────────────────────────────┘
```

- Timeline entries with icon per status, timestamp, actor label
- Internal notes hidden from complainant view
- Message thread (see F07)
- Accept / Appeal buttons visible only when `status === ACTION_TAKEN`

---

## Claude Code Prompt

```
Build the grievance tracking feature:

BACKEND:
- GET /api/v1/grievances (paginated, role-aware, filtered)
- GET /api/v1/grievances/:grievanceId (full detail with timeline, privacy rules)
- GET /api/v1/grievances/public/:grievanceId (no auth, limited fields)
- slaPercent calculation added to all grievance responses

FRONTEND:
- /app/track/page.tsx — public search by grievance ID
- /app/grievances/[id]/page.tsx — full detail page with vertical timeline,
  message thread placeholder (F07), attachment list, accept/appeal buttons
- SLA countdown chip component: green/amber/red by percent elapsed
- Status badge component: colour-coded per GrievanceStatus enum
- Accept/Appeal buttons shown only when status = ACTION_TAKEN
```

---

## Tests

### Integration — Complainant sees own only
- **What**: Complainant cannot see another user's grievances
- **Setup**: Two users, each with one grievance
- **Assert**: User A's GET /grievances returns only their grievance; 403 on `/grievances/{UserB_grievanceId}`

### Integration — Anonymous privacy
- **What**: Committee sees anon grievance; complainant name hidden
- **Assert**: `complainant.name === "Anonymous"` when `isAnonymous = true` in committee response

### Integration — Committee sees all
- **What**: Committee member's list includes grievances from all departments
- **Assert**: Response count matches total grievances in DB

### Integration — Status filter
- **What**: `?status=SUBMITTED` returns only SUBMITTED grievances
- **Assert**: All items in response have `status === "SUBMITTED"`

### Integration — Internal notes hidden
- **What**: Timeline entries with `isInternal = true` not returned to complainant
- **Setup**: Create timeline entry with `isInternal: true`
- **Assert**: Complainant response timeline does not include the internal entry; committee response does

### E2E — Public track page
- **What**: Public tracking page shows correct status without login
- **Flow**: Navigate to `/track`, enter valid grievanceId, submit
- **Assert**: Status chip displays correct status value

### E2E — SLA chip colours
- **What**: Grievances with different SLA elapsed % show correct chip colours
- **Assert**: <50% → green, 50–90% → amber, >90% → red class applied

---

## Acceptance Criteria

- [ ] Complainants see only their own grievances
- [ ] Anonymous grievance complainant name hidden from everyone except system admin
- [ ] Internal timeline notes never returned to complainants
- [ ] Public tracking endpoint works without auth and returns only safe fields
- [ ] SLA chip calculated correctly and updates client-side without page refresh
- [ ] Accept/Appeal buttons shown only when `status === ACTION_TAKEN`
