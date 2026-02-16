# Business Hub (Schedule Manager) - Handover Documentation

**Version:** 1.0.0
**Date:** February 17, 2026
**Status:** Production-Ready

---

## 1. Project Overview

**Business Hub** is a vertically integrated Business Operating System (BOS) designed to unify CRM, Content Production, AI Automation, and Project Management into a single, cohesive platform. Unlike fragmented stacks (Salesforce + Trello + Notion), Business Hub provides a seamless flow of data where a "Lead" can trigger an "AI Call," which results in a "Task," all within one ecosystem.

### 1.1 Core Value Proposition
- **AI-Native:** Built from the ground up with AI agents (Vapi/Twilio) that autonomously qualify leads and book meetings.
- **Neural Brain:** A real-time intelligence engine that analyzes unstructured data (call transcripts, emails) to score "Deal Heat" and suggest strategic actions.
- **Unified Workflow:** Eliminates context switching by integrating the Content Calendar directly with the CRM and Deal Desk.
- **Multi-Provider Architecture:** Adapter pattern allows swapping telephony, LLM, TTS, and STT providers without code changes.
- **Event-Driven Automation:** Built-in automation engine reacts to business events (calls, status changes) to trigger workflows automatically.

### 1.2 Target Market
- **Small-to-Medium Agencies:** Web design, marketing, and consulting firms managing 50-500 leads.
- **Freelancers & Solopreneurs:** Individuals who need a unified platform without paying for 5+ SaaS tools.
- **Sales Teams:** Teams that want AI-assisted outbound calling with intelligent lead scoring.
- **Content Creators:** YouTubers and creators who need production pipeline management alongside business operations.

### 1.3 Competitive Advantages
- **All-in-One:** Replaces Salesforce CRM + Trello + Notion + Calendly + AI calling tools.
- **Self-Hosted:** Full data ownership, no per-seat SaaS pricing for the end user.
- **AI-First:** Every module is enhanced with AI (intelligence scoring, proposal generation, call analysis).
- **White-Labelable:** Clean architecture allows rebranding for resale.

### 1.4 Revenue Model Possibilities
- **SaaS Subscription:** Monthly per-seat pricing ($29-$99/user/month).
- **Usage-Based:** Markup on AI telephony minutes and LLM tokens consumed.
- **Enterprise Licensing:** Self-hosted instances for agencies requiring data sovereignty.
- **White-Label Resale:** License the platform to other businesses to resell under their brand.
- **Marketplace:** Sell premium templates, call scripts, and automation recipes.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
                    +-----------------+
                    |   Web Browser   |
                    |  (React SPA)    |
                    +--------+--------+
                             |
                    +--------v--------+
                    | Nginx / Reverse |
                    |   Proxy (:80)   |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     | Frontend (Vite)  |          | Backend (Express)|
     | React + TS       |          | Node.js :3002    |
     | Port :5175       |          +--------+---------+
     +-----------------+                    |
                              +-------------+-------------+
                              |             |             |
                     +--------v--+  +-------v---+  +-----v-------+
                     | PostgreSQL |  |   Redis   |  |  WebSocket  |
                     |  (Prisma)  |  | (Cache +  |  | (ws :3002)  |
                     |  Port 5432 |  | RateLmt)  |  |  /ws/calls  |
                     +------------+  +-----------+  +-------------+
                              |
              +---------------+---------------+
              |               |               |
       +------v-----+  +-----v------+  +-----v------+
       |   Vapi.ai   |  |   Twilio   |  |  OpenAI    |
       | (Voice AI)  |  | (Telephony)|  | (LLM/GPT)  |
       +-------------+  +------------+  +------------+
              |               |
       +------v-----+  +-----v------+
       | ElevenLabs  |  |  Deepgram  |
       | (TTS)       |  | (STT)      |
       +-------------+  +------------+
```

### 2.2 Frontend Architecture

**Framework:** React 18 + TypeScript + Vite

**Component Tree:**
```
App.tsx (Root)
├── LoginForm / RegisterForm (Auth)
├── Sidebar (Navigation)
├── AppHeader (Notifications, Profile)
└── Module Views (Lazy Loaded)
    ├── DashboardView (/dashboard)
    ├── LeadsView (/leads)
    │   ├── LeadBoard (Kanban)
    │   ├── LeadTableView (Grid)
    │   └── LeadDetailPanel (Slide-over)
    │       ├── LeadActivityTimeline
    │       └── LeadIntelligence
    ├── CallingView (/calling)
    ├── TaskBoardsView (/tasks)
    ├── JobsView (/jobs)
    ├── ContentStudioView (/content)
    ├── TemplatesView (/templates)
    ├── SkillMasteryView (/skills)
    ├── AutomationView (/automation)
    ├── NeuralBrainView (/brain)
    └── DealDeskView (/dealdesk)
```

**State Management:** React hooks + context (no Redux). Each module manages its own state via `useState`/`useEffect` with API calls.

**Routing:** React Router v6 with lazy loading. Routes defined in `src/routes.tsx`. Protected routes require authentication.

**Styling:** Tailwind CSS v4 with custom CSS variables for theming (light/dark mode). No inline styles.

### 2.3 Backend Architecture

**Middleware Pipeline (in order):**
1. `helmet()` — Security headers
2. `cors()` — Cross-origin resource sharing
3. `express.json()` — Body parsing
4. `sanitizeInput()` — XSS/injection prevention
5. `requestLogger()` — Structured logging
6. `rateLimiter()` — Redis-backed rate limiting
7. `authMiddleware` — User verification (per-route)

**Service Layer:**
```
Routes (HTTP) → Services (Business Logic) → Adapters (External APIs)
                                          → Prisma (Database)
                                          → EventBus (Internal Events)
