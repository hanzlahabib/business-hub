# Changelog

All notable changes to this project are documented in this file.

---

## [2026-02-10] — Server Fix, Automation Features & Regression Testing

### Bug Fixes

- **Server hanging on all requests** — Health check route was registered after `app.use('/api', uploadRoutes)`, which applied `authMiddleware` to all `/api/*` paths including `/api/health`. When PostgreSQL was down, the auth middleware's Prisma query hung indefinitely. Fixed by moving health check before all route registrations.

- **User registration crash** — `userRepository.create()` was passing `theme` and `notifications` as top-level columns on the `Settings` model, but the Prisma schema only has a `config` Json field. Fixed by nesting them inside the `config` object.

- **Upload route auth middleware** — `server/routes/upload.js` uses `router.use(authMiddleware)` which applies auth to all paths under its mount. Since it's mounted at `/api`, it catches all `/api/*` requests unless more specific routes are registered first. This is by design but requires careful route ordering.

### New Features

- **Lead Scraper** — Google search-based lead discovery with optional website enrichment
  - `POST /api/scraper/search` — Search for leads
  - `POST /api/scraper/import` — Import selected leads
  - `POST /api/scraper/enrich/:id` — Enrich existing lead
  
- **Auto-Outreach** — Personalized email campaigns with batch sending
  - `POST /api/outreach/campaign` — Execute campaign
  - `GET /api/outreach/history` — Campaign stats & message log
  - `GET /api/outreach/uncontacted` — Uncontacted leads

- **Automation Hub UI** — Three-tab dashboard at `/automation`:
  - Lead Scraper tab with search + import
  - Auto-Outreach tab with template selection + campaign execution
  - History tab with stats and message log

- **Automation Widget** — Bottom-right widget on the Leads page showing quick stats (Uncontacted, Sent Today, All Time) with "Find Leads" and "Campaign" action buttons

### Documentation

- Added `docs/E2E-TESTING.md` — Comprehensive E2E regression test plan with 12 test suites
- Added `docs/AUTOMATION.md` — Architecture & API reference for automation features
- Added `docs/CHANGELOG.md` — This file

### Commits

| Hash | Message |
|---|---|
| `6b14ef2` | fix: server hanging issue + Settings schema mismatch + E2E test plan |
| `014002f` | feat: automation features (lead scraper, outreach, automation hub UI) |

---

## [2026-02-09] — Database Migration & Provider Integration

### Changes

- Migrated from JSON Server to Express + Prisma + PostgreSQL
- Made all provider integrations user-specific via `userId` scoping
- Updated CV file management to use Prisma CRUD
- Updated agent/execute endpoint to use Prisma
- Added `authMiddleware` to all data endpoints
- Created Docker Compose setup for PostgreSQL

### Files Modified

- `server/index.js` — Route registration, middleware setup
- `server/routes/upload.js` — CV CRUD via Prisma
- `server/repositories/userRepository.js` — User creation with settings
- `server/prisma/schema.prisma` — CVFile model added
- `src/shared/hooks/useCV.ts` — Auth headers added
- `docker-compose.yml` — PostgreSQL + backend + frontend services

### Verified Working

- Health check ✅
- Auth (register/login) ✅
- Leads CRUD ✅
- Jobs CRUD ✅
- Task Boards CRUD ✅
- Templates CRUD ✅
- CV management ✅
- Email settings ✅
- Outreach endpoints ✅
- Skill Mastery ✅
- All 8 UI pages render correctly ✅
