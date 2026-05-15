# F03 — Authentication — Email OTP & JWT

| Field | Value |
|-------|-------|
| **Feature ID** | F03 |
| **Phase** | Phase 1 — MVP |
| **Type** | Backend |
| **Stack** | Express, JWT, Redis, Nodemailer, Prisma, Zod |
| **Depends on** | F01, F02 |
| **Blocks** | F04, F05, F06, F07, F10, F11, F13 |

---

## Overview

Implements the complete authentication system for all three stakeholder groups — students, teaching faculty, and non-teaching staff. OTP is delivered exclusively to the user's **registered university email address**. No mobile/SMS channel is used for authentication.

Supports:
- **Email OTP login** (primary) — for all user types
- **LDAP SSO** (stub) — for faculty/staff using university credentials
- **JWT access + refresh tokens** — stateless auth with Redis-backed blocklist

---

## Authentication Flow

```
1. User enters University ID (e.g. CSE2024001)
          │
          ▼
2. ERP lookup (stub: mocks/erp-users.json)
   ├─ Not found → 422 "University ID not found"
   └─ Found → fetch registered email + name
          │
          ▼
3. Rate-limit check
   Redis key: otp_rate:{email}
   Max 10 requests per email per hour
   ├─ Exceeded → 429
   └─ OK → continue
          │
          ▼
4. Generate 6-digit numeric OTP
   Store in Redis:
     key   : otp:{universityId}
     value : { otp, attempts: 0, email }
     TTL   : 600 seconds (10 minutes)
          │
          ▼
5. Send OTP email via Nodemailer
   SMTP_MODE=console → logs to terminal (dev/test)
   SMTP_MODE=live    → sends via real SMTP (production)
   ├─ Send fails → delete Redis key → 500 EMAIL_SEND_FAILED
   └─ Send OK → continue
          │
          ▼
6. Return { maskedEmail, expiresIn: 600 }
   e.g. "OTP sent to ra*****@university.edu"

─────────────────────────────────────────

7. User enters 6-digit OTP
          │
          ▼
8. Validate OTP from Redis
   ├─ Key missing → 401 "OTP expired"
   ├─ attempts ≥ 5 → delete key → 401 "Too many attempts"
   └─ OTP mismatch → increment attempts → 401 "Invalid OTP, N remaining"
          │
          ▼
9. OTP correct → DEL otp:{universityId}
          │
          ▼
10. Upsert User in PostgreSQL (from ERP data)
          │
          ▼
11. Issue JWT access token (8h) + refresh token (7d)
    Store SHA-256(refreshToken) in Redis:
      key: refresh:{userId}, TTL: 7d
          │
          ▼
12. Return { accessToken, refreshToken, user }
```

---

## Email OTP Template

The OTP is sent as a styled HTML email with a plain-text fallback.

**Subject**: `Your UGRP Login OTP — 482910`

**HTML email layout**:

```
┌─────────────────────────────────────────────────┐
│  🏛 University Grievance Redressal Portal        │  ← dark blue header
├─────────────────────────────────────────────────┤
│  Dear Rahul Sharma,                             │
│                                                 │
│  Your One-Time Password (OTP) to log in is:     │
│                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│       4   8   2   9   1   0                    │  ← large dashed box
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                                 │
│  ⏱ Valid for 10 minutes. Do not share this OTP. │
│  Portal: https://ugrp.university.edu            │
├─────────────────────────────────────────────────┤
│  University Grievance Redressal Cell            │  ← gray footer
└─────────────────────────────────────────────────┘
```

### Email masking

The full email address is **never returned to the client**. Only a masked version is shown.

| Registered email | Returned to client |
|-----------------|-------------------|
| `rahul.sharma@university.edu` | `ra*****@university.edu` |
| `fac001@university.edu` | `fa***@university.edu` |
| `mohan.lal@university.edu` | `mo*****@university.edu` |

Mask rule: show first 2 characters of the local part, replace the rest with `***`.

---

## API Endpoints

### POST /api/v1/auth/register

Triggers an OTP email to the user's registered university email.

**Request**
```json
{
  "universityId": "CSE2024001"
}
```

> ℹ️ No `email`, `mobile`, or `role` needed — all fetched from ERP by university ID.