```

**Adapter Pattern:**
Each external service is abstracted behind an interface. Users configure their own API keys, and the system creates isolated adapter instances per user.

```
getAdaptersForUser(userId) → {
  telephony: VapiAdapter | TwilioAdapter,
  llm: OpenAIAdapter,
  tts: ElevenLabsAdapter,
  stt: DeepgramAdapter
}
```

### 2.4 Event-Driven Architecture

**EventBus** (`server/services/eventBus.js`):
- In-memory pub/sub system
- Events: `call:initiated`, `call:completed`, `call:failed`, `lead:status-changed`, `agent:update`
- Listeners: AutomationService, IntelligenceService, NotificationService

**Flow Example:**
```
Call Completed → EventBus publishes "call:completed"
  → AutomationService checks rules → Creates follow-up task
  → IntelligenceService re-analyzes lead → Updates Deal Heat score
  → NotificationService creates notification → WebSocket pushes to client
```

### 2.5 WebSocket Architecture

**Connection Lifecycle:**
1. Client connects to `ws://host:3002/ws/calls`
2. Client sends `{ type: "auth", userId: "..." }`
3. Server verifies userId against database
4. Server responds `{ type: "auth:ok" }`
5. Client subscribes to agent updates: `{ type: "subscribe", agentId: "..." }`
6. Server pushes events filtered by userId (no cross-user data leakage)
7. Heartbeat every 30 seconds to maintain connection

**Event Types:**
- `call:update` — Call status changes (ringing, connected, completed)
- `agent:update` — Agent state transitions (thinking, dialing, speaking)
- `notification:new` — New notification created
- `heartbeat` — Connection health check

---

## 3. Complete API Reference

### 3.1 Authentication

#### `POST /api/auth/register`
**Auth:** None
**Body:** `{ name: string, email: string, password: string }`
**Response:** `{ success: true, user: { id, name, email }, token: string }`

#### `POST /api/auth/login`
**Auth:** None
**Body:** `{ email: string, password: string }`
**Response:** `{ success: true, user: { id, name, email }, token: string }`

#### `GET /api/auth/profile`
**Auth:** Required
**Response:** `{ id, name, email, skills, experience, portfolio, linkedin, github }`

#### `PUT /api/auth/profile`
**Auth:** Required
**Body:** `{ name?, skills?, experience?, portfolio?, linkedin?, github? }`
**Response:** Updated user object

### 3.2 Leads CRM

#### `GET /api/leads`
**Auth:** Required
**Query:** `?search=string&status=string&source=string&industry=string&limit=50&offset=0`
**Response:** `{ leads: Lead[], total: number }`

#### `POST /api/leads`
**Auth:** Required
**Body:**
```json
{
  "name": "string (required)",
  "company": "string?",
  "contactPerson": "string?",
  "email": "string?",
  "phone": "string?",
  "status": "new|contacted|qualified|proposal|won|lost",
  "source": "string?",
  "industry": "string?",
  "website": "string?",
  "websiteIssues": "string?",
  "tags": "string?",
  "notes": "string?"
}
```
**Response:** Created Lead object

#### `PUT /api/leads/:id`
**Auth:** Required
**Body:** Any lead fields to update
**Response:** Updated Lead object

#### `DELETE /api/leads/:id`
**Auth:** Required
**Response:** `{ success: true }`

#### `POST /api/leads/bulk`
**Auth:** Required
**Body:** `{ leads: Lead[] }`
**Response:** `{ created: number, skipped: number, errors: string[] }`

#### `GET /api/leads/:id/activity`
**Auth:** Required
**Response:** `{ calls: Call[], messages: Message[], notes: MeetingNote[] }`

### 3.3 Lead Scraping

#### `POST /api/scraper/search`
**Auth:** Required
**Body:** `{ query: "string", maxResults?: number }`
**Response:** `{ results: [{ name, website, phone?, email?, description }] }`

#### `POST /api/scraper/import`
**Auth:** Required
**Body:** `{ leads: ScrapedLead[] }`
**Response:** `{ imported: number, duplicates: number }`

### 3.4 AI Calling

#### `POST /api/calls/initiate`
**Auth:** Required
**Body:**
```json
{
  "leadId": "string (required)",
  "scriptId": "string?",
  "assistantConfig": {
    "voiceId": "string?",
    "llmModel": "string?",
    "openingLine": "string?",
    "language": "string?",
    "temperature": "number?"
  }
}
```
**Response:** Call object with `providerCallId`
**Security:** `assistantConfig` is whitelisted — only `voiceId`, `llmModel`, `openingLine`, `language`, `temperature` are accepted. `systemPrompt` injection is blocked.

#### `GET /api/calls`
**Auth:** Required
**Query:** `?leadId=string&status=string&outcome=string&limit=50&offset=0`
**Response:** `{ calls: Call[], total: number }`

#### `GET /api/calls/:id`
**Auth:** Required
**Response:** Call with lead, script, meetingNotes, negotiations, agentInstance

#### `GET /api/calls/stats`
**Auth:** Required
**Response:**
```json
{
  "total": 150,
  "today": 12,
  "booked": 23,
  "followUp": 45,
  "notInterested": 30,
  "noAnswer": 52,
  "avgDuration": 180,
  "conversionRate": 15
}
```

### 3.5 Call Scripts

#### `GET /api/calls/scripts/list`
**Auth:** Required
**Response:** `CallScript[]`

