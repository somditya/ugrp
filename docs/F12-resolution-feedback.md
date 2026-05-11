# F12 — Resolution & Feedback

| Field | Value |
|-------|-------|
| **Feature ID** | F12 |
| **Phase** | Phase 2 — Automation |
| **Type** | Full-stack |
| **Stack** | Next.js, Express, Prisma, TypeScript |
| **Depends on** | F05, F06, F09 |
| **Blocks** | F14 |

---

## Overview

Closes the grievance lifecycle loop. Complainant reviews the committee's resolution, then either accepts (moving to RESOLVED → CLOSED) or appeals with a reason. After acceptance, a satisfaction feedback prompt (1–5 stars + optional comment) is shown. Feedback data feeds into admin analytics.

---

## API Endpoints

### POST /api/v1/grievances/:id/accept
*(Defined in F06 — duplicated here for completeness)*

On acceptance:
1. Status → RESOLVED, set `resolvedAt`
2. Status → CLOSED (auto, after 0ms — no waiting period needed at committee level)
3. Dispatch `CASE_CLOSED` notification
4. After 5-minute delay, dispatch `FEEDBACK_PROMPT` notification (in-app only)

---

### POST /api/v1/grievances/:id/feedback

**Auth**: `requireAuth` — complainant only

**Conditions**: `Grievance.status === CLOSED` AND `Grievance.complainantId === req.user.id`

**Request**
```json
{
  "rating": 4,
  "comment": "Issue resolved but took longer than expected."
}
```

**Validation**
- `rating`: integer 1–5 (required)
- `comment`: string, max 500 characters (optional)

**Logic**
1. Validate ownership and CLOSED status
2. Check no existing feedback (unique constraint on `grievanceId`)
3. Create `GrievanceFeedback` record
4. Create `AuditLog`: `action=FEEDBACK_SUBMITTED`
5. Return `{ message: "Thank you for your feedback" }`

**Error responses**

| Code | Condition |
|------|-----------|
| 403 | Not grievance owner |
| 409 | Feedback already submitted |
| 422 | Grievance not CLOSED |
| 422 | Rating out of 1–5 range |

---

### GET /api/v1/admin/feedback-summary

**Auth**: `requireCommittee`

**Query**: `dateFrom`, `dateTo`, `departmentId`

**Response**
```json
{
  "overallAvgRating": 3.8,
  "totalFeedbacks": 142,
  "byCategory": [
    { "categoryName": "Student Academic", "avgRating": 4.1, "count": 42 }
  ],
  "byCommitteeMember": [
    { "name": "Dr. Sharma", "avgRating": 4.3, "totalResolved": 28 }
  ],
  "ratingDistribution": [
    { "rating": 1, "count": 5 },
    { "rating": 2, "count": 12 },
    { "rating": 3, "count": 30 },
    { "rating": 4, "count": 55 },
    { "rating": 5, "count": 40 }
  ]
}
```

---

## Frontend — Resolution Flow

### Step 1: Resolution Posted (status = ACTION_TAKEN)

On the `/grievances/[id]` detail page, when status is `ACTION_TAKEN`:

```
┌──────────────────────────────────────────┐
│ ✅  Resolution Posted                     │
│                                          │
│  The committee has taken the following   │
│  action on your grievance:               │
│                                          │
│  "Your supplementary exam has been       │
│   approved. Results will be published    │
│   within 5 working days."               │
│                                          │
│  Resolved by: Committee Member           │
│  Date: 20 May 2026                       │
│                                          │
│  [✓ Accept Resolution]  [✗ Appeal]       │
│                                          │
│  Appeal window closes in: 4 days 12h    │
└──────────────────────────────────────────┘
```

### Step 2a: Accept → Feedback Prompt

After accepting:

```
┌──────────────────────────────────────────┐
│ ✓  Grievance UGRP-2026-CSE-00142 Closed  │
│                                          │
│  How satisfied are you with the          │
│  resolution?                             │
│                                          │
│       ★  ★  ★  ★  ☆                     │
│    1     2     3     4     5             │
│                                          │
│  Optional comment:                       │
│  ┌────────────────────────────────────┐  │
│  │ Issue resolved quickly. Thank you. │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Submit Feedback]       [Skip]          │
└──────────────────────────────────────────┘
```

Star rating:
- Interactive hover + click
- Keyboard accessible: arrow keys change rating, Enter selects
- Each star has `aria-label="Rate N out of 5"`

### Step 2b: Appeal → Reason Form

```
┌──────────────────────────────────────────┐
│ Appeal Grievance UGRP-2026-CSE-00142     │
│                                          │
│  Reason for appeal (required):           │
│  ┌────────────────────────────────────┐  │
│  │ The action taken does not address  │  │
│  │ the issue because...               │  │
│  └────────────────────────────────────┘  │
│  Min 50 characters                       │
│                                          │
│  [Cancel]              [Submit Appeal]   │
└──────────────────────────────────────────┘
```

---

## Claude Code Prompt

```
Build the resolution and feedback feature:

BACKEND:
- Add GrievanceFeedback model to Prisma (id, grievanceId unique FK, rating 1-5, comment, createdAt)
- POST /api/v1/grievances/:id/feedback (owner only, CLOSED status, unique per grievance)
- GET /api/v1/admin/feedback-summary (avgRating by category + by committee member + distribution)

FRONTEND — on /grievances/[id] when status = ACTION_TAKEN:
- Resolution card: shows resolution note from committee, resolved-by, date
- Accept button → animated success screen → feedback prompt slide-in
- Appeal button → appeal reason modal (min 50 chars)

Feedback prompt component:
- 5-star interactive rating (keyboard accessible, aria-labels)
- Optional textarea (max 500 chars)
- Submit / Skip buttons
- On submit: POST /feedback → show "Thank you" message
```

---

## Tests

### Integration — Feedback saved
- **What**: POST /feedback creates correct DB record
- **Assert**: `GrievanceFeedback.rating === 4`; `grievanceId` matches

### Integration — Duplicate blocked
- **What**: Second feedback on same grievance returns 409
- **Flow**: Submit feedback twice for same grievanceId
- **Assert**: Second request returns HTTP 409

### Integration — Only after CLOSED
- **What**: Feedback rejected if grievance not CLOSED
- **Setup**: Grievance in UNDER_REVIEW status
- **Assert**: HTTP 422 with message "Grievance must be CLOSED before feedback"

### Integration — Non-owner blocked
- **What**: Different user cannot submit feedback
- **Assert**: HTTP 403

### E2E — Star rating accessible
- **What**: Star rating operable by keyboard
- **Flow**: Tab to rating; press ArrowRight to increase; press Enter
- **Assert**: Selected rating value changes; `aria-checked` attribute updates

### E2E — Skip feedback
- **What**: Skipping feedback closes prompt without error
- **Flow**: Accept resolution → see feedback prompt → click Skip
- **Assert**: Feedback prompt disappears; no error; no DB record created

---

## Acceptance Criteria

- [ ] Feedback only submittable once per grievance (enforced DB unique + API check)
- [ ] Feedback only allowed when `status === CLOSED`
- [ ] Only the grievance owner can submit feedback
- [ ] Star rating fully keyboard accessible with proper aria attributes
- [ ] Skip button works — no error, no record created
- [ ] Feedback summary API returns correct averages by category and committee member
