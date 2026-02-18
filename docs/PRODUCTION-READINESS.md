# Production Readiness Audit — Action Plan

**Date:** 2026-02-18
**Status:** Audit complete, remediation pending

This document captures all production readiness issues found during a comprehensive backend + frontend audit, organized by priority.

---

## P0 — Critical (Must Fix Before Production)

### 1. Authentication — Replace Fake Auth with Real JWT

**Problem:** Auth uses plaintext passwords (`bcrypt` imported but unused), `x-user-id` header trust (no signature verification), and frontend generates fake tokens via `btoa()` instead of real JWTs.

**Files:**
- `server/routes/auth.js` — login/register use plain comparison
- `server/middleware/auth.js` — trusts `x-user-id` header without verification
- `src/services/api.ts` — generates `btoa(userId)` as "token"
- `src/context/AuthContext.tsx` — stores fake token in localStorage

**Fix:**
1. Hash passwords with bcrypt on register, verify on login
2. Issue real JWT on login (jsonwebtoken package)
3. Middleware verifies JWT signature + extracts userId from payload
4. Frontend stores real JWT, sends as `Authorization: Bearer <token>`
5. Remove `x-user-id` header trust entirely

---

### 2. CORS — Restrict to Production Domain

**Problem:** CORS is set to `origin: '*'` allowing any domain to call the API.

**File:** `server/index.js`

**Fix:** Set `origin` to `['https://brain.hanzla.com']` (+ localhost for dev).

---

### 3. CSP — Re-enable Content Security Policy

**Problem:** Helmet CSP is explicitly disabled (`contentSecurityPolicy: false`).

**File:** `server/index.js`

**Fix:** Enable with directives allowing only known sources (self, CDN for fonts/icons, API domain).

---

### 4. Environment Secrets — Remove Hardcoded Values

**Problem:** Several config files contain hardcoded production URLs and fallback secrets.

**Files:**
- `src/config/api.ts` — hardcoded `https://brain.hanzla.com`
- `server/config/` — hardcoded JWT secrets, database URLs as defaults

**Fix:** All secrets and URLs must come from environment variables with no defaults (fail fast on missing config).

---

### 5. Mass Assignment — Whitelist Updateable Fields

**Problem:** Multiple routes pass `req.body` directly to `prisma.update()` / `prisma.create()`, allowing clients to set any field.

**Files:** `server/routes/leads.js`, `server/routes/extra.js`, and others

**Fix:** Destructure only allowed fields from `req.body` before passing to Prisma.

---

## P1 — High Priority (Fix Within First Sprint)

### 6. Input Validation — Add Schema Validation

**Problem:** No input validation on any API endpoint. No express-validator, zod, or joi usage.

**Fix:** Add `zod` schemas for all POST/PUT/PATCH endpoints. Validate before business logic.

---

### 7. Database Indexes — Add Missing Indexes

**Problem:** ~15 models have no indexes on commonly queried foreign keys and filter columns.

**Key missing indexes:**
- `Lead.userId`, `Lead.status`, `Lead.source`
- `Task.boardId`, `Task.columnId`
- `Call.leadId`, `Call.userId`, `Call.status`
- `Notification.userId`, `Notification.read`
- `Proposal.leadId`, `Proposal.status`
- `Template.folderId`, `Template.category`

**File:** `server/prisma/schema.prisma`

**Fix:** Add `@@index` directives, run `prisma db push`.

---

### 8. Error Handling — Fix Silent Swallowing

**Problem:**
- Backend: Many routes have empty `catch(e) {}` blocks or just `console.log(e)` without sending error response
- Frontend: Most `fetch` calls don't check `res.ok`, silently fail on 4xx/5xx

**Fix:**
- Backend: All catches must call `next(err)` or send proper error response
- Frontend: Check `res.ok` and throw on non-2xx, show toast on error

---

### 9. Remove console.log Statements