#### `POST /api/calls/scripts`
**Auth:** Required
**Body:**
```json
{
  "name": "string",
  "purpose": "string?",
  "industry": "string?",
  "openingLine": "string?",
  "talkingPoints": [{ "topic": "string", "script": "string" }],
  "objectionHandlers": [{ "objection": "string", "response": "string" }],
  "rateRange": { "min": "number", "max": "number", "target": "number", "currency": "string?" },
  "closingStrategy": "string?",
  "assistantConfig": {
    "agentName": "string?",
    "agentRole": "string?",
    "businessName": "string?",
    "businessWebsite": "string?",
    "businessLocation": "string?",
    "conversationStyle": "string?",
    "customSystemPrompt": "string?"
  }
}
```

### 3.6 AI Agents

#### `POST /api/agents`
**Auth:** Required
**Body:**
```json
{
  "name": "string",
  "leadIds": ["string"],
  "scriptId": "string?",
  "delayBetweenCalls": "number? (seconds, default 5)",
  "maxRetries": "number? (default 1)"
}
```
**Response:** AgentInstance object

#### `POST /api/agents/:id/start`
**Auth:** Required
**Response:** `{ success: true, status: "running" }`
**Note:** Prevents double-start with `runningAgents` guard.

#### `POST /api/agents/:id/pause`
**Auth:** Required
**Response:** `{ success: true, status: "paused" }`

#### `GET /api/agents/:id`
**Auth:** Required
**Response:** AgentInstance with stats (completed, failed, remaining)

### 3.7 Webhooks

#### `POST /api/calls/vapi/webhook`
**Auth:** Vapi secret verification (header `x-vapi-secret`)
**Body:** Vapi webhook payload (varies by event type)
**Response:** `{ processed: true, callId: string }`

#### `POST /api/calls/twilio/webhook`
**Auth:** Twilio request signature validation
**Body:** Twilio webhook payload
**Response:** TwiML response

### 3.8 Intelligence

#### `GET /api/intelligence/lead/:leadId`
**Auth:** Required
**Response:** LeadIntelligence object (dealHeat, buyingIntent, budget, timeline, painPoints, etc.)

#### `POST /api/intelligence/analyze/:leadId`
**Auth:** Required
**Response:** Updated LeadIntelligence object
**Note:** Gathers all lead context (calls, messages, notes), sends to LLM for structured extraction.

#### `GET /api/intelligence/insights`
**Auth:** Required
**Response:**
```json
{
  "hotLeads": [{ "lead": Lead, "intelligence": LeadIntelligence }],
  "stalledDeals": [{ "lead": Lead, "daysSinceContact": number }],
  "suggestions": ["string"]
}
```

#### `GET /api/intelligence/leaderboard`
**Auth:** Required
**Response:** Top 10 leads by dealHeat with intelligence data

### 3.9 Proposals

#### `GET /api/proposals`
**Auth:** Required
**Query:** `?leadId=string&status=draft|sent|accepted|rejected`
**Response:** `Proposal[]`

#### `POST /api/proposals`
**Auth:** Required
**Body:**
```json
{
  "title": "string",
  "leadId": "string",
  "content": { "sections": [{ "title": "string", "body": "string" }], "pricing": [] },
  "totalValue": "number?",
  "currency": "USD",
  "validUntil": "ISO date?"
}
```

#### `POST /api/proposals/generate/:leadId`
**Auth:** Required
**Response:** AI-generated Proposal draft based on lead intelligence

### 3.10 Dashboard

#### `GET /api/dashboard`
**Auth:** Required
**Response:**
```json
{
  "stats": {
    "totalLeads": "number",
    "newLeadsThisWeek": "number",
    "totalCalls": "number",
    "callsToday": "number",
    "bookedMeetings": "number",
    "conversionRate": "number",
    "activeTasks": "number"
  },
  "pipelineVelocity": [{ "status": "string", "count": "number" }],
  "recentActivity": [{ "type": "string", "description": "string", "createdAt": "date" }],
  "recentNotifications": [],
  "unreadCount": "number"
}
```

### 3.11 Task Boards & Tasks

#### `GET /api/resources/taskboards`
**Auth:** Required
**Response:** `TaskBoard[]` with columns

#### `POST /api/resources/taskboards`
**Auth:** Required
**Body:** `{ name: "string", columns: [{ id, name, color }], leadId?: "string" }`

#### `GET /api/resources/tasks`
**Auth:** Required
**Query:** `?boardId=string&columnId=string`
**Response:** `Task[]`

#### `POST /api/resources/tasks`
**Auth:** Required
**Body:** `{ boardId, columnId, title, description?, priority?, subtasks?, dueDate?, position? }`

#### `PATCH /api/resources/tasks/:id`
**Auth:** Required
**Body:** Any task fields to update (commonly `columnId` for drag-and-drop)

### 3.12 Jobs

#### `GET /api/jobs`
**Auth:** Required
**Response:** `Job[]`

#### `POST /api/jobs`
**Auth:** Required
**Body:** `{ title, company, url?, status?, salary?, location?, type?, notes? }`

### 3.13 Content

#### `GET /api/contents`
**Auth:** Required
**Response:** `Content[]`

#### `PATCH /api/contents/:id`
**Auth:** Required
**Body:** `{ status?, title?, notes?, scheduledDate? }`

### 3.14 Templates

#### `GET /api/resources/templates`
**Auth:** Required
**Query:** `?folderId=string&category=string`
**Response:** `Template[]`

#### `POST /api/resources/templates`
**Auth:** Required
**Body:** `{ name, content?, category?, folderId?, variables? }`

### 3.15 Notifications

#### `GET /api/notifications`
**Auth:** Required
**Response:** `Notification[]`

