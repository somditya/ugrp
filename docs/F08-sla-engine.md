# F08 — SLA Timer Engine

| Field | Value |
|-------|-------|
| **Feature ID** | F08 |
| **Phase** | Phase 2 — Automation |
| **Type** | Backend |
| **Stack** | Bull, Redis, Node.js, Prisma |
| **Depends on** | F02, F04, F06 |
| **Blocks** | F09 |

---

## Overview

Automated SLA monitoring using Bull job queues backed by Redis. Fires warning reminders at 90% SLA elapsed and breach events at deadline. Integrates with business day calculation to skip weekends and university holidays.

---

## Queue: `slaQueue`

File: `/backend/queues/slaQueue.ts`

**Concurrency**: 5 workers

### Job: `sla-warning`

**Scheduled**: at `90% of SLA window elapsed`

```ts
const warningDelay = (slaDeadline.getTime() - createdAt.getTime()) * 0.9;
slaQueue.add('sla-warning', { grievanceId }, { delay: warningDelay });
```

**Processor logic**:
1. Load grievance; skip if `status` is RESOLVED / CLOSED / SLA_BREACHED
2. Log internal timeline entry: `"SLA warning: less than 10% of time remaining"`, `isInternal: true`
3. Dispatch notification job: event `SLA_WARNING` to all assigned committee members
4. Create `AuditLog`: `action=SLA_WARNING`

---

### Job: `sla-breach`

**Scheduled**: at exact `slaDeadline`

**Processor logic**:
1. Load grievance; skip if RESOLVED / CLOSED / SLA_BREACHED
2. Set `Grievance.status = SLA_BREACHED`
3. Create `GrievanceTimeline` entry
4. Create `AuditLog`: `action=SLA_BREACH`
5. Dispatch notification job: event `SLA_BREACHED` to committee members + Registrar
6. Dispatch escalation: notify all `REGISTRAR` role users

---

## Job ID Strategy

Each grievance gets deterministic job IDs:

```ts
const warningJobId = `sla-warning-${grievanceId}`;
const breachJobId  = `sla-breach-${grievanceId}`;
```

This allows targeted removal when a grievance is resolved:

```ts
await slaQueue.getJob(warningJobId).then(job => job?.remove());
await slaQueue.getJob(breachJobId).then(job => job?.remove());
```

---

## Persistence Backup

Redis is volatile — timer state also written to DB every 5 minutes as a safety net:

```prisma
model SlaJobState {
  grievanceId    String   @id
  warningJobId   String
  breachJobId    String
  slaDeadline    DateTime
  warningFiredAt DateTime?
  breachFiredAt  DateTime?
  updatedAt      DateTime @updatedAt
}
```

On service restart: scan `SlaJobState` for unfired jobs with `slaDeadline > now()`; re-enqueue any missing jobs.

---

## SLA Configuration per Category

| Category | SLA (working days) | Source |
|----------|--------------------|--------|
| Ragging / POSH | 1 (immediate) | `isPriorityCritical = true` |
| Student grievances | 20 | `GrievanceCategory.slaWorkingDays` |
| Teaching/Non-teaching staff | 15 | `GrievanceCategory.slaWorkingDays` |
| HEI grievances | 20 | `GrievanceCategory.slaWorkingDays` |

Workflow rules can override via `WorkflowRule.slaOverrideDays` — see F13.

---

## Claude Code Prompt

```
Build the SLA timer engine in /backend/queues/slaQueue.ts:

- Bull queue "slaQueue" with concurrency 5
- scheduleSlaJobs(grievanceId, createdAt, slaDeadline): schedules sla-warning at 90% and sla-breach at deadline
- Use deterministic job IDs: sla-warning-{grievanceId} and sla-breach-{grievanceId}
- Warning processor: skip if resolved/closed; create internal timeline note; dispatch SLA_WARNING notification
- Breach processor: skip if resolved/closed; set status=SLA_BREACHED; dispatch SLA_BREACHED notification to committee + registrar
- cancelSlaJobs(grievanceId): removes both pending jobs from queue
- Persistence backup: SlaJobState model in Prisma; write state every 5 min; re-enqueue on restart
- Export scheduleSlaJobs and cancelSlaJobs for use in F04 (submission) and F06 (accept/close)
```

---

## Tests

### Unit — Warning job timing
- **What**: Warning job delay = 90% of (slaDeadline - createdAt)
- **Input**: created = Day 0, deadline = Day 20
- **Assert**: Warning job delay = 18 days in ms (± 1 second tolerance)

### Unit — Breach job timing
- **What**: Breach job delay = exact slaDeadline from now
- **Assert**: `breachJob.opts.delay` ≈ `slaDeadline.getTime() - Date.now()` (± 1s)

### Integration — Resolved grievance skips breach
- **What**: Breach processor no-ops if grievance already resolved
- **Setup**: Enqueue breach job; resolve grievance first; let job fire
- **Assert**: `Grievance.status` remains `RESOLVED` (not changed to `SLA_BREACHED`)

### Integration — Status set on breach
- **What**: Unresolved grievance at deadline gets `status = SLA_BREACHED`
- **Setup**: Create grievance with slaDeadline = 100ms from now
- **Assert**: Within 1 second, `Grievance.status === "SLA_BREACHED"`

### Unit — Working day skip
- **What**: SLA deadline correctly skips Saturday/Sunday
- **Cases**: Friday + 1 day = Monday; Friday + 5 days = next Friday
- **Assert**: Both cases return correct dates

### Integration — Cancel on close
- **What**: Closing a grievance removes pending Bull jobs
- **Flow**: Submit grievance → resolve → accept (close)
- **Assert**: `slaQueue.getJob(warningJobId)` returns null after close

---

## Acceptance Criteria

- [ ] Warning job fires at 90% of SLA window (not earlier, not much later)
- [ ] Breach job sets `status = SLA_BREACHED` for unresolved grievances
- [ ] Resolved/closed grievances: both jobs no-op
- [ ] Job IDs are deterministic and can be cancelled by grievanceId
- [ ] On service restart: unfired jobs re-enqueued from `SlaJobState` table
- [ ] SLA deadline respects weekends and `HolidayCalendar` entries
