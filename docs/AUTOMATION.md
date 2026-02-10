# Automation Features — Architecture & API Reference

> Lead scraping, automated outreach campaigns, and campaign history tracking.

## Overview

The Automation module provides three main capabilities:

1. **Lead Scraper** — Find potential leads via Google search + website scraping
2. **Auto-Outreach** — Send personalized email campaigns to leads in batches
3. **Campaign History** — Track outreach stats, sent messages, and lead statuses

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Frontend    │────▶│  Express Routes   │────▶│  Services        │
│  Automation  │     │  /api/scraper     │     │  leadScraper.js  │
│  View.tsx    │     │  /api/outreach    │     │  outreachSched.  │
└──────────────┘     └──────────────────┘     └──────────────────┘
                                                     │
                                               ┌─────▼─────┐
                                               │  Prisma    │
                                               │  PostgreSQL│
                                               └───────────┘
```

---

## API Endpoints

### Scraper Routes (`/api/scraper`)

#### `POST /api/scraper/search`
Search Google for potential leads and optionally enrich with contact info.

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Search query (e.g., "web design agency Toronto") |
| `enrich` | boolean | ❌ | If true, scrape websites for emails/phones (slower) |

**Response:**
```json
{
  "success": true,
  "leads": [
    {
      "name": "Business Name",
      "website": "https://example.com",
      "email": "info@example.com",
      "phone": "+1-555-0100",
      "industry": "web-design",
      "source": "google-search"
    }
  ]
}
```

#### `POST /api/scraper/import`
Import selected scraped leads into the database.

| Field | Type | Required | Description |
|---|---|---|---|
| `leads` | array | ✅ | Array of lead objects to import |

**Response:**
```json
{
  "success": true,
  "imported": 5,
  "skipped": 2,
  "leads": [{ "id": "...", "name": "...", ... }]
}
```

#### `POST /api/scraper/enrich/:id`
Enrich an existing lead by scraping their website for additional contact info.

**Response:**
```json
{
  "success": true,
  "lead": { "id": "...", "email": "found@example.com", "phone": "+1-555-0200" }
}
```

---

### Outreach Routes (`/api/outreach`)

#### `POST /api/outreach/campaign`
Execute an email outreach campaign.

| Field | Type | Required | Description |
|---|---|---|---|
| `leadIds` | array | ✅ | IDs of leads to contact |
| `templateId` | string | ❌ | Email template ID (or use subject/body) |
| `subject` | string | ❌ | Email subject (if no template) |
| `body` | string | ❌ | Email body with `{{name}}`, `{{company}}` variables |
| `dailyLimit` | number | ❌ | Max emails per day (default: 50) |

**Response:**
```json
{
  "success": true,
  "campaign": {
    "sent": 10,
    "failed": 1,
    "skipped": 2,
    "remaining": 0
  }
}
```

#### `GET /api/outreach/history`
Get outreach campaign history and statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "sentToday": 5,
    "sentThisWeek": 23,
    "totalSent": 156
  },
  "messages": [
    {
      "id": "...",
      "leadId": "...",
      "leadName": "Test Corp",
      "subject": "Partnership Inquiry",
      "status": "sent",
      "sentAt": "2026-02-10T18:00:00Z"
    }
  ]
}
```

#### `GET /api/outreach/uncontacted`
Get leads that haven't been contacted yet.

**Response:**
```json
{
  "success": true,
  "count": 15,
  "leads": [{ "id": "...", "name": "...", "email": "...", ... }]
}
```

---

## Services

### Lead Scraper (`server/services/leadScraper.js`)

Uses `cheerio` to scrape Google search results. Capabilities:
- Extracts business names, website URLs from search result pages
- Scrapes individual websites for emails (via `mailto:` links and regex) and phone numbers
- Deduplicates against existing leads in the database
- Attempts to guess industry from search context

### Outreach Scheduler (`server/services/outreachScheduler.js`)

Sends personalized emails using Nodemailer. Features:
- Batch sending with configurable daily limits
- Template variable substitution (`{{name}}`, `{{company}}`, `{{email}}`)
- Logs all sent messages to database
- Updates lead status to "contacted" after successful send
- Respects rate limiting to avoid spam flags

---

## Frontend Component

### `AutomationView.tsx`

Located at `src/modules/leads/components/AutomationView.tsx`. Three-tab interface:

1. **Lead Scraper Tab**
   - Search input with Google query
   - "Enrich with contact info" checkbox
   - Results table with checkboxes for selective import
   - Import button to save leads to database

2. **Auto-Outreach Tab**
   - Lead selector (shows uncontacted leads)
   - Template/custom message input
   - Daily limit configuration
   - Campaign execution button

3. **History Tab**
   - Campaign statistics (sent today, this week, total)
   - Message log with status indicators

### Accessing Automation

Two entry points:
1. **Sidebar** → "Automation" menu item → navigates to `/automation`
2. **Leads page** → Bottom-right "Automation" widget → "Open Hub" link

---

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `TARGET_EMAIL` | — | Default sender email |
| `DAILY_EMAIL_LIMIT` | `50` | Max emails per day per user |