#### `PATCH /api/notifications/:id/read`
**Auth:** Required
**Response:** Updated notification

#### `PATCH /api/notifications/read-all`
**Auth:** Required
**Response:** `{ count: number }`

### 3.16 Automation

#### `GET /api/automation/rules`
**Auth:** Required
**Response:** `AutomationRule[]`

#### `POST /api/automation/rules`
**Auth:** Required
**Body:**
```json
{
  "name": "string",
  "trigger": "call:completed|lead:status-changed|call:failed",
  "conditions": {},
  "actions": [{ "type": "create_task|send_notification|update_lead", "params": {} }],
  "enabled": true
}
```

### 3.17 Email

#### `POST /api/email/send`
**Auth:** Required
**Body:** `{ to, subject, body, leadId?, templateId? }`

### 3.18 Outreach

#### `POST /api/outreach/campaign`
**Auth:** Required
**Body:** `{ leads: [{ id, email }], subject, body, templateId? }`

### 3.19 Settings

#### `GET /api/resources/settings`
**Auth:** Required
**Response:** Settings JSON (theme, preferences)

#### `PATCH /api/resources/settings`
**Auth:** Required
**Body:** `{ config: { apiKeys: {}, preferences: {} } }`

### 3.20 Health Check

#### `GET /api/health`
**Auth:** None
**Response:**
```json
{
  "status": "ok",
  "uptime": "3600s",
  "database": "connected",
  "memory": { "rss": "150MB", "heap": "80/120MB" },
  "wsClients": 3,
  "timestamp": "2026-02-17T00:00:00.000Z"
}
```

---

## 4. Frontend Modules (Detailed)

### 4.1 Dashboard / Command Center (`/dashboard`)
- **Component:** `src/modules/dashboard/DashboardView.tsx`
- **API Calls:** `GET /api/dashboard`
- **State:** `stats`, `pipelineVelocity`, `recentActivity`, `hotLeads`
- **Features:** KPI cards with sparklines, pipeline bar chart, activity timeline, AI suggestion cards
- **Real-time:** Polls dashboard endpoint every 60 seconds

### 4.2 Leads CRM (`/leads`)
- **Component:** `src/modules/leads/components/LeadsView.tsx` (renamed from `src/components/Views/LeadsView.tsx`)
- **Sub-components:**
  - `LeadBoard` — Kanban view with drag-and-drop columns
  - `LeadTableView` — Sortable data grid
  - `LeadDetailPanel` — Slide-over with 5 tabs:
    1. Details — Edit lead info
    2. Messages — Email history
    3. Calls — Call history with transcripts
    4. Activity — Aggregated timeline
    5. Intelligence — AI analysis (Deal Heat, insights, next action)
  - `LeadIntelligence` — AI insights widget
  - `LeadActivityTimeline` — Event feed
- **API Calls:** `GET /api/leads`, `POST /api/leads`, `PUT /api/leads/:id`, `GET /api/leads/:id/activity`, `GET /api/intelligence/lead/:id`
- **User Interactions:** Search, filter by status/source/industry, toggle view mode, drag leads between columns, click to open detail panel, import from CSV

### 4.3 AI Calling (`/calling`)
- **Component:** `src/modules/calling/components/CallingView.tsx`
- **Tabs:** Calls, Scripts, Agents, Analytics
- **API Calls:** `GET /api/calls`, `POST /api/calls/initiate`, `GET /api/calls/stats`, `POST /api/agents`, `POST /api/agents/:id/start`
- **Real-time:** WebSocket for live call status and agent state updates
- **User Interactions:** Initiate calls, create/edit scripts, spawn agents, monitor live calls

### 4.4 Task Boards (`/tasks`)
- **Component:** `src/components/Views/TaskBoardsView.tsx`
- **API Calls:** `GET /api/resources/taskboards`, `GET /api/resources/tasks`, `PATCH /api/resources/tasks/:id`
- **User Interactions:** Create boards, add columns, create tasks, drag-and-drop between columns, edit task details

### 4.5 Jobs (`/jobs`)
- **Component:** `src/components/Views/JobsView.tsx`
- **API Calls:** `GET /api/jobs`, `POST /api/jobs`, `PUT /api/jobs/:id`
- **User Interactions:** Track applications, search jobs, manage CVs, compose outreach emails

### 4.6 Content Studio (`/content`)
- **Component:** `src/modules/contentStudio/components/ContentStudioView.tsx`
- **API Calls:** `GET /api/contents`, `PATCH /api/contents/:id`
- **User Interactions:** Create content items, move through pipeline stages, add scripts and URLs

### 4.7 Templates (`/templates`)
- **Component:** `src/components/Views/TemplatesView.tsx`
- **API Calls:** `GET /api/resources/templates`, `POST /api/resources/templates`, `GET /api/resources/templatefolders`
- **User Interactions:** Create/edit templates, organize in folders, use variables, view history

### 4.8 Skill Mastery (`/skills`)
- **Component:** `src/modules/skillMastery/components/SkillMasteryView.tsx`
- **API Calls:** `GET /api/skillmastery`, `PUT /api/skillmastery`
- **User Interactions:** Create skill paths, track progress, log journal entries, view garden visualization

### 4.9 Automation (`/automation`)
- **Component:** `src/modules/automation/components/AutomationView.tsx`
- **API Calls:** `GET /api/automation/rules`, `POST /api/automation/rules`, `PUT /api/automation/rules/:id`
- **User Interactions:** Create rules, toggle enable/disable, view execution history

