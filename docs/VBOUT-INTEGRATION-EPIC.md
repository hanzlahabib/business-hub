# EPIC: Vbout Marketing Automation Integration

**Date:** 2026-02-14
**Status:** Planned (Future)
**Priority:** Medium
**Account:** Vbout Agency (AppSumo lifetime deal)

---

## Overview

Integrate Vbout's marketing automation platform into Schedule Manager for campaign management, contact syncing, and multi-channel outreach. Vbout handles the email campaign delivery and tracking while Schedule Manager remains the lead management hub.

---

## Why Vbout?

- **Already have agency account** — zero additional cost
- **Marketing automation** — drip campaigns, sequences, follow-ups (not just one-off sends)
- **Campaign analytics** — open rates, click rates, bounces, unsubscribes
- **Contact management** — lists, segments, tags
- **Social media** — schedule posts across channels (bonus)
- **Complements existing stack** — Nodemailer handles transactional, Vbout handles campaigns

---

## Architecture

```
Schedule Manager (Lead Hub)
    │
    ├── Transactional Email (existing)
    │   └── Nodemailer → Gmail/SendGrid/SES/Resend/Custom SMTP
    │
    ├── AI Calling (existing)
    │   └── Vapi/Twilio → ElevenLabs → GPT-4o → Deepgram
    │
    └── Marketing Campaigns (NEW — Vbout)
        ├── Contact Sync: Leads → Vbout Lists
        ├── Email Campaigns: Create + Send via Vbout
        ├── Campaign Stats: Pull analytics back
        └── Social Media: Schedule posts (future)
```

## Vbout API Reference

| Detail | Value |
|--------|-------|
| Base URL | `https://api.vbout.com/1/` |
| Auth | API key: `{"key":"YOUR_API_KEY"}` |
| Rate Limit | 15 requests/second |
| Docs | https://developers.vbout.com/docs |

### Available Endpoints

**Email Marketing — Campaigns:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/EmailMarketing/Campaigns` | List campaigns (filter by status) |
| GET | `/EmailMarketing/GetCampaign` | Single campaign details |
| GET | `/EmailMarketing/Stats` | Campaign performance metrics |
| POST | `/EmailMarketing/AddCampaign` | Create new campaign |
| POST | `/EmailMarketing/EditCampaign` | Update campaign |
| DELETE | `/EmailMarketing/DeleteCampaign` | Remove campaign |

**Contact Management:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/EmailMarketing/GetContacts` | List contacts in a list |
| GET | `/EmailMarketing/GetContactByEmail` | Search by email |
| GET | `/EmailMarketing/GetContactsByPhoneNumber` | Search by phone |
| GET | `/EmailMarketing/GetContact` | Get contact by ID |
| POST | `/EmailMarketing/AddContact` | Add contact to list |

