# F03 — Authentication — OTP Login & JWT

| Field | Value |
|-------|-------|
| **Feature ID** | F03 |
| **Phase** | Phase 1 — MVP |
| **Type** | Backend |
| **Stack** | Express, JWT, Redis, Nodemailer stub, Prisma |
| **Depends on** | F01, F02 |
| **Blocks** | F04, F05, F06, F07, F10, F11, F13 |

---

## Overview

Implements the complete authentication system for all three stakeholder groups. Supports OTP-based login (primary) and a stub SSO endpoint for future LDAP integration. Uses JWT access + refresh token pattern with Redis-backed OTP storage and token blocklist.

---

## API Endpoints

### POST /api/v1/auth/register

Initiates registration for a new user.

**Request**
```json
{
  "universityId": "CSE2024001",
  "role": "STUDENT",
  "mobile": "9876543210",
  "email": "student@university.edu"
}
```

**Logic**
1. Validate `universityId` against ERP stub (`/mocks/erp-users.json`)
2. Check if user already exists; if so, proceed to OTP re-send
3. Generate 6-digit numeric OTP
4. Store in Redis: key `otp:{universityId}`, value `{ otp, attempts: 0 }`, TTL 600s
5. Log OTP to console (stub for MSG91)
6. Return `{ message: "OTP sent", expiresIn: 600 }`

**Rate limit**: 10 requests per mobile per hour (Redis counter key: `otp_rate:{mobile}`)

**Error responses**

| Code | Condition |
|------|-----------|
| 422 | universityId not found in ERP |
| 429 | Rate limit exceeded |

---

### POST /api/v1/auth/verify-otp

Verifies OTP and issues tokens.

**Request**
```json
{
  "universityId": "CSE2024001",
  "otp": "482910"
}
```

**Logic**
1. Fetch OTP record from Redis
2. If not found: return 401 `OTP expired`
3. Increment attempt counter; if >5: delete key, return 401 `Too many attempts`
4. If OTP mismatch: return 401 `Invalid OTP`
5. Delete OTP key from Redis
6. Upsert User in DB with ERP profile data
7. Generate access token (8h) and refresh token (7d)
8. Store refresh token hash in Redis: key `refresh:{userId}`, TTL 7d
9. Return `{ accessToken, refreshToken, user: { id, name, role, department } }`

---

### POST /api/v1/auth/refresh

Issues a new access token using a valid refresh token.

**Request**
```json
{ "refreshToken": "eyJ..." }
```

**Logic**
1. Verify JWT signature
2. Check token not in blocklist: Redis key `blocklist:{tokenHash}`
3. Validate Redis hash matches
4. Return new `{ accessToken }`

---

### POST /api/v1/auth/logout

Invalidates the refresh token.

**Request**: Bearer access token in header + `{ "refreshToken": "eyJ..." }` in body

**Logic**
1. Decode refresh token to get expiry
2. Add to Redis blocklist with TTL = remaining token life
3. Delete `refresh:{userId}` key
4. Return `{ message: "Logged out" }`

---

### POST /api/v1/auth/sso *(stub)*

SSO login via LDAP credentials (for faculty/staff).

**Request**
```json
{
  "universityId": "FAC001",
  "password": "ldap-password"
}
```

**Logic**
1. Call `ldapService.ldapLogin(universityId, password)` (stub reads from mock JSON)
2. On success: upsert User, issue JWT same as OTP flow
3. Return same shape as verify-otp

---

## Middleware

### `requireAuth`