### 4.10 Neural Brain (`/brain`)
- **Component:** `src/modules/brain/NeuralBrainView.tsx`
- **API Calls:** `GET /api/intelligence/insights`, `GET /api/intelligence/leaderboard`
- **User Interactions:** View deal heat leaderboard, read strategic suggestions, navigate to leads

### 4.11 Deal Desk (`/dealdesk`)
- **Component:** `src/modules/dealdesk/DealDeskView.tsx`
- **API Calls:** `GET /api/proposals`, `POST /api/proposals/generate/:leadId`, `PUT /api/proposals/:id`
- **User Interactions:** View pipeline by intent, create/edit proposals, change proposal status

---

## 5. Database Schema (Complete)

### 5.1 User
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| email | String | Unique | Login credential |
| password | String | | Hashed password |
| name | String? | | Display name |
| skills | String? | | User skills (for AI personalization) |
| experience | String? | | Experience level |
| portfolio | String? | | Portfolio URL |
| linkedin | String? | | LinkedIn URL |
| github | String? | | GitHub URL |
| createdAt | DateTime | Default: now() | Account creation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:** Has many: leads, calls, callScripts, agentInstances, contents, tasks, taskBoards, jobs, templates, messages, notifications, proposals, leadIntelligence, automationRules, etc.

### 5.2 Lead
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| name | String | Required | Lead/company name |
| company | String? | | Company name |
| contactPerson | String? | | Primary contact |
| email | String? | | Contact email |
| phone | String? | | Contact phone |
| status | String | Default: "new" | Pipeline stage |
| source | String? | | Lead source (scraper, manual, referral) |
| industry | String? | | Industry vertical |
| website | String? | | Company website |
| websiteIssues | String? | | Identified website problems |
| tags | String? | | Comma-separated tags |
| linkedBoardId | String? | | Associated task board |
| notes | String? | | Free-text notes |
| lastContactedAt | DateTime? | | Last interaction date |
| createdAt | DateTime | Default: now() | Record creation |
| updatedAt | DateTime | @updatedAt | Last update |
| userId | String | FK → User | Owner |

**Relations:** Has many: calls, messages, proposals. Has one: intelligence.
**Index:** `[userId, status]`

### 5.3 Call
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| leadId | String | FK → Lead | Associated lead |
| direction | String | | "outbound" or "inbound" |
| status | String | Default: "queued" | Call state (queued/ringing/in-progress/completed/failed) |
| outcome | String? | | Result (booked/follow-up/not-interested/no-answer) |
| sentiment | String? | | AI-detected sentiment |
| duration | Int? | | Call length in seconds |
| summary | String? | | AI-generated summary |
| transcription | String? | | Full transcript |
| recordingUrl | String? | | Audio recording URL |
| providerCallId | String? | | External provider reference |
| errorReason | String? | | Failure reason |
| scriptId | String? | FK → CallScript | Script used |
| agentInstanceId | String? | FK → AgentInstance | Agent that made the call |
| startedAt | DateTime? | | Call start time |
| endedAt | DateTime? | | Call end time |
| failedAt | DateTime? | | Failure timestamp |
| createdAt | DateTime | Default: now() | Record creation |
| updatedAt | DateTime | @updatedAt | Last update |
| userId | String | FK → User | Owner |

**Relations:** Belongs to: lead, script, agentInstance. Has one: meetingNotes, negotiations. Has many: callLogs.
**Index:** `[userId, status]`, `[providerCallId]`

### 5.4 CallScript
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| name | String | | Script name |
| purpose | String? | | Goal of the script |
| industry | String? | | Target industry |
| openingLine | String? | | First thing the AI says |
| talkingPoints | Json? | | Array of {topic, script} |
| objectionHandlers | Json? | | Array of {objection, response} |
| rateRange | Json? | | {min, max, target, currency} |
| closingStrategy | String? | | How to close the call |
| assistantConfig | Json? | | AI configuration overrides |
| usageCount | Int | Default: 0 | Times used |
| createdAt | DateTime | Default: now() | |
| updatedAt | DateTime | @updatedAt | |
| userId | String | FK → User | Owner |

### 5.5 AgentInstance
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| name | String | | Agent name |
| status | String | Default: "idle" | State (idle/running/paused/completed/failed) |
| leadQueue | Json? | | Array of lead IDs to process |
| currentLeadIndex | Int | Default: 0 | Current position in queue |
| scriptId | String? | FK → CallScript | Script to use |
| delayBetweenCalls | Int | Default: 5 | Seconds between calls |
| maxRetries | Int | Default: 1 | Retry attempts per lead |
| stats | Json? | | {completed, failed, booked, noAnswer} |
| errorLog | Json? | | Array of error messages |
| startedAt | DateTime? | | When agent started |
| completedAt | DateTime? | | When agent finished |
| createdAt | DateTime | Default: now() | |
| updatedAt | DateTime | @updatedAt | |
| userId | String | FK → User | Owner |

### 5.6 LeadIntelligence
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | Unique identifier |
| leadId | String | Unique, FK → Lead | One-to-one with lead |
| dealHeat | Int? | | 0-100 probability score |
| buyingIntent | String? | | low/medium/high/critical |
| budget | String? | | Extracted budget range |
| timeline | String? | | Extracted timeline |
| decisionMaker | String? | | Who decides |
| painPoints | Json? | | Array of pain points |
| keyInsights | Json? | | Array of insights |
| risks | Json? | | Array of risks |
| nextBestAction | String? | | AI-suggested next step |
| summary | String? | | Executive summary |
| lastAnalyzedAt | DateTime | Default: now() | Last analysis time |
| createdAt | DateTime | Default: now() | |
| updatedAt | DateTime | @updatedAt | |
| userId | String | FK → User | Owner |