**Success response — 200**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to ra*****@university.edu",
    "maskedEmail": "ra*****@university.edu",
    "expiresIn": 600
  }
}
```

**Error responses**

| HTTP | Code | Condition |
|------|------|-----------|
| 422 | `UNPROCESSABLE` | `universityId` missing or < 3 chars |
| 422 | `UNPROCESSABLE` | `universityId` not found in ERP |
| 429 | `TOO_MANY_REQUESTS` | > 10 OTP requests for this email in 1 hour |
| 500 | `EMAIL_SEND_FAILED` | Nodemailer threw; OTP key cleaned up before responding |

---

### POST /api/v1/auth/verify-otp

Validates the OTP, upserts the user, and issues JWT tokens.

**Request**
```json
{
  "universityId": "CSE2024001",
  "otp": "482910"
}
```

**Validation**
- `universityId`: string, min 3 chars
- `otp`: string, exactly 6 chars (Zod `length(6)`)

**Success response — 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Rahul Sharma",
      "role": "STUDENT",
      "universityId": "CSE2024001",
      "email": "rahul.sharma@university.edu",
      "departmentId": "dept-uuid"
    }
  }
}
```

**Error responses**

| HTTP | Condition |
|------|-----------|
| 401 | OTP key not in Redis (expired or never sent) |
| 401 | OTP mismatch — `"Invalid OTP. 3 attempts remaining."` |
| 401 | Attempts exhausted — key deleted — `"Too many incorrect attempts."` |
| 422 | `otp` not exactly 6 characters |

---

### POST /api/v1/auth/refresh

Issues a new access token from a valid refresh token.

**Request**
```json
{ "refreshToken": "eyJ..." }
```

**Logic**
1. Hash the token with SHA-256; check `blocklist:{hash}` in Redis
2. Verify JWT signature with `JWT_REFRESH_SECRET`
3. Compare hash against `refresh:{userId}` in Redis (prevents token reuse after logout)
4. Issue and return a new `accessToken`

**Error responses**

| HTTP | Condition |
|------|-----------|
| 400 | `refreshToken` missing from body |
| 401 | Token blocklisted (revoked on logout) |
| 401 | Invalid or expired JWT signature |
| 401 | Hash mismatch (token replaced by rotation) |

---

### POST /api/v1/auth/logout

Revokes the current refresh token.

**Auth**: `requireAuth` (valid access token required in `Authorization` header)

**Request body**
```json
{ "refreshToken": "eyJ..." }
```

**Logic**
1. Hash token with SHA-256
2. Add to Redis blocklist: `blocklist:{hash}` with TTL = token's remaining lifetime
3. Delete `refresh:{userId}` from Redis

**Success response — 200**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

### POST /api/v1/auth/sso *(LDAP stub)*

SSO login via university LDAP credentials for faculty and staff.

**Request**
```json
{
  "universityId": "FAC001",
  "password": "faculty123"
}
```

**Stub behaviour**: Reads credentials from `mocks/ldap-users.json`.
**Live behaviour**: Set `LDAP_MODE=live` in `.env` — replace stub logic with `passport-ldapauth`.

On success: upserts user, issues tokens — identical response shape to `verify-otp`.

**Error responses**

| HTTP | Condition |
|------|-----------|
| 401 | Credentials not found in LDAP (stub) |
| 422 | Missing `universityId` or `password` |

---

## Email Service

File: `/backend/src/services/emailService.ts`

### Exported functions

```ts
sendMail(options: MailOptions): Promise<void>
otpEmailTemplate(params): MailOptions
notificationEmailTemplate(params): MailOptions  // used by F09
```

### Environment-driven mode switching

| `SMTP_MODE` | Behaviour |
|-------------|-----------|
| `console` (default) | Logs formatted email block to terminal. No actual send. |
| `live` | Sends via Nodemailer with real SMTP credentials. |

**No code change needed to switch modes** — only `.env` changes.

### Console mode output (dev/test)

```
┌─────────────────────────────────────────────────────────
│ [EMAIL STUB]
│ From   : "UGRP Grievances" <grievances@university.edu>
│ To     : rahul.sharma@university.edu
│ Subject: Your UGRP Login OTP — 482910
│ Body   : Dear Rahul Sharma, Your OTP is 482910. Valid 10 minutes...
└─────────────────────────────────────────────────────────
```

