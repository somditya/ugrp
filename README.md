# UGRP Monorepo

Full-stack TypeScript monorepo with Next.js frontend, Express.js backend, PostgreSQL (Prisma ORM) and Redis.

## Prerequisites

- **Node.js** >= 18.17
- **npm** >= 9
- **Docker & Docker Compose**
- **Git**

## Quick Start (Docker)

```bash
# 1. Copy env file and fill in values
cp .env.example .env

# 2. Start infrastructure (Postgres + Redis + PgAdmin)
docker compose up -d

# 3. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 4. Run database migrations and seed
npx prisma migrate dev --name init
npx prisma db seed

# 5. Run everything concurrently
npm run dev
```

## Local Development (without Docker)

You need a running PostgreSQL and Redis instance. Set values in `.env`.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend (3000) + backend (3001) concurrently |
| `npm run dev:backend` | Start only the backend |
| `npm run dev:frontend` | Start only the frontend |
| `npm run test` | Run Jest tests (frontend + backend) |
| `npm run test:backend` | Run backend Jest tests |
| `npm run test:frontend` | Run frontend Jest tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:migrate` | Create and run a new migration |
| `npm run db:seed` | Seed the database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Lint frontend + backend |
| `npm run format` | Format all files with Prettier |

## Project Structure

```
.
├── frontend/           # Next.js 14 (App Router) + Tailwind + Jest + Playwright
├── backend/            # Express.js + Jest + Supertest
├── database/           # Prisma schema + seed script
├── docker/             # PgAdmin config (dev only)
├── docker-compose.yml
├── package.json        # Root workspace
├── .env.example
└── README.md
```

## Testing

- **Jest + Supertest** for backend unit & integration tests
- **Jest + @testing-library/react** for frontend unit tests
- **Playwright** for end-to-end browser tests

## Environment Variables

See `.env.example` for all required variables with documentation.
