# Business Hub — Roadmap

This document outlines the development roadmap. Production hardening comes first, then feature epics.

---

## 0. Production Hardening (P0 — Before All Feature Work)

**Priority:** Critical | **Effort:** 2-3 weeks | **Status:** Planned

Full audit completed (see `docs/PRODUCTION-READINESS.md`). These must be resolved before adding new features.

### Week 1 — Security Foundation
- [x] **Real JWT auth** — bcrypt passwords, JWT tokens, Bearer auth (x-user-id deprecated)
- [x] **CORS lockdown** — restrict to `CORS_ORIGINS` env var
- [x] **Enable Helmet CSP** — content security policy with known sources
- [x] **Remove hardcoded secrets/URLs** — Vite env vars, JWT_SECRET from env
- [x] **Mass assignment protection** — whitelist fields on all write endpoints

### Week 2 — Reliability & Performance
- [x] **Input validation (zod)** — schemas for all POST/PUT/PATCH routes
- [x] **Database indexes** — added `@@index` on 15+ models
- [x] **Error handling** — fetchJson/fetchMutation/fetchGet helpers, 112+ calls migrated across 34 files
- [x] **Replace console.log** — migrated to Winston logger across backend
- [x] **Remove @ts-nocheck** — removed from all 50 files, fixed 482 type errors (prop types, useState generics, event casts)

### Week 3 — Cleanup & Hardening
- [x] **Delete dead code** — TimelineView, ModuleSwitcher, StatsBar, PipelineView removed + barrel exports cleaned
- [x] **Fix API URL construction** — added TASKBOARDS, TASKS, SKILL_MASTERY endpoints, eliminated all `.replace()` hacks
- [x] **Per-user rate limiting** — key on userId instead of IP (behind proxy)
- [ ] **Webhook signature verification** — Vapi + Twilio
- [ ] **Switch to prisma migrate** — committed migration files instead of `db push`

---

## 1. Deal Pipeline + Revenue Forecasting

**Priority:** High | **Effort:** 3-4 weeks

Weighted deal stages with win probability, stage-based revenue forecasting, and deal velocity tracking. Most freelancer/agency CRMs lack pipeline forecasting, making this a strong differentiator.

**Scope:**
- Assign win probability to each pipeline stage (e.g., Qualified = 40%, Proposal Sent = 70%)
- Weighted pipeline value calculation (sum of deal value x probability)
- Monthly/quarterly revenue forecast projections
- Deal velocity metrics (avg days per stage, time-to-close trends)
- Visual funnel chart with stage conversion rates

---

## 2. WhatsApp / SMS Shared Inbox

**Priority:** High | **Effort:** 4-5 weeks

Two-way messaging via WAHA (self-hosted WhatsApp) and Twilio SMS. Unified conversation threads auto-logged to lead timeline. This is the biggest market gap for agency CRMs.

**Scope:**
- WAHA Docker container deployment for free WhatsApp messaging
- Twilio SMS integration (optional, pay-per-message)
- Shared inbox UI with conversation threads per lead
- Auto-match inbound messages to leads by phone number
- Message templates with variable substitution
- Real-time WebSocket push for new messages
- Channel preference per lead (email, WhatsApp, SMS)

---

## 3. AI Lead Scoring + Next-Best-Action

**Priority:** High | **Effort:** 2-3 weeks

Auto-score leads based on engagement velocity, call outcomes, email responses. AI suggests optimal next action. 65%+ of businesses are adopting AI-powered CRM features.

**Scope:**
- Composite lead score (0-100) based on: recency, frequency, call outcomes, email opens, deal value
- Score decay for inactive leads
- "Next Best Action" recommendation engine (call, email, propose, follow-up)
- Lead prioritization queue sorted by score
- Score change notifications for significant movements
- Dashboard widget showing top-scored leads

---

## 4. Inbound Email Sync

**Priority:** Medium | **Effort:** 3-4 weeks

IMAP/Gmail API integration for receiving emails, auto-matching to leads by email address. Completes the email loop (currently outbound only).

**Scope:**
- Gmail API OAuth2 integration for reading inbox
- IMAP polling as fallback for non-Gmail providers
- Auto-match inbound emails to leads by sender email
- Thread grouping with existing outbound messages
- Attachment preview and download
- Unmatched email queue for manual lead assignment
- Email parsing for extracting dates, amounts, action items

---

## 5. PDF Proposal Export + E-Signatures

**Priority:** Medium | **Effort:** 2-3 weeks

Generate branded PDF proposals from the Deal Desk, shareable links, and e-signature integration.

**Scope:**
- PDF generation from proposal content (Puppeteer/React-PDF)
- Branded templates with logo, colors, footer
- Shareable public link (no auth required to view)
- View tracking (notification when prospect opens)
- DocuSign or HelloSign integration for e-signatures
- Proposal status auto-update on signature completion
- PDF download from proposal editor

---

## 6. RBAC + Team Management

**Priority:** Medium | **Effort:** 4-6 weeks

Multi-user support with role-based access control. Essential for agencies and teams purchasing the platform.

**Scope:**
- Roles: Owner, Admin, Member, Viewer
- Team invitations via email
- Per-resource ownership (deal owner, lead assignee)
- Team dashboard with member activity
- Audit log for sensitive actions
- Permission guards on API routes and UI components
- Workspace/organization concept for data isolation

---

## 7. Third-Party Integrations

**Priority:** Low | **Effort:** 2-3 weeks per integration

Extensibility layer for connecting Business Hub to external tools.

**Planned Integrations:**
- **Zapier Webhooks** — Expose triggers (lead created, deal won, call completed) and actions (create lead, update status) via Zapier-compatible webhook endpoints
- **Slack Notifications** — Push deal updates, call outcomes, and task reminders to Slack channels
- **Google Calendar Sync** — Two-way sync for scheduled calls, meetings, and content dates
- **iCal Export** — Subscribe to calendar feed from any calendar app
- **Webhook Endpoints** — Generic inbound webhooks for custom integrations

---

## Implementation Priority Matrix

| Epic | Impact | Effort | Priority |
|------|--------|--------|----------|
| **Production Hardening** | **Critical** | **2-3 weeks** | **P0** |
| Deal Pipeline + Forecasting | High | Medium | P1 |
| WhatsApp/SMS Inbox | High | High | P1 |
| AI Lead Scoring | High | Low | P1 |
| Inbound Email Sync | Medium | Medium | P2 |
| PDF Proposals + E-Sign | Medium | Low | P2 |
| RBAC + Teams | Medium | High | P2 |
| Third-Party Integrations | Low | Variable | P3 |

---

## Notes for Buyers/Licensees

- All epics are designed to be modular — they extend existing architecture without requiring rewrites
- The WebSocket infrastructure, EventBus, and Prisma ORM are already in place to support all listed features
- AI features (scoring, next-best-action) leverage the existing OpenAI integration pattern
- WhatsApp integration has a documented deployment plan in `docs/FEATURES.md` (Messaging Roadmap section)