### Enabling real SMTP (Gmail example)

```env
# .env
SMTP_MODE=live
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_account@gmail.com
SMTP_PASS=your_app_password       # use a Gmail App Password, not your login password
MAIL_FROM="UGRP Grievances <grievances@university.edu>"
```

---

## Middleware

File: `/backend/src/middleware/auth.ts`

### `requireAuth`

Validates the JWT access token and attaches `req.user` (typed as `JwtPayload`).

```ts
interface JwtPayload {
  userId: string;
  universityId: string;
  role: Role;
  name: string;
  departmentId?: string;
}
```

Returns `401` if no token, malformed, or expired.

### `requireRole(...roles: Role[])`

Checks `req.user.role` against the allowed list.
Returns `403` (not `401`) if the user is authenticated but lacks the required role.

### `requireCommittee`

Shorthand for `requireRole(COMMITTEE, HOD, ADMIN, REGISTRAR)`.

### `requireAdmin`

Shorthand for `requireRole(ADMIN)`.

---

## Security Rules

| Rule | Implementation |
|------|----------------|
| OTP channel | Email only — no SMS, no mobile number required |
| OTP TTL | 600 seconds in Redis |
| OTP brute-force | 5 attempts max; key deleted on 5th wrong answer |
| OTP rate limit | 10 requests per email per hour (Redis counter key: `otp_rate:{email}`) |
| Email failure cleanup | If `sendMail()` throws, OTP key is deleted before returning 500 |
| Full email never exposed | `maskedEmail` in response; full address only in the email itself |
| Refresh token storage | Only SHA-256 hash stored in Redis — raw token never persisted |
| Token blocklist | Logout hashes refresh token → Redis with TTL = remaining life |
| Role enforcement | Server-side only via `requireRole` — client-side checks are UI hints |
| Admin IP whitelist | `ADMIN_IP_WHITELIST` env var enforced in production via `ipWhitelist` middleware |
| CORS | `FRONTEND_URL` only in production |

---

## Redis Key Reference

| Key pattern | Value | TTL | Purpose |
|-------------|-------|-----|---------|
| `otp:{universityId}` | `{ otp, attempts, email }` JSON | 600s | Pending OTP |
| `otp_rate:{email}` | integer count | 3600s | Rate limit counter |
| `refresh:{userId}` | SHA-256 hash string | 7d | Refresh token validation |
| `blocklist:{hash}` | `"1"` | remaining token life | Revoked refresh tokens |

---

## Token Specification

| Token | Algorithm | Secret env var | Expires |
|-------|-----------|---------------|---------|
| Access token | HS256 | `JWT_ACCESS_SECRET` | 8 hours |
| Refresh token | HS256 | `JWT_REFRESH_SECRET` | 7 days |

**JWT payload (both tokens)**:
```json
{
  "userId": "550e8400-...",
  "universityId": "CSE2024001",
  "role": "STUDENT",
  "name": "Rahul Sharma",
  "departmentId": "dept-uuid",
  "iat": 1715000000,
  "exp": 1715028800
}
```

---

## File Map

```
backend/src/
├── controllers/
│   └── authController.ts     ← register, verifyOtp, refresh, logout, ssoLogin
├── services/
│   ├── emailService.ts       ← sendMail, otpEmailTemplate, notificationEmailTemplate
│   ├── prisma.ts             ← singleton Prisma client
│   └── redis.ts              ← singleton ioredis client
├── middleware/
│   └── auth.ts               ← requireAuth, requireRole, requireCommittee, requireAdmin
├── routes/
│   └── auth.ts               ← route wiring → authController
├── mocks/
│   ├── erp-users.json        ← ERP stub data (universityId → email + profile)
│   └── ldap-users.json       ← LDAP stub data (uid + password → profile)
└── test/
    └── auth.test.ts          ← all 16 tests
```

---

## Claude Code Prompt

