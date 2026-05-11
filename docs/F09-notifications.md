# F09 — Notification Engine

| Field | Value |
|-------|-------|
| **Feature ID** | F09 |
| **Phase** | Phase 2 — Automation |
| **Type** | Backend |
| **Stack** | Bull, Nodemailer, MSG91, Redis |
| **Depends on** | F02, F04, F08 |
| **Blocks** | F10, F11 |

---

## Overview

Multi-channel notification dispatch via Bull job queues. Handles email (SMTP stub), SMS (MSG91 stub), and in-app notifications. Includes a special priority-critical queue for immediate alerting on Ragging/POSH submissions.

---

## Notification Templates

File: `/backend/services/notificationTemplates.ts`

| Template Key | Event | Recipients |
|-------------|-------|------------|
| `GRIEVANCE_SUBMITTED` | New grievance filed | Complainant (confirmation) |
| `GRIEVANCE_ACKNOWLEDGED` | Committee acknowledged | Complainant |
| `UNDER_REVIEW` | Status changed to under review | Complainant |
| `CLARIFICATION_REQUESTED` | Committee needs info | Complainant |
| `ACTION_TAKEN` | Resolution posted | Complainant |
| `SLA_WARNING` | 90% SLA elapsed | Committee members |
| `SLA_BREACHED` | SLA deadline passed | Committee + Registrar |
| `GRIEVANCE_APPEALED` | Complainant appealed | Committee |
| `CASE_RESOLVED` | Complainant accepted | Committee |
| `CASE_CLOSED` | Grievance closed | Complainant |
| `PRIORITY_CRITICAL` | Ragging/POSH filed | All COMMITTEE + POSH Cell |
| `MESSAGE_RECEIVED` | New message in thread | Other party |
| `DELEGATION` | Grievance delegated | Old + new responder |

### Template shape

```ts
interface NotificationTemplate {
  subject: (data: Record<string, string>) => string;
  emailBody: (data: Record<string, string>) => string;
  smsBody: (data: Record<string, string>) => string;
  inAppBody: (data: Record<string, string>) => string;
}
```

### Example — GRIEVANCE_SUBMITTED

```ts
GRIEVANCE_SUBMITTED: {
  subject: (d) => `Grievance ${d.grievanceId} registered successfully`,
  emailBody: (d) => `
    Dear ${d.name},
    Your grievance has been registered with ID: ${d.grievanceId}.
    SLA Deadline: ${d.slaDeadline}
    Track your grievance at: ${d.portalUrl}/track
  `,
  smsBody: (d) => `Grievance ${d.grievanceId} registered. SLA: ${d.slaDeadline}. Track: ${d.portalUrl}`,
  inAppBody: (d) => `Your grievance ${d.grievanceId} has been registered.`
}
```

---

## Queue: `notificationQueue`

File: `/backend/queues/notificationQueue.ts`

**Job shape**
```ts
interface NotificationJob {
  userId: string;
  grievanceId?: string;
  event: string;        // template key
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  data: Record<string, string>;
}
```

**Processor**
1. Look up user (email, mobile)
2. Render template for channel
3. Dispatch:
   - `EMAIL`: Nodemailer console transport (log formatted email)
   - `SMS`: Log MSG91-format payload to console
   - `IN_APP`: Write `Notification` record to DB, `status=SENT`, `isRead=false`
4. On success: update `Notification.status = SENT, sentAt = now()`
5. On failure: retry 3× with exponential backoff (1s, 2s, 4s); mark `FAILED` after 3rd attempt

**Concurrency**: 10 workers

---

## Queue: `priorityCriticalQueue`

File: `/backend/queues/priorityCriticalQueue.ts`

Fires immediately (no delay) when `priorityFlag = CRITICAL`.

**Processor**
1. Load all users with role `COMMITTEE`
2. Dispatch `PRIORITY_CRITICAL` notification to each via all channels (EMAIL + SMS + IN_APP)
3. Add internal timeline entry to grievance:
   ```
   URGENT: This is a Priority Critical grievance.
   Anti-Ragging Helpline: 1800-180-5522
   Email: helpline@antiragging.in
   Website: https://www.antiragging.in/
   ```
