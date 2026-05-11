# F06 — Status Management & Committee Actions

| Field | Value |
|-------|-------|
| **Feature ID** | F06 |
| **Phase** | Phase 1 — MVP |
| **Type** | Backend |
| **Stack** | Express, Prisma, TypeScript |
| **Depends on** | F02, F03, F04 |
| **Blocks** | F08, F11, F12 |

---

## Overview

Implements the state machine governing grievance lifecycle transitions. Committee members update status, add notes, delegate to HODs, and record resolutions. Complainants accept or appeal resolutions. Every transition is logged to the timeline and audit log.

---

## Status State Machine

```
SUBMITTED ──────────────────► ACKNOWLEDGED
                                    │
                           ┌────────┴────────┐
                           ▼                 ▼
                     UNDER_REVIEW   CLARIFICATION_REQUESTED
                           │                 │
                    ┌──────┴──────┐          │
                    ▼             ▼          ▼
                DELEGATED   ACTION_TAKEN ◄───┘
                    │             │
                    │        ┌────┴────┐
                    ▼        ▼         ▼
              UNDER_REVIEW RESOLVED  APPEALED
                               │         │
                               ▼         ▼
                            CLOSED   UNDER_REVIEW

* SLA_BREACHED can be set from any non-terminal status by system only
* CLOSED is terminal — no further transitions
```

---

## API Endpoints

### PATCH /api/v1/grievances/:id/status

**Auth**: `requireCommittee`

**Request**
```json
{
  "status": "ACKNOWLEDGED",
  "note": "Grievance received. Will review within 3 working days.",
  "isInternal": false,
  "delegateTo": null
}
```

**Allowed transitions** (enforced in service layer):

| From | To (allowed) |
|------|-------------|
| SUBMITTED | ACKNOWLEDGED |
| ACKNOWLEDGED | UNDER_REVIEW, CLARIFICATION_REQUESTED |
| UNDER_REVIEW | CLARIFICATION_REQUESTED, DELEGATED, ACTION_TAKEN |
| CLARIFICATION_REQUESTED | UNDER_REVIEW, ACTION_TAKEN |
| DELEGATED | ACTION_TAKEN, UNDER_REVIEW |
| ACTION_TAKEN | RESOLVED (system only, on complainant accept) |
| RESOLVED | CLOSED |
| APPEALED | UNDER_REVIEW |
| ACTION_TAKEN | APPEALED (complainant only) |

**Logic**
1. Load grievance; validate transition is allowed
2. Update `Grievance.status`
3. If `DELEGATED`: update `Grievance.responderId` to `delegateTo`; recalculate `slaDeadline`
4. Create `GrievanceTimeline` entry with `status`, `note`, `isInternal`, `actorId`
5. Create `AuditLog` entry: `action=STATUS_CHANGE`
6. Dispatch notification job for event matching new status
7. Return updated grievance

**Error responses**

| Code | Condition |
|------|-----------|
| 422 | Invalid transition (e.g. SUBMITTED → RESOLVED) |
| 403 | Not assigned to this grievance (unless ADMIN) |
| 404 | Grievance not found |

---

### POST /api/v1/grievances/:id/accept

**Auth**: `requireAuth` — complainant only (must own grievance)

**Conditions**: `status === ACTION_TAKEN` and `complainantId === req.user.id`

**Logic**
1. Validate ownership and status
2. Update `status = RESOLVED`, set `resolvedAt = now()`
3. Create timeline entry: `status=RESOLVED, note="Complainant accepted resolution"`
4. Create AuditLog
5. Dispatch `CASE_RESOLVED` notification
6. Dispatch feedback prompt notification (after 30-minute delay)

---

### POST /api/v1/grievances/:id/appeal

**Auth**: `requireAuth` — complainant only

**Request**
```json
{ "reason": "The action taken does not address my concern because..." }
```

**Conditions**: `status === ACTION_TAKEN` and `complainantId === req.user.id`

**Logic**
1. Validate ownership and status
2. Update `status = APPEALED`
3. Create timeline entry: `note = reason` (visible to committee)
4. Create AuditLog: `action=APPEAL`
5. Dispatch `GRIEVANCE_APPEALED` notification to committee

---

## Delegation

When status is set to `DELEGATED`:

- `delegateTo` must be a valid `User` with role `HOD` or `COMMITTEE`
- Old responder notified: "Grievance UGRP-2026-CSE-00142 has been delegated"
- New responder notified: "Grievance UGRP-2026-CSE-00142 assigned to you"
- SLA deadline recalculated from delegation date (not original submission date)
- Committee retains ownership — can reclaim at any time

---

## Claude Code Prompt

```
Build the status management service:

/backend/services/grievanceStatusService.ts
  - updateStatus(grievanceId, newStatus, actorId, note, isInternal, delegateTo?)
  - validateTransition(currentStatus, newStatus): throws on invalid
  - All transitions as a constant map: ALLOWED_TRANSITIONS
  - Each transition runs in a Prisma transaction: status update + timeline + auditlog + notification job

/backend/routes/grievances.ts — add:
  PATCH /api/v1/grievances/:id/status  (requireCommittee)
  POST  /api/v1/grievances/:id/accept  (requireAuth, complainant only)
  POST  /api/v1/grievances/:id/appeal  (requireAuth, complainant only)

Enforce all transition rules. Delegation recalculates SLA from delegation date.
```

---

## Tests

### Unit — Valid transitions only
- **What**: Invalid transition throws with descriptive error
- **Assert**: `validateTransition("SUBMITTED", "RESOLVED")` throws `InvalidStatusTransitionError`
- **Assert**: Error message names the invalid transition

### Unit — All valid transitions accepted
- **What**: All transitions in the allowed map do not throw
- **How**: Iterate `ALLOWED_TRANSITIONS` map and call `validateTransition` for each

### Integration — Timeline created
- **What**: Every status change appends a `GrievanceTimeline` row
- **Flow**: PATCH status to ACKNOWLEDGED
- **Assert**: `GrievanceTimeline.findMany({ where: { grievanceId } })` count incremented by 1

### Integration — Audit log on every action
- **What**: AuditLog entry created with correct fields
- **Assert**: `AuditLog.action === "STATUS_CHANGE"`, `actorId === committeeUser.id`, `targetId === grievance.id`

### Integration — Complainant accept
- **What**: Accept endpoint only works for owner at ACTION_TAKEN status
- **Assert 1**: Non-owner accept returns 403
- **Assert 2**: Accept on UNDER_REVIEW status returns 422
- **Assert 3**: Valid accept sets `status=RESOLVED` and `resolvedAt` not null

### Integration — Appeal flow
- **What**: Appeal sets correct status and stores reason
- **Assert**: `status = APPEALED`; timeline note contains the reason text

### Integration — Delegation
- **What**: DELEGATED status updates responderId and recalculates SLA
- **Assert**: `Grievance.responderId === delegateTo`; `slaDeadline` is later than original

---

## Acceptance Criteria

- [ ] All status transitions validated; invalid transitions return 422
- [ ] Every transition creates both a `GrievanceTimeline` entry and an `AuditLog` entry
- [ ] Accept: only grievance owner can call; only valid from `ACTION_TAKEN`
- [ ] Appeal: only grievance owner can call; stores reason in timeline
- [ ] Delegation: updates responder, recalculates SLA, notifies both parties
- [ ] `SLA_BREACHED` can only be set by the system (queue job), not by users