**Index:** `[userId, dealHeat]`

### 5.7 Proposal
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | |
| title | String | | Proposal title |
| status | String | Default: "draft" | draft/sent/accepted/rejected |
| content | Json? | | {sections, pricing} |
| totalValue | Float? | | Total deal value |
| currency | String | Default: "USD" | |
| validUntil | DateTime? | | Expiration date |
| sentAt | DateTime? | | When sent |
| acceptedAt | DateTime? | | When accepted |
| rejectionReason | String? | | Why rejected |
| leadId | String | FK → Lead | Associated lead |
| userId | String | FK → User | Owner |
| createdAt | DateTime | Default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Index:** `[userId, status]`

### 5.8 AutomationRule
| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | String | PK, cuid | |
| name | String | | Rule name |
| trigger | String | | Event type to listen for |
| conditions | Json? | | Filtering conditions |
| actions | Json? | | Actions to execute |
| enabled | Boolean | Default: true | Active toggle |
| executionCount | Int | Default: 0 | Times executed |
| lastExecutedAt | DateTime? | | Last execution |
| userId | String | FK → User | Owner |
| createdAt | DateTime | Default: now() | |
| updatedAt | DateTime | @updatedAt | |

### 5.9 Other Models
- **Content:** Video/content items with type (long/short), status pipeline, scheduling
- **Task:** Tasks linked to boards with subtasks (Json), priority, position
- **TaskBoard:** Kanban boards with columns (Json), optional lead linking
- **Template:** Text templates with content, category, folder organization
- **TemplateFolder:** Folder hierarchy for templates
- **Job:** Job application tracking with status pipeline
- **Message:** Email/message records linked to leads and templates
- **Notification:** User notifications with type, read status, action links
- **MeetingNote:** Call meeting notes with summary and action items
- **RateNegotiation:** Call rate negotiation records
- **CallLog:** Detailed call event logs for debugging
- **SkillMastery:** Single JSON blob storing all skill tree data per user
- **Settings:** User preferences and configuration as JSON
- **EmailSettings:** Email provider configuration per user
- **EmailTemplate:** Reusable email templates
- **JobTemplate:** Job application templates
- **JobSearchPrompt:** Saved job search queries
- **CVFile:** Uploaded resume references

---

## 6. Third-Party Integrations

### 6.1 Vapi.ai (Primary Voice AI)
- **Purpose:** Handles the complete AI voice call pipeline (STT → LLM → TTS)
- **Integration:** REST API for call initiation, Webhooks for status updates
- **Config:** `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_WEBHOOK_SECRET`
- **Webhook Flow:**
  1. Business Hub initiates call via Vapi API
  2. Vapi processes the conversation
  3. Vapi sends webhook events to `POST /api/calls/vapi/webhook`
  4. Webhook handler verifies `x-vapi-secret` header
  5. Normalizes payload and updates Call record
  6. Publishes event to EventBus

### 6.2 Twilio (Telephony)
- **Purpose:** Alternative telephony provider for SIP, SMS, and raw media streams
- **Integration:** REST API + TwiML webhooks
- **Config:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Webhook Verification:** Twilio request signature validation middleware

### 6.3 OpenAI (LLM)
- **Purpose:** Powers intelligence analysis, proposal generation, and script building
- **Integration:** Chat Completions API with structured JSON output
- **Config:** `OPENAI_API_KEY` (per-user via Settings)
- **Usage:**
  - `intelligenceService.analyzeLead()` — Extracts structured data from call transcripts
  - `proposalService.generateDraft()` — Creates proposal content from lead context

### 6.4 ElevenLabs (Text-to-Speech)
- **Purpose:** Natural voice synthesis for AI calling agents
- **Config:** `ELEVENLABS_API_KEY` (per-user via Settings)

### 6.5 Deepgram (Speech-to-Text)
- **Purpose:** Real-time transcription of voice calls
- **Config:** `DEEPGRAM_API_KEY` (per-user via Settings)

### 6.6 Email Providers
- **Supported:** Gmail SMTP, SendGrid, Amazon SES, Resend, Custom SMTP
- **Config:** Stored in EmailSettings model per user
- **Features:** Template variable injection, daily throttling, lead tracking

---

## 7. Deployment Guide

### 7.1 Docker Compose Setup

The application uses 3 Docker services:

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: businesshub
      POSTGRES_PASSWORD: <secure-password>
      POSTGRES_DB: businesshub

  backend:
    build: ./server
    ports:
      - "3002:3002"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://businesshub:<password>@db:5432/businesshub
      # ... all env vars

  frontend:
    build: .
    ports:
      - "5175:80"
    depends_on:
      - backend
```

### 7.2 Environment Variables (Complete List)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection (for rate limiting, caching) |
| `PORT` | No | Backend port (default: 3002) |
| `NODE_ENV` | No | "production" or "development" |
| `OPENAI_API_KEY` | No | Default OpenAI key (users can set their own) |
| `VAPI_API_KEY` | No | Vapi.ai API key |
| `VAPI_PHONE_NUMBER_ID` | No | Vapi phone number to call from |
| `VAPI_WEBHOOK_SECRET` | No | Secret for webhook verification |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number |
| `DEEPGRAM_API_KEY` | No | Deepgram STT key |
| `ELEVENLABS_API_KEY` | No | ElevenLabs TTS key |
| `WEBHOOK_BASE_URL` | No | Public URL for webhook callbacks |
| `TELEPHONY_PROVIDER` | No | "vapi" or "twilio" (default: vapi) |
| `LOG_LEVEL` | No | Winston log level (default: info) |

### 7.3 Production Deployment Steps

1. **Clone repository** to server
2. **Configure `.env`** with all required variables
3. **Build containers:** `docker-compose build`
4. **Start services:** `docker-compose up -d`
5. **Run migrations:** `docker-compose exec backend npx prisma db push`
6. **Configure reverse proxy** (Nginx/LiteSpeed) to route domain to ports 5175 (frontend) and 3002 (backend)
7. **Set up SSL** via Certbot or CyberPanel
8. **Verify health:** `curl https://your-domain.com/api/health`