```ts
// Attaches req.user from JWT
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### `requireRole(...roles)`

```ts
export const requireRole = (...roles: Role[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

### `requireCommittee`

Shorthand for `requireRole('COMMITTEE', 'ADMIN', 'REGISTRAR', 'HOD')`.

---

## Security Rules

| Rule | Implementation |
|------|----------------|
| OTP brute-force protection | 5 attempts max; key deleted on exceed |
| OTP rate limit | 10 OTP requests per mobile per hour |
| Login lockout | Account locked 30 minutes after 5 failed OTP attempts |
| Refresh token rotation | Each use of `/refresh` issues a new refresh token |
| Token blocklist | Logout adds refresh token to Redis blocklist |
| Admin IP whitelist | Admin endpoints restricted to `ADMIN_IP_WHITELIST` env var |
| CORS | Only `FRONTEND_URL` allowed in production |

---

## Claude Code Prompt

```
Build the complete authentication system:

/backend/routes/auth.ts
/backend/controllers/authController.ts
/backend/services/authService.ts   (OTP generation, JWT issuance, Redis ops)
/backend/middleware/auth.ts         (requireAuth, requireRole, requireCommittee)

Implement all 5 endpoints: register, verify-otp, refresh, logout, sso (stub).
Use ioredis for Redis operations. Use jsonwebtoken for JWT.
Rate limit via Redis counter (not express-rate-limit — must survive restarts).
Log OTP to console in format: [OTP] universityId=CSE2024001 otp=482910 expires=600s
Validate all inputs with Zod. Return consistent error shape: { error, code, details? }.
```

---

## Tests

### Integration — Register flow
- **What**: POST /register returns OTP sent confirmation; OTP stored in Redis
- **Setup**: ERP mock JSON contains the universityId
- **Request**: `POST /api/v1/auth/register` with valid universityId
- **Assert**: Response `{ message: "OTP sent" }`; Redis key `otp:CSE2024001` exists with TTL ~600s

### Integration — OTP verify success
- **What**: Correct OTP returns valid access + refresh tokens
- **Setup**: Pre-seed Redis with `otp:CSE2024001 = { otp: "123456", attempts: 0 }`
- **Request**: `POST /api/v1/auth/verify-otp` with matching OTP
- **Assert**: Response contains `accessToken`, `refreshToken`, `user.role = "STUDENT"`; OTP key deleted from Redis

### Integration — Wrong OTP rejected
- **What**: Incorrect OTP returns 401
- **Request**: `POST /api/v1/auth/verify-otp` with wrong OTP
- **Assert**: HTTP 401; `{ error: "Invalid OTP" }`; attempt counter incremented in Redis

### Integration — Expired OTP rejected
- **What**: OTP not in Redis returns 401 with expiry message
- **Setup**: No Redis key set
- **Assert**: HTTP 401; `{ error: "OTP expired or not found" }`

### Integration — JWT middleware
- **What**: Protected route rejects missing/invalid/expired tokens
- **Assert 1**: No token → 401
- **Assert 2**: Expired token → 401
- **Assert 3**: Valid token, wrong role → 403
- **Assert 4**: Valid token, correct role → 200

### Integration — Rate limit
- **What**: 11th OTP request within 1 hour returns 429
- **Setup**: Seed Redis rate counter to 10 for test mobile
- **Assert**: HTTP 429; `{ error: "Too many OTP requests. Try again in 1 hour." }`

### Unit — Token expiry
- **What**: Access token JWT payload has correct exp field
- **Assert**: `decoded.exp - decoded.iat === 28800` (8 hours in seconds)
- **Assert**: Refresh token exp = 7 days

### Integration — Logout blocklists token
- **What**: Refresh token added to blocklist on logout; subsequent refresh fails
- **Flow**: Login → logout → attempt refresh
- **Assert**: Refresh after logout returns 401

---

## Acceptance Criteria

- [ ] All 5 endpoints respond correctly per spec
- [ ] OTP TTL is 600 seconds in Redis
- [ ] Brute-force: account locked after 5 wrong OTP attempts
- [ ] Rate limit: 10 OTPs per mobile per hour; 11th returns 429
- [ ] Logout invalidates refresh token; new access token cannot be obtained
- [ ] `requireRole` middleware returns 403 (not 401) for authenticated but wrong-role requests
- [ ] All inputs validated with Zod; invalid input returns structured 422 response
