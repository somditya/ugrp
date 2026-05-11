# F11 — Committee Dashboard

| Field | Value |
|-------|-------|
| **Feature ID** | F11 |
| **Phase** | Phase 2 — Automation |
| **Type** | Frontend |
| **Stack** | Next.js, Tailwind CSS, SWR, TypeScript |
| **Depends on** | F03, F05, F06, F07, F09 |
| **Blocks** | None |

---

## Overview

The working interface for Grievance Committee members, HODs, and the Registrar. Displays all assigned/all grievances sorted by SLA urgency. Priority Critical cases highlighted prominently. Inline action panel for status transitions, delegation, and notes.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🏛 UGRP — Committee       Dr. Priya Sharma  🔔2  [Logout]│
├──────────┬──────────────────────────────────────────────┤
│ FILTERS  │  Inbox (14 open)                             │
│          │                                              │
│ Status   │  🔴 UGRP-2026-CSE-00199  URGENT             │
│ [All ▾]  │  Ragging · Student · ████████████ Breached  │
│          │  [Acknowledge]                               │
│ Category │  ─────────────────────────────────────────  │
│ [All ▾]  │  🟡 UGRP-2026-ADM-00142  Faculty Service    │
│          │  Service Matters · Teaching · ████░░ 2d left │
│ Dept     │  [Acknowledge]                               │
│ [All ▾]  │  ─────────────────────────────────────────  │
│          │  🔵 UGRP-2026-MECH-00098  Student Academic  │
│ Type     │  Academic · Student · ██░░░░ 12d left        │
│ [All ▾]  │  [Acknowledge]                               │
│          │                                              │
│ ☐ Mine   │  [Load more]                                 │
└──────────┴──────────────────────────────────────────────┘
```

---

## Inbox Row

Each row shows:
- Grievance ID + priority badge (URGENT in red for CRITICAL)
- Category + stakeholder type badge
- SLA bar: visual fill showing % of SLA consumed
- Action button (primary action for current status)
- Red left border for CRITICAL priority

**Sort order**:
1. CRITICAL priority first
2. Then by `slaDeadline ASC` (nearest deadline first)
3. Then by `createdAt ASC`

---

## Action Panel (Detail View)

Opens as a side panel or full page at `/committee/[grievanceId]`.

### Action buttons by status

| Current Status | Available Actions |
|----------------|------------------|
| SUBMITTED | Acknowledge |
| ACKNOWLEDGED | Start Review, Request Clarification |
| UNDER_REVIEW | Request Clarification, Delegate, Mark Resolved |
| CLARIFICATION_REQUESTED | Mark Resolved, Start Review |
| DELEGATED | Reclaim, Mark Resolved |
| APPEALED | Start Review |

### Action Modal

Each action opens a modal:

```
┌─────────────────────────────────┐
│ Acknowledge Grievance           │
│                                 │
│ Add a note (required)           │
│ ┌─────────────────────────────┐ │
│ │ Grievance received. Under   │ │
│ │ review within 3 days.       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ☐ Internal only (hide from      │
│   complainant)                  │
│                                 │
│           [Cancel] [Confirm]    │
└─────────────────────────────────┘
```

**Delegate modal extras**:
- User search picker (HOD/COMMITTEE roles)
- Optional SLA override field (number of days)

---

## Filters Sidebar

| Filter | Options |
|--------|---------|
| Status | All / Open / Pending / Resolved / SLA Breached |
| Category | Dropdown of all categories |
| Stakeholder type | All / Student / Teaching / Non-Teaching / HEI |
| Department | All departments |
| Date range | Date picker (from / to) |
| My cases only | Toggle — show only grievances assigned to me |

---

## SLA Bar Component

```ts
// Bar fill percentage
const fillPct = Math.min(slaPercent, 100);
// Bar colour
const colour = fillPct >= 100 ? 'red' : fillPct >= 90 ? 'red' : fillPct >= 50 ? 'amber' : 'green';
```

---

## Claude Code Prompt

```
Build /frontend/app/committee/page.tsx and /frontend/app/committee/[id]/page.tsx:

Inbox page:
- requireRole(COMMITTEE, HOD, ADMIN, REGISTRAR) guard
- Grievances fetched via SWR, sorted by CRITICAL first then slaDeadline ASC
- SlaBar component: visual fill bar + colour coded
- CRITICAL rows: red left border + URGENT badge
- Filters sidebar: status, category, stakeholderType, department, dateRange, myOnly toggle
- Inline primary action button per row

Detail page / action panel:
- Full grievance info + vertical timeline
- Message thread (F07 MessageThread component)
- Action buttons filtered by current status (ALLOWED_TRANSITIONS map)
- Action modal: note textarea (required), isInternal toggle
- Delegate modal: user search picker (HOD/COMMITTEE) + SLA override
- All actions call PATCH /api/v1/grievances/:id/status
- Optimistic UI: update status locally, revert on error
```

---

## Tests

### E2E — Inbox sorted by urgency
- **What**: CRITICAL grievances appear at top; then by nearest SLA deadline
- **Setup**: Seed CRITICAL + normal grievances with different deadlines
- **Assert**: CRITICAL row first; remaining rows in SLA deadline order

### E2E — Acknowledge flow
- **What**: Committee clicks Acknowledge, adds note, status updates
- **Flow**: Click Acknowledge → enter note → Confirm
- **Assert**: Status badge changes to ACKNOWLEDGED; timeline entry visible

### E2E — Action buttons contextual
- **What**: SUBMITTED status shows only Acknowledge, not Resolve/Delegate
- **Assert**: Only the Acknowledge button rendered for SUBMITTED grievance

### E2E — Delegate flow
- **What**: Delegate modal shows HOD picker; saving updates responder
- **Flow**: Open delegate modal → select HOD → confirm
- **Assert**: Grievance row shows new responder name; status = DELEGATED

### E2E — Filters work
- **What**: Selecting "My cases only" filters list to current user's assigned grievances
- **Assert**: All visible rows have `responderId === currentUser.id`

### Unit — SLA bar calculation
- **What**: SLA bar fill percentage is correct
- **Cases**: 0% elapsed → 0% fill; 50% elapsed → 50% fill; 100% → 100% (capped)
- **Assert**: Fill percentage matches `slaPercent` capped at 100

---

## Acceptance Criteria

- [ ] CRITICAL grievances always appear first, regardless of SLA time
- [ ] Action buttons are context-sensitive — only valid transitions shown
- [ ] Action modal requires a note before confirming
- [ ] Delegation updates responderId and triggers notification to new responder
- [ ] All filters work in combination (AND logic)
- [ ] "My cases only" toggle persists across page refreshes (stored in URL params)
