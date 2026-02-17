# Changelog

All notable changes to this project are documented in this file.

---

## [2026-02-17] — Polish Release: Real Data, Error Handling & Reliability

### Bug Fixes

- **Dashboard sparklines hardcoded** — KPI cards used static SVG paths. Now fetches real 7-day trend data from `GET /api/dashboard/trends` and generates sparklines dynamically.
- **Dashboard avatar initials hardcoded** — Hot Leads table displayed static initials (`RJ`, `AL`...). Now derives initials from the actual lead stage label.
- **Deal Desk navigation broken** — Clicking a deal card navigated to generic `/leads` instead of the specific lead. Fixed to navigate to `/leads/{leadId}`.
- **Deal Desk silent error swallowing** — `fetchData()` had empty `catch {}` block. Now shows toast error and logs to console.
- **Template History/Comments stub endpoints** — `GET/POST /api/resources/templatehistory` and `templatecomments` returned `[]`. Replaced with real Prisma CRUD operations.
- **Email Templates endpoint stub** — `GET /api/resources/emailtemplates` returned `[]`. Now queries actual `EmailTemplate` records with full CRUD.
- **Notification WS push silently dropped** — `emitNotification` in automationService used empty `catch {}`. Now logs warning.
- **useNotifications empty catches** — All `catch {}` blocks replaced with `console.warn()` for debugging.
- **Automation unknown operator passes all** — `evaluateConditions` returned `true` for unknown operators. Changed to `false` (fail-safe).
- **Task creation invalid columnId** — Automation task creation used `'default'` for boards with empty columns. Now creates a real default column.
- **Calendar ghost slot non-functional** — "+ Suggest Time" slot did nothing. Now opens the add content modal for that date.
- **Calendar sidebar "coming soon" toasts** — Removed non-functional "Agenda Options" and "Full Task View" buttons that showed "coming soon" toasts.

### New Features

- **Dashboard trends endpoint** — `GET /api/dashboard/trends` returns 7-day bucketed counts for leads, calls, and conversions.
- **Bulk email send route** — `POST /api/email/send-bulk` accepts `{ leadIds, templateId, subject, body }`, sends templated emails with per-lead variable substitution, logs messages, and updates lead status.
- **Email templates CRUD** — Full `GET/POST/PATCH/DELETE` for `/api/resources/emailtemplates`.
- **Template history CRUD** — Full `GET/POST/DELETE` with `templateId` filtering, version tracking, and content snapshots.
- **Template comments CRUD** — Full `GET/POST/PATCH/DELETE` with user info, thread support (parentId), reactions, and mentions.
- **Persistent scheduled actions** — Auto-call delays now stored in `ScheduledAction` table. Pending actions recovered on server restart.
- **Dynamic AI suggestions** — Dashboard AI panel now suggests based on actual data (uncontacted leads count, conversion rate, pending tasks).

### Schema Changes

- **TemplateHistory** — Added: `version`, `content` (Json), `rawMarkdown`, `changeSummary`, `changeType`, `changedBy`. Added index on `templateId`.
- **TemplateComment** — Added: `parentId`, `reactions` (Json), `mentions` (String[]), `updatedAt`. Added index on `templateId`.
- **ScheduledAction** — New model for persistent delayed action scheduling.

### Documentation

- Updated `docs/FEATURES.md` with bulk email, template history/comments CRUD, dashboard trends, persistent scheduling.
- Updated `docs/CHANGELOG.md` (this file).
- Created `docs/ROADMAP.md` with 7 future feature epics.

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

### Verification Screenshots

| Page | Screenshot |
|---|---|
| Login | ![Login](assets/login-page.png) |
| Dashboard | ![Dashboard](assets/dashboard-home.png) |
| Leads | ![Leads](assets/leads-page.png) |
| Automation Hub | ![Automation](assets/automation-hub.png) |
| Jobs | ![Jobs](assets/jobs-page.png) |
| Task Boards | ![Task Boards](assets/taskboards-page.png) |
| Templates | ![Templates](assets/templates-page.png) |