```
Authentication is fully implemented. Key files listed in File Map above.

To test locally in dev (no real email sent):
  1. docker-compose up -d
  2. cp .env.example .env  (keep SMTP_MODE=console)
  3. cd backend && npm install
  4. npx prisma migrate dev --name init
  5. npx prisma db seed
  6. npm run dev

Register flow:
  POST /api/v1/auth/register   { "universityId": "CSE2024001" }
  → Terminal shows:  [EMAIL STUB] Subject: Your UGRP Login OTP — 482910
  POST /api/v1/auth/verify-otp { "universityId": "CSE2024001", "otp": "482910" }
  → Returns: { accessToken, refreshToken, user }

To enable real email (no code change needed):
  Set SMTP_MODE=live + SMTP_* credentials in .env
  Restart backend: npm run dev

To run all F03 tests:
  cd backend && npm test -- --testPathPattern=auth.test.ts
```

---

## Tests

File: `/backend/src/test/auth.test.ts`

All 16 tests. `sendMail` is mocked via `jest.mock` — no real emails sent during testing.

### POST /api/v1/auth/register

| # | Test | Assert |
|---|------|--------|
| 1 | Valid university ID → 200, OTP sent | `res.body.data.maskedEmail` matches `/^ra\*+@university\.edu$/` |
| 2 | OTP stored in Redis with correct TTL | `redis.get("otp:CSE2024001")` → JSON with 6-digit OTP; TTL between 595–600 |
| 3 | `sendMail` called with OTP email | Called once; `subject` contains "OTP"; `html` contains the 6-digit OTP |
| 4 | Unknown university ID → 422 | `res.status === 422`; error matches `/not found/i` |
| 5 | Missing `universityId` → 422 | `res.status === 422` |
| 6 | Rate limit exceeded → 429 | Seed `otp_rate:{email} = 10`; next request → `res.status === 429` |
| 7 | `sendMail` failure → 500 + OTP key deleted | Mock throws; `res.body.code === "EMAIL_SEND_FAILED"`; `redis.get(otpKey) === null` |

### POST /api/v1/auth/verify-otp

| # | Test | Assert |
|---|------|--------|
| 8 | Correct OTP → tokens + user upserted | `accessToken` defined; `refreshToken` defined; `user.role === "STUDENT"`; User in DB |
| 9 | OTP key deleted after success | `redis.get("otp:CSE2024001") === null` post-verify |
| 10 | Wrong OTP → 401 + counter incremented | `res.status === 401`; `record.attempts === 1` |
| 11 | Max attempts reached → 401 + key deleted | Seed `attempts: 4`; wrong OTP → 401 `too many`; key deleted |
| 12 | Expired / missing OTP → 401 | No Redis key → `res.status === 401`; error matches `/expired/i` |
| 13 | OTP not 6 digits → 422 | `otp: "123"` → `res.status === 422` |

### POST /api/v1/auth/refresh

| # | Test | Assert |
|---|------|--------|
| 14 | Valid refresh token → new access token | `res.body.data.accessToken` defined |
| 15 | Blocklisted token → 401 | Login → logout → refresh → `res.status === 401`; error matches `/revoked/i` |

### JWT middleware

| # | Test | Assert |
|---|------|--------|
| 16a | No Authorization header → 401 | `GET /api/v1/grievances` → 401 |
| 16b | Invalid token → 401 | `Bearer invalidtoken` → 401 |
| 16c | Valid token, wrong role → 403 | STUDENT token on admin route → 403 |

### Email masking

| # | Test | Assert |
|---|------|--------|
| 16d | `maskedEmail` does not expose full address | `maskedEmail` matches `/^ra\*+@/`; does not contain `rahul.sharma` |

---

## Acceptance Criteria

- [ ] `POST /register` accepts only `universityId` — no mobile or email field from client
- [ ] OTP delivered via email, never via SMS
- [ ] `SMTP_MODE=console` logs email to terminal without sending; `SMTP_MODE=live` sends via SMTP — **no code change needed**
- [ ] Email failure: OTP key deleted before returning `500 EMAIL_SEND_FAILED`
- [ ] Full email address never returned to client — only masked version
- [ ] OTP TTL: 600 seconds; brute-force lockout after 5 wrong attempts
- [ ] Rate limit: 10 OTPs per email per hour; 11th request → 429
- [ ] `requireRole` returns 403 (not 401) for authenticated users with wrong role
- [ ] Refresh token blocklisted on logout; subsequent refresh returns 401
- [ ] All 16 tests pass: `npm test -- --testPathPattern=auth.test.ts`