4. Create `AuditLog`: `action=PRIORITY_CRITICAL_ALERT`

**Maximum delay**: 60 seconds from submission to all committee members notified.

---

## Notification Delivery Rules

| Event | Email | SMS | In-App |
|-------|-------|-----|--------|
| GRIEVANCE_SUBMITTED | ✅ | ✅ | ✅ |
| GRIEVANCE_ACKNOWLEDGED | ✅ | ❌ | ✅ |
| CLARIFICATION_REQUESTED | ✅ | ✅ | ✅ |
| ACTION_TAKEN | ✅ | ✅ | ✅ |
| SLA_WARNING | ✅ | ❌ | ✅ |
| SLA_BREACHED | ✅ | ✅ | ✅ |
| PRIORITY_CRITICAL | ✅ | ✅ | ✅ |
| MESSAGE_RECEIVED | ✅ | ❌ | ✅ |
| CASE_CLOSED | ✅ | ✅ | ✅ |

**Anti-fatigue rule**: Maximum 3 SMS per grievance per day to any single user.

---

## Claude Code Prompt

```
Build the notification engine:

/backend/services/notificationTemplates.ts
  - All 13 template keys with subject, emailBody, smsBody, inAppBody functions

/backend/queues/notificationQueue.ts
  - Bull queue, concurrency 10
  - Processor: render template → dispatch channel → update Notification record
  - Retry 3x exponential backoff on failure
  - Anti-fatigue: Redis counter sms_count:{userId}:{date} max 3/day

/backend/queues/priorityCriticalQueue.ts
  - Immediate (no delay) job
  - Notify all COMMITTEE users via all channels
  - Write anti-ragging helpline details to grievance timeline

Export helper: dispatchNotification(job: NotificationJob) used by F06, F08
```

---

## Tests

### Unit — Template rendering
- **What**: Each template key produces correct output with given data variables
- **Assert**: `GRIEVANCE_SUBMITTED.smsBody({ grievanceId: "UGRP-2026-CSE-00001", ... })` contains grievanceId

### Integration — Notification record created
- **What**: Sent IN_APP notification creates DB record with `status=SENT`
- **Assert**: `Notification.findFirst({ where: { grievanceId, channel: "IN_APP" } }).status === "SENT"`

### Integration — Retry on failure
- **What**: Failed notification retries 3× before marking FAILED
- **Setup**: Mock email transport to throw on first 2 calls; succeed on 3rd
- **Assert**: Notification eventually shows `status=SENT`; log shows 2 retries

### Integration — Max retries → FAILED
- **What**: After 3 failures, notification marked FAILED
- **Setup**: Mock transport to always throw
- **Assert**: After Bull retries exhausted, `Notification.status === "FAILED"`

### Integration — Priority critical speed
- **What**: CRITICAL grievance triggers notification within 60 seconds
- **Setup**: Submit grievance with `isPriorityCritical = true` category
- **Assert**: All `COMMITTEE` users have `Notification` records within 60s

### Unit — Anti-ragging details in timeline
- **What**: CRITICAL submission adds anti-ragging helpline to grievance timeline
- **Assert**: `GrievanceTimeline` entry contains `1800-180-5522` and `antiragging.in`

### Unit — Anti-fatigue SMS
- **What**: 4th SMS to same user same day is blocked
- **Setup**: Seed Redis counter `sms_count:{userId}:{today} = 3`
- **Assert**: 4th SMS job skips dispatch; logs "SMS limit reached"

---

## Acceptance Criteria

- [ ] All 13 template keys implemented and render without errors
- [ ] IN_APP notifications create DB records readable on the notification bell (F10)
- [ ] Failed notifications retry 3× then mark FAILED — never silently dropped
- [ ] PRIORITY_CRITICAL notifies all committee members within 60 seconds
- [ ] Anti-ragging helpline number (1800-180-5522) appears in timeline for CRITICAL cases
- [ ] SMS anti-fatigue: max 3 SMS per user per grievance per day
- [ ] Switching from console stub to real SMTP/MSG91 requires only env var change, no code change
