# Getting Started — Business Hub

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+ (or Docker)

## Quick Start

```bash
# Clone & install
git clone <repo-url> && cd schedule-manager
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Setup database
cd server && npx prisma generate && npx prisma migrate deploy && cd ..

# Start development
pnpm run dev          # Frontend (Vite) — http://localhost:5173
node server/index.js  # Backend (Express) — http://localhost:3002
```

## Environment Variables

### Required
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

### Optional
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | Backend server port |
| `LOG_LEVEL` | `info` | Winston log level (debug, info, warn, error) |
| `TWILIO_ACCOUNT_SID` | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | — | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | Twilio outbound number |
| `OPENAI_API_KEY` | — | OpenAI API key (GPT) |
| `VAPI_API_KEY` | — | Vapi API key (voice agents) |
| `DEEPGRAM_API_KEY` | — | Deepgram API key (STT) |
| `WEBHOOK_BASE_URL` | — | Public URL for Twilio/Vapi webhooks |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | — | Email sending |

## Docker (Alternative)

```bash
docker compose up -d
```

Starts PostgreSQL, backend, and frontend. See `docker-compose.yml` for configuration.

## Testing

```bash
# Run all E2E tests (72 tests)
npx playwright test

# API tests only (51 tests)
npx playwright test --project=api

# UI browser tests (21 tests)  
npx playwright test --project=ui

# With visible browser
npx playwright test --project=ui --headed
```

## API Quick Reference

All API routes require `x-user-id` header (except `/api/auth`).

```bash
# Register
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the returned user.id for subsequent requests
export UID="<user-id-from-login>"

# List leads
curl http://localhost:3002/api/leads -H "x-user-id: $UID"

# Health check (no auth)
curl http://localhost:3002/api/health
```

## Project Structure

```
├── src/                    # Frontend (React + TypeScript)
│   ├── modules/            # Feature modules (leads, jobs, calling, etc.)
│   ├── shared/             # Shared components (Sidebar, etc.)
│   ├── hooks/              # Custom React hooks
│   └── config/             # API config
├── server/                 # Backend (Express.js)
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── middleware/          # Express middleware
│   ├── config/             # DB, logger, env validation
│   └── adapters/           # External API adapters
├── tests/e2e/              # E2E tests (Playwright)
│   ├── api/                # API test suites
│   └── ui/                 # Browser UI tests
├── prisma/                 # Database schema
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD
```

## Key Files

| File | Purpose |
|---|---|
| `server/index.js` | Server entry point + middleware chain |
| `server/config/prisma.js` | Prisma client singleton |
| `server/config/logger.js` | Winston logger |
| `server/services/callWebSocket.js` | WebSocket server (agent events) |
| `playwright.config.ts` | E2E test configuration |
| `docs/ARCHITECTURE.md` | System architecture + diagrams |