**Social Media (Bonus):**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/SocialMedia/Channels` | List connected channels |
| GET | `/SocialMedia/Calendar` | Scheduled posts by date |
| GET | `/SocialMedia/Stats` | Post engagement metrics |
| POST | `/SocialMedia/AddPost` | Schedule new post |
| POST | `/SocialMedia/EditPost` | Edit scheduled post |
| DELETE | `/SocialMedia/DeletePost` | Remove post |

---

## Sprint Plan

### Sprint 1: Vbout Adapter + Contact Sync
**Goal:** Connect to Vbout API, sync leads as contacts

**Files to Create:**
- `server/adapters/vbout/VboutAdapter.js` — API client wrapper
  - `constructor(apiKey)` — init with key
  - `addContact(listId, { email, name, phone, fields })` — push lead to Vbout list
  - `getContact(contactId)` / `getContactByEmail(email)` — lookup
  - `getContacts(listId, { page, limit })` — paginated list
  - `getCampaigns(status)` — list campaigns
  - `getCampaignStats(campaignId)` — performance metrics
  - `createCampaign({ name, subject, from, listId, htmlBody })` — create campaign
  - `deleteCampaign(campaignId)` — remove
- `server/services/vboutSyncService.js` — lead-to-contact sync logic
  - `syncLeadToVbout(userId, leadId)` — push single lead
  - `syncBulkLeads(userId, leadIds, listId)` — batch sync
  - `getOrCreateList(userId, listName)` — auto-create Vbout list

**Files to Modify:**
- `server/adapters/index.js` — add Vbout to `createAdapters(config)` with `config.vbout.apiKey`
- `src/components/Forms/ApiKeysTab.tsx` — add Vbout provider card (API key input)

**Env Var:**
| DB Path | Env Var |
|---------|---------|
| `apiKeys.vbout.apiKey` | `VBOUT_API_KEY` |

**Tasks:**
- [ ] S1.1: Create VboutAdapter with auth + error handling
- [ ] S1.2: Implement contact CRUD methods
- [ ] S1.3: Create vboutSyncService for lead→contact sync
- [ ] S1.4: Add Vbout to adapter factory + API keys UI
- [ ] S1.5: Add "Sync to Vbout" button on lead detail/bulk actions
- [ ] S1.6: Test: push lead → verify appears in Vbout dashboard

---

### Sprint 2: Campaign Management
**Goal:** Create and manage email campaigns from Schedule Manager

**Files to Create:**
- `server/services/vboutCampaignService.js` — campaign orchestration
  - `createCampaign(userId, { name, subject, templateId, listId })` — create campaign in Vbout
  - `getCampaigns(userId)` — list with stats
  - `getCampaignDetails(userId, campaignId)` — full details + metrics
  - `deleteCampaign(userId, campaignId)` — remove

**Files to Modify:**
- `server/routes/campaignRoutes.js` — add Vbout campaign endpoints
  - `POST /api/campaigns/vbout` — create Vbout campaign
  - `GET /api/campaigns/vbout` — list Vbout campaigns
  - `GET /api/campaigns/vbout/:id/stats` — campaign analytics

**Frontend:**
- Add "Vbout Campaigns" tab in AutomationView
  - Campaign list with status badges (draft/sending/sent)
  - Create campaign form (name, subject, template, list selection)
  - Campaign stats view (opens, clicks, bounces, unsubscribes)

**Tasks:**
- [ ] S2.1: Implement campaign CRUD in VboutAdapter
- [ ] S2.2: Create vboutCampaignService
- [ ] S2.3: Add campaign API routes
- [ ] S2.4: Build campaign management UI
- [ ] S2.5: Test: create campaign → send → view stats

---

### Sprint 3: Template Sync + Analytics Dashboard
**Goal:** Sync email templates to Vbout, unified analytics view

**Work:**
- Sync Schedule Manager email templates → Vbout campaign templates
- Pull Vbout campaign stats into existing analytics dashboard
- Unified view: calling campaigns + email campaigns + Vbout campaigns
- Template variable mapping (Schedule Manager `{{variable}}` → Vbout merge fields)

**Tasks:**
- [ ] S3.1: Template sync service (SM templates → Vbout)
- [ ] S3.2: Pull Vbout stats into analytics dashboard
- [ ] S3.3: Unified campaign analytics view
- [ ] S3.4: Template variable mapping

---

### Sprint 4 (Future): Social Media Integration
**Goal:** Schedule social media posts from Schedule Manager

**Work:**
- Connect social channels via Vbout
- Schedule posts from content calendar
- View engagement stats in dashboard
- Multi-channel outreach: email + social + calling from one UI

**Tasks:**
- [ ] S4.1: Social media channel listing UI
- [ ] S4.2: Post scheduling from content calendar
- [ ] S4.3: Engagement stats in dashboard

---

## Data Flow

### Lead → Vbout Contact Sync
```
Lead created/imported in Schedule Manager
  → User clicks "Sync to Vbout" (or auto-sync on import)
  → vboutSyncService.syncLeadToVbout(userId, leadId)
    → Checks if contact exists (getContactByEmail)
    → If not, calls VboutAdapter.addContact(listId, leadData)
    → Stores vboutContactId on Lead record for future reference
```

### Campaign Creation
```
User creates Vbout campaign in UI
  → Selects template + Vbout list
  → POST /api/campaigns/vbout
  → vboutCampaignService.createCampaign()
    → Converts SM template to HTML
    → VboutAdapter.createCampaign({ name, subject, listId, htmlBody })
    → Returns campaignId for tracking
```

### Stats Pull
```
Dashboard loads → GET /api/campaigns/vbout/:id/stats
  → VboutAdapter.getCampaignStats(campaignId)
  → Returns: sent, delivered, opened, clicked, bounced, unsubscribed
  → Rendered alongside calling campaign stats
```

---

## Env Setup (When Ready)

```env
# Add to schedule-manager .env
VBOUT_API_KEY=your-vbout-api-key

# Get from: Vbout Dashboard → Account Settings → API Key
```

Add to per-user API keys settings (ApiKeysTab.tsx) for multi-user support.

---

## Dependencies

- No new npm packages needed — Vbout API is simple REST (fetch/axios)
- Existing per-user adapter system handles multi-user key isolation
- Existing campaign analytics UI can be extended

## Risks

| Risk | Mitigation |
|------|------------|
| Vbout rate limit (15/sec) | Batch sync with delays, queue system |
| Template format differences | Build converter (SM variables → Vbout merge fields) |
| Vbout API changes | Adapter pattern isolates changes to one file |
| Campaign delivery issues | Keep Nodemailer as fallback for critical sends |