### 7.4 Database Backup/Restore

**Backup:**
```bash
docker-compose exec db pg_dump -U businesshub businesshub > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
docker-compose exec -T db psql -U businesshub businesshub < backup_20260217.sql
```

---

## 8. Security Architecture

### 8.1 Authentication Flow
1. User submits email + password to `POST /api/auth/login`
2. Server verifies credentials, returns user object with ID
3. Client stores userId, sends as `x-user-id` header on all requests
4. `authMiddleware` verifies userId exists in database on every protected route

### 8.2 Authorization Model
- **User Isolation:** All database queries include `userId` in WHERE clause
- **No Cross-User Access:** Users can only access their own data
- **WebSocket Auth:** Connections verified against database before accepting

### 8.3 Input Sanitization
- `sanitizeInput()` middleware strips HTML/script tags from all request body fields
- Prevents XSS and injection attacks at the middleware level

### 8.4 Rate Limiting
- **Global:** Redis-backed, 500 requests per 15 minutes per IP on `/api` routes
- **Auth:** Stricter limits on login/register to prevent brute force
- **Fallback:** In-memory rate limiting if Redis is unavailable

### 8.5 Webhook Verification
- **Vapi:** Verifies `x-vapi-secret` header matches `VAPI_WEBHOOK_SECRET` env var
- **Twilio:** Validates request signature using Twilio's built-in verification

### 8.6 API Key Isolation
- Per-user API keys stored in Settings model
- `apiKeyService.js` loads keys into isolated adapter instances
- No process.env mutation — keys live in per-user memory cache
- Cross-user key leakage impossible by design

### 8.7 Call Security
- `assistantConfig` whitelist prevents `systemPrompt` injection on call initiation
- Only allowed fields: `voiceId`, `llmModel`, `openingLine`, `language`, `temperature`

---

## 9. Extending the Platform

### 9.1 Adding a New Frontend Module

1. **Create module directory:** `src/modules/newModule/`
2. **Create view component:** `src/modules/newModule/NewModuleView.tsx`
3. **Create barrel export:** `src/modules/newModule/index.ts`
4. **Add to sidebar:** Edit `src/shared/components/Sidebar.tsx`, add to modules array:
   ```javascript
   { id: 'newModule', name: 'New Module', icon: IconName, path: '/new-module', color: '...' }
   ```
5. **Add route:** Edit `src/routes.tsx`, add path mapping
6. **Add lazy import:** Edit `src/App.tsx`, add lazy import and render block
7. **Add API endpoints:** Edit `src/config/api.ts`

### 9.2 Adding a New Backend Route

1. **Create route file:** `server/routes/newRoute.js`
2. **Create service file:** `server/services/newService.js` (if complex logic needed)
3. **Register in index:** Edit `server/index.js`:
   ```javascript
   import newRoutes from './routes/newRoute.js'
   app.use('/api/new', authMiddleware, newRoutes)
   ```

### 9.3 Adding a New Telephony Provider

1. **Create adapter:** `server/adapters/telephony/newProvider.js`
2. **Implement interface:**
   ```javascript
   export class NewProviderAdapter {
     async initiateCall({ phoneNumber, leadId, scriptId, assistantConfig }) { ... }
     async handleWebhook(payload) { ... }
     async getCallStatus(providerCallId) { ... }
   }
   ```
3. **Register in factory:** Update `server/adapters/index.js` to include new provider
4. **Add webhook route** if needed

### 9.4 Adding New Automation Triggers/Actions

1. **Publish event:** In your service, call `eventBus.publish('your:event', data)`
2. **Add handler:** In `automationService.js`, add case for new trigger type
3. **Add action:** Implement new action type in automation action executor

### 9.5 Coding Patterns & Conventions

- **Frontend:** React functional components (no `React.FC`), Tailwind CSS classes only (no inline styles), Sonner for toasts (no `alert()`/`confirm()`)
- **Backend:** ES Modules (`import`/`export`), Prisma for all DB access, Winston for logging
- **Naming:** camelCase for JS, kebab-case for file names, PascalCase for components
- **File Size:** Max 600-1000 lines per file; split if larger
- **Error Handling:** Try/catch in services, `globalErrorHandler` middleware for unhandled errors

---

## 10. Known Limitations & Roadmap

### 10.1 Current Limitations

- **Authentication:** No password reset flow, no OAuth/SSO, no MFA
- **Authorization:** No role-based access control (RBAC) — single user per account
- **WebSocket Scaling:** In-memory state; requires Redis Pub/Sub for multi-instance deployment
- **Search:** Basic string matching; no full-text search or Elasticsearch integration
- **Mobile:** Responsive web only, no native mobile app
- **File Storage:** Local filesystem; no S3/cloud storage integration
- **Testing:** No automated test suite (unit/integration/e2e)
- **Email:** One-way sending only; no IMAP sync for incoming emails

### 10.2 Potential Improvements

