# F01 — Project Scaffold & Docker Setup

| Field | Value |
|-------|-------|
| **Feature ID** | F01 |
| **Phase** | Phase 1 — MVP |
| **Type** | Infrastructure |
| **Stack** | Next.js 14, Express, PostgreSQL, Redis, Prisma, Docker |
| **Depends on** | None |
| **Blocks** | All other features |

---

## Overview

Establishes the complete monorepo structure, development environment, and containerised infrastructure for the University Grievance Redressal Portal (UGRP). All subsequent features are built on this scaffold.

---

## Directory Structure

```
ugrp/
├── frontend/                  # Next.js 14 application
│   ├── app/                   # App Router pages
│   ├── components/            # Shared UI components
│   ├── lib/                   # API client, utils
│   ├── public/
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                   # Express REST API
│   ├── routes/                # Route definitions
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth, error, rate-limit
│   ├── services/              # Business logic
│   ├── queues/                # Bull job processors
│   ├── utils/                 # Helpers, logger
│   ├── mocks/                 # Stub data (LDAP, ERP)
│   ├── tsconfig.json
│   └── package.json
│
├── database/                  # Prisma schema & migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── docker-compose.yml         # postgres:15, redis:7
├── .env.example               # All variables with comments
├── .gitignore
└── README.md
```

---

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:15-alpine | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Sessions, queues, SLA timers |
| `pgadmin` | dpage/pgadmin4 | 5050 | DB admin UI (dev only) |

```yaml
# docker-compose.yml (key sections)
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ugrp_db
      POSTGRES_USER: ugrp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ugrp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
```

---

## Environment Variables

```env
# .env.example

# Application
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://ugrp_user:password@localhost:5432/ugrp_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES=8h
JWT_REFRESH_EXPIRES=7d

# OTP
OTP_TTL_SECONDS=600
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_PER_HOUR=10

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
MAX_FILES_PER_GRIEVANCE=5

# LDAP (stub mode by default)
LDAP_MODE=stub
LDAP_URL=ldap://your-ldap-server:389
LDAP_BASE_DN=dc=university,dc=edu
LDAP_BIND_DN=cn=admin,dc=university,dc=edu
LDAP_BIND_PASSWORD=

# ERP Integration (stub mode by default)
ERP_MODE=stub
ERP_API_URL=https://erp.university.edu/api
ERP_API_KEY=

# Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=grievances@university.edu

SMS_PROVIDER=msg91
MSG91_API_KEY=
MSG91_SENDER_ID=UGRV

# Admin
ADMIN_IP_WHITELIST=127.0.0.1,::1
```

---

## Testing Setup

### Backend — Jest + Supertest

```json
// backend/package.json (scripts)
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

```ts
// backend/jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './src/test/globalSetup.ts',   // spin up test DB
  globalTeardown: './src/test/globalTeardown.ts',
  coverageThreshold: { global: { lines: 80 } }
};
```

### Frontend — Jest + React Testing Library + Playwright

```json
// frontend/package.json (scripts)
{
  "test": "jest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## Claude Code Prompt

```
Create a full-stack monorepo at ~/ugrp/ with:

/frontend  — Next.js 14 app, Tailwind CSS, ESLint, TypeScript, path aliases (@/components etc.)
/backend   — Express.js app, folders: routes/ controllers/ middleware/ services/ queues/ utils/ mocks/
/database  — Prisma schema file, seed.ts
docker-compose.yml — services: postgres:15-alpine, redis:7-alpine, pgadmin (optional, dev only)
.env.example — all variables from the spec with inline comments
README.md — prerequisites, docker setup steps, migration command, run commands

Use TypeScript throughout. Add Prisma as ORM. Configure Jest for backend (jest + supertest + ts-jest) 
and frontend (jest + @testing-library/react + ts-jest). Add Playwright config for E2E.
Do not write placeholder code. Write real working configuration for every file.
```

---

## Tests

### Infra — Docker health check
- **What**: All Docker containers start and pass their health checks
- **How**: `docker-compose up -d && docker-compose ps` — all services show `healthy`
- **Pass**: postgres, redis report healthy within 30 seconds

### Infra — Database connection
- **What**: Prisma connects to PostgreSQL and migrations run cleanly
- **How**: `npx prisma migrate dev` completes without errors; `prisma.$queryRaw` SELECT 1 returns result
- **Pass**: No migration errors; connection established

### Unit — Env validation
- **What**: Application throws a clear error on missing required env vars
- **How**: Start backend with `DATABASE_URL` unset
- **Pass**: Process exits with `Error: Missing required environment variable: DATABASE_URL`

### Infra — Frontend builds
- **What**: `next build` completes without TypeScript or lint errors
- **How**: `cd frontend && npm run build`
- **Pass**: Build output shows no errors, no type violations

### Infra — Test runners work
- **What**: Both Jest (backend) and Jest (frontend) can discover and run a sample test
- **How**: Add a trivial `1 + 1 = 2` test in each; `npm test` passes
- **Pass**: Both test suites show 1 passed, 0 failed

---

## Acceptance Criteria

- [ ] `docker-compose up -d` brings up all services with healthy status
- [ ] `npx prisma migrate dev` runs without errors
- [ ] `npm run dev` in both `/frontend` and `/backend` starts without errors
- [ ] `npm test` passes in both workspaces
- [ ] `.env.example` documents every variable used anywhere in the codebase
- [ ] README accurately describes setup from scratch