**Problem:** 200+ `console.log` calls across backend. Leaks internal data to stdout, not structured, not leveled.

**Fix:** Replace with `logger.info/debug/error` (Winston logger already exists at `server/config/logger.js`).

---

### 10. TypeScript — Remove @ts-nocheck

**Problem:** 52 frontend files have `// @ts-nocheck` at the top, disabling all type safety.

**Fix:** Incrementally remove `@ts-nocheck` and fix type errors, starting with critical modules (auth, API service, context).

---

## P2 — Medium Priority (Second Sprint)

### 11. Remove Unused Frontend Code

**Problem:** Dead components identified:
- `TimelineView` — imported nowhere
- `ModuleSwitcher` — imported nowhere
- `StatsBar` — imported nowhere
- `pipeline/` module — appears unused
- Several util files with zero imports

**Fix:** Delete confirmed-dead code after verifying with grep.

---

### 12. API URL Construction — Fix Fragile Patterns

**Problem:** Frontend constructs API URLs using string `.replace()` patterns that break if base URL format changes.

**File:** `src/services/api.ts`

**Fix:** Use proper URL construction (`new URL()` or template literals with consistent base).

---

### 13. Rate Limiting — Per-User Instead of Per-IP

**Problem:** Rate limiter is IP-based. Behind a reverse proxy (LiteSpeed), all users share one IP.

**Fix:** Configure `express-rate-limit` to key on `req.user.id` (after auth) or `X-Forwarded-For`.

---

### 14. Webhook Signature Verification

**Problem:** Vapi webhooks have no signature verification (`routes/vapiWebhooks.js` is unauthenticated). Twilio webhook verification may also be incomplete.

**Fix:** Verify webhook signatures using provider SDKs before processing.

---

### 15. File Upload Security

**Problem:** CV upload endpoint (`POST /api/upload/cv`) may not validate file type/size properly.

**Fix:** Validate MIME type, enforce max size, sanitize filenames, store outside webroot.

---

## P3 — Low Priority (Backlog)

### 16. Hardcoded Business Strings

**Problem:** Backend contains hardcoded strings like "Henderson EV", company-specific call scripts, and industry-specific content.

**Fix:** Move to database-driven configuration or env vars.

---

### 17. Stub Endpoints

**Problem:** Some endpoints return placeholder/mock data (e.g., some dashboard widgets, analytics).

**Fix:** Implement real data queries or remove stubs.

---

### 18. Frontend Bundle Optimization

**Problem:** No code splitting beyond route-level. Large initial bundle with all modules loaded.

**Fix:** Add `React.lazy()` for heavy routes (SkillMastery, ContentStudio, DealDesk). Lazy-load heavy deps.

---

### 19. Monitoring & Observability

**Problem:** No health metrics, APM, or structured error tracking beyond basic console logging.

**Fix:** Add Sentry (frontend + backend), expose Prometheus metrics endpoint, structured access logs.

---

### 20. Database Migrations — Switch from db push to migrate

**Problem:** Using `prisma db push` in production can cause data loss on schema conflicts.

**Fix:** Switch to `prisma migrate deploy` with committed migration files.

---

## Quick Wins (< 1 hour each)

| # | Task | File(s) | Impact |
|---|------|---------|--------|
| A | Set CORS origin to production domain | `server/index.js` | Security |
| B | Enable Helmet CSP | `server/index.js` | Security |
| C | Add `@@index` to Prisma schema | `schema.prisma` | Performance |
| D | Remove hardcoded URL from frontend config | `src/config/api.ts` | Config |
| E | Add `res.ok` checks to top 5 API calls | `src/services/api.ts` | Reliability |

---

## Implementation Order

```
Week 1: P0 items (auth, CORS, CSP, secrets, mass assignment)
Week 2: P1 items (validation, indexes, error handling, logging, TypeScript)
Week 3: P2 items (dead code, URL construction, rate limiting, webhooks)
Ongoing: P3 items as time permits
```