- **JWT Authentication:** Replace header-based auth with proper JWT tokens
- **RBAC:** Add team support with roles (admin, manager, agent)
- **Redis Pub/Sub:** For WebSocket scaling across multiple backend instances
- **Elasticsearch:** Full-text search across leads, templates, and transcripts
- **S3 Integration:** Cloud storage for call recordings and uploaded files
- **Stripe Integration:** Built-in billing for SaaS model
- **Mobile App:** React Native companion app
- **Automated Testing:** Jest + Playwright test suite
- **Email Sync:** IMAP integration for 2-way email within the CRM
- **Visual Automation Builder:** Drag-and-drop workflow editor (like n8n/Zapier)

### 10.3 Scaling Considerations

- **Database:** PostgreSQL handles 100K+ leads easily; add read replicas for heavy analytics
- **Backend:** Stateless Express server can be horizontally scaled behind load balancer
- **WebSocket:** Move to Redis-backed adapter for multi-instance broadcasting
- **AI Calls:** Rate limited by provider (Vapi/Twilio); batch processing handles bursts
- **Caching:** Redis caching on dashboard and frequently accessed endpoints

---

## Appendix: File Structure Reference

```
schedule-manager/
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Frontend build
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── docs/
│   ├── FEATURES.md             # Feature documentation
│   ├── HANDOVER_DOCUMENTATION.md # This file
│   └── openapi.yaml            # Swagger/OpenAPI spec
├── server/
│   ├── Dockerfile              # Backend build
│   ├── package.json            # Backend dependencies
│   ├── index.js                # Express app entry point
│   ├── config/
│   │   ├── prisma.js           # Prisma client (driver adapter)
│   │   ├── logger.js           # Winston logger
│   │   ├── redisClient.js      # Redis connection
│   │   └── validateEnv.js      # Environment validation
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── rateLimiter.js      # Rate limiting (Redis-backed)
│   │   ├── sanitize.js         # Input sanitization
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── requestLogger.js    # HTTP request logging
│   │   └── twilioValidation.js # Twilio webhook verification
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── leads.js            # CRM routes
│   │   ├── calls.js            # Calling routes
│   │   ├── agents.js           # Agent management routes
│   │   ├── vapiWebhooks.js     # Vapi webhook handler
│   │   ├── twilioWebhooks.js   # Twilio webhook handler
│   │   ├── dashboard.js        # Dashboard aggregation
│   │   ├── intelligence.js     # AI intelligence routes
│   │   ├── proposals.js        # Proposal routes
│   │   ├── automation.js       # Automation rule routes
│   │   ├── notifications.js    # Notification routes
│   │   ├── jobs.js             # Job tracking routes
│   │   ├── contents.js         # Content routes
│   │   ├── extra.js            # Resource routes (tasks, templates, settings)
│   │   ├── scraper.js          # Lead scraping routes
│   │   ├── outreach.js         # Outreach campaign routes
│   │   ├── campaignRoutes.js   # Calling campaign routes
│   │   ├── skillMastery.js     # Skill mastery routes
│   │   ├── email.js            # Email sending routes
│   │   ├── messages.js         # Message routes
│   │   └── upload.js           # File upload routes
│   ├── services/
│   │   ├── callService.js      # Call orchestration
│   │   ├── agentCallingService.js # Autonomous agent engine
│   │   ├── callLogService.js   # Call event logging
│   │   ├── callWebSocket.js    # WebSocket server
│   │   ├── twilioMediaStream.js # Twilio media WebSocket
│   │   ├── apiKeyService.js    # Per-user API key management
│   │   ├── intelligenceService.js # AI analysis engine
│   │   ├── proposalService.js  # Proposal CRUD + generation
│   │   ├── automationService.js # Event-driven automation
│   │   └── eventBus.js         # Internal event bus
│   └── adapters/
│       ├── index.js            # Adapter factory
│       ├── telephony/          # Vapi, Twilio adapters
│       ├── llm/                # OpenAI adapter
│       ├── tts/                # ElevenLabs adapter
│       └── stt/                # Deepgram adapter
├── src/
│   ├── App.tsx                 # Root component
│   ├── routes.tsx              # Route definitions
│   ├── index.css               # Global styles
│   ├── config/
│   │   └── api.ts              # API endpoint configuration
│   ├── shared/
│   │   ├── components/
│   │   │   └── Sidebar.tsx     # Navigation sidebar
│   │   └── hooks/              # Shared React hooks
│   ├── components/
│   │   ├── AppHeader.tsx       # Top bar with notifications
│   │   ├── Calendar/           # Calendar views (Week, Month, Day)
│   │   └── Views/              # Legacy view components
│   │       ├── JobsView.tsx
│   │       ├── TaskBoardsView.tsx
│   │       ├── TemplatesView.tsx
│   │       └── LeadsView.tsx
│   ├── modules/
│   │   ├── brain/              # Neural Brain module
│   │   ├── calling/            # AI Calling module
│   │   ├── contentStudio/      # Content Studio module
│   │   ├── dashboard/          # Dashboard module
│   │   ├── dealdesk/           # Deal Desk module
│   │   ├── automation/         # Automation module
│   │   ├── leads/              # Leads CRM module
│   │   │   ├── components/
│   │   │   │   ├── LeadDetailPanel.tsx
│   │   │   │   ├── LeadIntelligence.tsx
│   │   │   │   ├── LeadActivityTimeline.tsx
│   │   │   │   └── LeadTableView.tsx
│   │   │   └── index.ts
│   │   └── skillMastery/       # Skill Mastery module
│   └── hooks/
│       └── useNotifications.ts # Notification hook
```

---

*This documentation was generated for project handover purposes. For the latest API specification, refer to the Swagger UI at `/api-docs`.*
