# Business Hub Platform - Complete Feature Documentation

> **Last Updated:** 2026-02-15
> A unified AI-powered business operations platform combining CRM, AI calling, lead intelligence, deal management, content studio, automation, and project tracking.

---

## Table of Contents

1. [Dashboard (Command Center)](#1-dashboard-command-center)
2. [Leads (CRM)](#2-leads-crm)
3. [AI Calling System](#3-ai-calling-system)
4. [Neural Brain (AI Intelligence)](#4-neural-brain-ai-intelligence)
5. [Deal Desk (Pipeline & Proposals)](#5-deal-desk-pipeline--proposals)
6. [Automation Hub (Scraper & Outreach)](#6-automation-hub-scraper--outreach)
7. [Content Studio](#7-content-studio)
8. [Templates Studio](#8-templates-studio)
9. [Task Boards](#9-task-boards)
10. [Jobs Module](#10-jobs-module)
11. [Skill Mastery (The Garden)](#11-skill-mastery-the-garden)
12. [Notifications System](#12-notifications-system)
13. [Core Infrastructure](#13-core-infrastructure)
14. [Data Flow Example](#14-data-flow-example)

---

## 1. Dashboard (Command Center)

**Sidebar:** Dashboard | **Path:** `/dashboard` | **Icon:** LayoutDashboard

The central analytics hub aggregating real-time metrics from every module.

### What It Shows

| Metric | Source | Description |
|--------|--------|-------------|
| Total Leads | `Lead` table | All CRM leads |
| Today's Leads | `Lead` table | Created in last 24h |
| Conversion Rate | `Lead` table | Won leads / total leads |
| Total Calls | `Call` table | All call records |
| Today's Calls | `Call` table | Initiated in last 24h |
| Booking Rate | `Call` table | Booked outcomes / total calls |
| Task Progress | `Task` table | Completed vs total, visual bar |
| Active Agents | `AgentInstance` table | Currently running AI agents |
| Unread Notifications | `Notification` table | Pending alerts |
| Recent Activity | Calls + Notifications | Last 15 events, unified timeline |

### Technical Details

- **Backend:** `GET /api/dashboard` runs 10 parallel Prisma queries
- **Caching:** Redis with 2-minute TTL, auto-invalidated on major events
- **Frontend:** `src/modules/dashboard/DashboardView.tsx`
- **Service:** `server/routes/dashboard.js` (inline queries, no separate service)

---

## 2. Leads (CRM)

**Sidebar:** Leads | **Path:** `/leads` | **Icon:** Users

The central CRM with Kanban pipeline, full lead profiles, activity timelines, and AI intelligence integration.

### Lead Lifecycle

```
New -> Contacted -> Replied -> Qualified -> Booked -> Won
                                                  \-> Lost
                                                  \-> Not Interested
                                                  \-> Follow-Up
```

### Lead Record Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Business/contact name |
| company | string | Company name |
| contactPerson | string | Primary contact |
| email | string | Contact email |
| phone | string | Contact phone |
| status | enum | Pipeline stage (new/contacted/replied/qualified/booked/won/lost) |
| source | string | Lead origin (scraper, manual, campaign) |
| industry | string | Business industry |
| website | string | Company URL |
| websiteIssues | JSON | Detected website problems (for pitch) |
| tags | JSON | Custom labels |
| followUpDate | date | Scheduled follow-up |
| lastContactedAt | date | Auto-updated on calls/emails |
| linkedBoardId | string | Linked TaskBoard for project tracking |
| notes | text | Free-form notes |

### Frontend Features

- **LeadBoard** - Drag-and-drop Kanban with customizable columns
- **Filters** - Industry, source, priority, tags, date range
- **LeadDetailPanel** - Tabbed detail view:
  - **Details** - Full profile with editable fields
  - **Messages** - Email history
  - **Calls** - Call records with transcripts
  - **Activity** - Unified timeline (calls + emails + notifications)
  - **Intelligence** - AI analysis (deal heat, insights, next action)
- **Quick Actions** - Call, email, create board, analyze, generate proposal

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads` | List leads with filters |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Get lead with intelligence |
| PUT | `/api/leads/:id` | Update lead (emits `lead:status-changed`) |
| DELETE | `/api/leads/:id` | Delete lead |
| GET | `/api/leads/:id/activity` | Unified activity timeline |

### Integration Points

- **AI Calling** - Leads are the call queue; outcomes update lead status
- **Intelligence** - Auto-analyzes on status changes and call completions
- **Task Boards** - Can spawn dedicated project board per lead
- **Proposals** - AI generates proposals from lead context
- **Outreach** - Bulk email campaigns target lead lists

---

## 3. AI Calling System

**Sidebar:** Calling | **Path:** `/calling` | **Icon:** Phone

Autonomous AI agents that make outbound calls, handle live conversations, negotiate rates, and log results with transcriptions.

### Architecture

```
User -> Spawns Agent -> Agent picks Lead -> Initiates Call (Vapi/Twilio)
     -> Vapi Webhook updates status -> On completion:
        -> Transcription (Deepgram)
        -> LLM Summary + Sentiment
        -> Meeting Notes generation
        -> EventBus: call:completed
        -> Auto-triggers: Automation Rules + Intelligence Analysis
```

### Agent State Machine

```
idle -> dialing -> speaking -> negotiating -> booked / skipped / failed
                                           -> cooldown -> next lead
```

### Components

| Component | Purpose |
|-----------|---------|
| AgentDashboard | React Flow visualization of agent state and lead queue |
| QuickDialer | Single-lead call initiation |
| BatchCallLauncher | Campaign setup (select leads, script, launch) |
| CallLogTable | Paginated call history with filters |
| CallDetailPanel | Full call details: audio, transcript, summary, notes |
| ScriptEditor | Create/edit call scripts with AI generation |
| CallingAnalytics | Charts: booking rate, call duration, outcomes |

### Call Script System

Scripts include:
- **Opening lines** - First 10 seconds of the call
- **Talking points** - Key value propositions
- **Objection handlers** - Pre-loaded responses to common objections
- **Closing strategies** - How to book the meeting
- **AI config** - Model, voice, temperature settings

Scripts can be AI-generated from industry + purpose templates.

### Post-Call Processing

1. **Transcription** - Deepgram STT processes call audio
2. **Summary** - LLM generates 2-3 sentence call summary
3. **Sentiment** - Positive/neutral/negative classification
4. **Meeting Notes** - Extracted action items with deadlines
5. **Rate Negotiation** - Tracks pricing discussions if applicable

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents` | Spawn agent instance |
| POST | `/api/agents/:id/start` | Start processing lead queue |
| POST | `/api/agents/:id/pause` | Pause agent |
| POST | `/api/agents/:id/resume` | Resume agent |
| POST | `/api/agents/:id/stop` | Stop agent |
| GET | `/api/calls` | List calls with filters |
| GET | `/api/calls/stats` | Call analytics |
| GET | `/api/calls/activity` | Activity feed |
| GET | `/api/calls/provider-health` | Provider status check |
| POST | `/api/calls` | Initiate single call |
| POST | `/api/calls/webhook` | Vapi webhook receiver |

### Services

| Service | File | Responsibility |
|---------|------|----------------|
| Agent Calling | `agentCallingService.js` | Orchestrates agents, state machine, WebSocket events |
| Call Service | `callService.js` | Provider-agnostic call management, stats |
| Call Script | `callScriptService.js` | Script CRUD + AI generation |
| Meeting Notes | `meetingNoteService.js` | Post-call note extraction |
| Call Log | `callLogService.js` | Event audit trail |
| Transcription | `transcriptionService.js` | Audio-to-text processing |
| Rate Negotiation | `rateNegotiationService.js` | Price discussion tracking |

---

## 4. Neural Brain (AI Intelligence)

**Sidebar:** Neural Brain | **Path:** `/brain` | **Icon:** BrainCircuit

The AI-powered analysis engine that scores leads, extracts business intelligence from all interactions, and provides strategic recommendations.

### How Analysis Works

1. **Gather Context** - Fetches lead profile + last 15 calls + last 15 messages + meeting notes
2. **LLM Processing** - Sends structured prompt to OpenAI/Anthropic requesting JSON extraction
3. **Intelligence Record** - Upserts `LeadIntelligence` with extracted data
4. **Cache + Invalidate** - Stores result (1h TTL), clears insights cache

### Extracted Intelligence Fields

| Field | Type | Example |
|-------|------|---------|
| dealHeat | 0-100 | 85 (probability of closing) |
| buyingIntent | enum | "high" (low/medium/high/critical) |
| budget | string | "$5k-$10k" |
| timeline | string | "Next 3 months" |
| decisionMaker | string | "CEO needs sign-off" |
| painPoints | string[] | ["Outdated website", "Losing customers online"] |
| keyInsights | string[] | ["Mentioned competitor pricing", "Budget approved Q2"] |
| risks | string[] | ["Long decision cycle", "Multiple stakeholders"] |
| nextBestAction | string | "Send case study from similar industry" |
| summary | string | 2-3 sentence executive summary |

### Auto-Triggers

Intelligence analysis runs automatically when:
- A call completes (`call:completed` event)
- A lead's status changes (`lead:status-changed` event)

### Fallback (No LLM Key)

If no API key is configured, uses heuristic scoring:
- Base score: `callCount * 15`
- Positive sentiment bonus: +20
- Capped at 100

### NeuralBrainView Dashboard

| Section | Description |
|---------|-------------|
| Stat Cards | Total analyzed, avg deal heat, hot leads count, action items |
| Intent Breakdown | Distribution chart: critical / high / medium / low |
| Hot Leads Leaderboard | Top 10 leads by dealHeat with progress bars |
| AI Suggestions | Follow-up reminders, proposal recommendations |
| Stalled Deals | Leads not contacted in 48+ hours |
| Recent Analysis Feed | Last 8 analyses with timestamps and intent badges |

### Intelligence in Lead Detail

The LeadDetailPanel has an "Intelligence" tab showing:
- Circular deal heat gauge (color-coded)
- AI summary paragraph
- Budget / Timeline / Decision Maker grid
- Key insights as chips
- Pain points as bullet list
- Risks as warning-styled list
- Next best action as highlighted card
- "Re-analyze" and "Generate Proposal" buttons

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/intelligence/lead/:leadId` | Get intelligence for a lead |
| POST | `/api/intelligence/analyze/:leadId` | Force re-analysis |
| GET | `/api/intelligence/insights` | Strategy insights (stats, hot leads, suggestions, stalled, recent) |
| GET | `/api/intelligence/leaderboard` | Top 10 leads by dealHeat |

### Caching

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `intel:{leadId}` | 1 hour | Individual lead intelligence |
| `insights:{userId}` | 5 minutes | Strategy dashboard data |

---

## 5. Deal Desk (Pipeline & Proposals)

**Sidebar:** Deal Desk | **Path:** `/dealdesk` | **Icon:** Handshake

Visual deal pipeline management and AI-powered proposal generation.

### Two Tabs

#### Pipeline Tab

Displays all leads that have intelligence data, grouped by buying intent:

| Group | Color | Description |
|-------|-------|-------------|
| Critical | Red | Immediate action needed, very high close probability |
| High | Orange | Strong buying signals, ready for proposal |
| Medium | Amber | Interested but needs nurturing |
| Low | Gray | Early stage, minimal engagement |

Each card shows: lead name, company, dealHeat score, budget, next best action.

Quick actions per card:
- **Analyze** - Re-run AI analysis
- **Generate Proposal** - AI creates draft proposal
- **View Lead** - Navigate to lead detail

#### Proposals Tab

Lists all proposals with:
- Title and linked lead name
- Total value (formatted currency)
- Status badge: Draft (gray) / Sent (blue) / Accepted (green) / Rejected (red)
- Created date
- Click to open full editor

### AI Proposal Generation

When "Generate Proposal" is clicked:

1. Fetches lead profile + intelligence record
2. Builds context: budget, timeline, pain points, insights, call history
3. Sends to LLM with structured prompt
4. LLM returns JSON with:
   - `title` - Proposal title
   - `sections` - Array of `{ title, body }`:
     - Executive Summary
     - Understanding Your Needs
     - Proposed Solution
     - Deliverables
     - Timeline
     - Investment
   - `pricing` - Array of `{ item, amount, description }`
   - `totalValue` - Sum of all pricing items
5. Creates `Proposal` record with status "draft"

### Proposal Editor

Full editor with:
- Editable title
- Section-by-section editing (title + body per section)
- Pricing table (add/remove line items)
- Auto-calculated total
- Status transition buttons: "Mark as Sent", "Mark as Accepted", "Mark as Rejected"
- Rejection reason field

### Proposal Record Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Proposal title |
| status | enum | draft / sent / accepted / rejected |
| content | JSON | `{ sections: [{title, body}], pricing: [{item, amount, description}] }` |
| totalValue | float | Sum of pricing |
| currency | string | Default: "USD" |
| validUntil | date | Expiry date |
| sentAt | date | When marked as sent |
| acceptedAt | date | When accepted |
| rejectionReason | string | Why rejected |
| leadId | string | Linked lead |

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/proposals` | List proposals (?leadId, ?status) |
| POST | `/api/proposals` | Create proposal |
| GET | `/api/proposals/:id` | Get proposal with lead |
| PUT | `/api/proposals/:id` | Update proposal |
| DELETE | `/api/proposals/:id` | Delete proposal |
| POST | `/api/proposals/generate/:leadId` | AI-generate draft for lead |

---

## 6. Automation Hub (Scraper & Outreach)

**Sidebar:** Automation | **Path:** `/automation` | **Icon:** Workflow

Two-part system: lead discovery through web scraping, and multi-channel outreach campaigns.

### Lead Scraper

**How it works:**
1. User enters search query (e.g., "Electricians in Henderson NV")
2. Backend scrapes Google Maps / business listings using Cheerio
3. Extracts: business name, phone, email, website, address
4. Returns results as selectable list
5. User imports selected entries as CRM leads

**Route:** `POST /api/scraper/search`

### Outreach Campaigns

**Email Campaigns:**
- Select template from Templates Studio
- Choose target leads (filter by industry, status, tags)
- Set batch size and delay between sends
- Launch campaign with rate limiting
- Track: sent, delivered, opened, replied

**AI Calling Campaigns:**
- Select leads + call script
- Configure AI agent parameters
- Launch agent to process queue
- Automatic DNC (Do Not Call) list filtering

### Automation Rules Engine

The backend automation engine listens to ALL EventBus events and evaluates user-defined rules.

**Supported Triggers (Events):**
- `call:completed`, `call:failed`, `call:status-changed`
- `lead:status-changed`
- `campaign:lead-processed`
- `email:sent`
- `task:completed`

**Condition Operators:** `eq`, `neq`, `in`, `contains`, `exists`

**Available Actions:**
| Action | Description |
|--------|-------------|
| `create-task` | Auto-create task in specified board |
| `send-notification` | Push notification to user |
| `update-lead-status` | Change lead pipeline stage |

**Default Rules (created automatically):**
1. Call Failed -> Send notification
2. Call Booked -> Create follow-up task + notification
3. Lead Won -> Celebration notification
4. Campaign Lead Booked -> Success notification

**Custom Rules:** Users can create rules via `POST /api/automation/rules` with custom event triggers, conditions, and action chains.

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scraper/search` | Scrape leads from query |
| POST | `/api/outreach/campaign` | Create email campaign |
| GET | `/api/outreach/campaigns` | List campaigns |
| POST | `/api/campaigns` | Launch calling campaign |
| GET | `/api/automation/rules` | List automation rules |
| POST | `/api/automation/rules` | Create custom rule |

---

## 7. Content Studio

**Sidebar:** Content | **Path:** `/content` | **Icon:** Film

Video production pipeline management for content creators.

### Content Lifecycle

```
Idea -> Script -> Recording -> Editing -> Thumbnail -> Published
```

### Content Types

| Type | ID Pattern | Weekly Goal |
|------|-----------|-------------|
| Long-form video | `pub-N` | 2 per week |
| Short-form clip | `short-N` | 5 per week |

### Content Record Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Video title |
| type | enum | long / short |
| status | enum | idea / script / recording / editing / thumbnail / published |
| topic | enum | React Hooks, React 19, Performance, Interview Prep, JavaScript, React Basics, Other |
| hook | string | First 3-second hook text (critical for shorts) |
| scheduledDate | date | Planned publish date |
| publishedDate | date | Actual publish date |
| sourceVideoId | string | Parent video ID (for shorts clipped from longs) |
| presentationReady | boolean | Has presentation been built |
| slideDetails | JSON | `{ folderName, bulletPoints[], slides[] }` |
| notes | text | Internal notes, performance stats |
| urls | JSON | YouTube links, docs, resources |
| comments | JSON | Internal comments |

### Frontend Views

1. **Pipeline** - Kanban board with production stages
2. **List** - Card-based filtered view
3. **Table** - Dense data table for bulk management

### Stats Tracked

- Weekly goal progress (long + short)
- Publishing streak
- Studio analytics (total published, in-progress)

---

## 8. Templates Studio

**Sidebar:** Templates | **Path:** `/templates` | **Icon:** FileText

Centralized template library with Notion-style block editor for all business communications.

### Template Categories

| Category | Use Case |
|----------|----------|
| linkedin | LinkedIn outreach messages |
| email | Email campaigns and follow-ups |
| proposal | Proposal document templates |

### Block Editor

Supports content blocks:
- **Heading** (H1, H2, H3)
- **Paragraph** - Rich text
- **Bullet List** - Unordered lists
- **Numbered List** - Ordered lists
- **Code** - Code snippets
- **Callout** - Highlighted info boxes

Features:
- Drag-and-drop block reordering
- Keyboard shortcuts (/, Ctrl+B, etc.)
- Raw markdown export

### Variable System

Templates support variables like `{{company}}`, `{{firstName}}`, `{{industry}}`:
- Define variables per template
- Preview with real data substitution
- Auto-filled when used in outreach

### Template Management

| Feature | Description |
|---------|-------------|
| Folders | Organize templates in named folders with icons |
| Search | Full-text search across templates |
| Favorites | Star frequently used templates |
| Pinning | Pin templates to top |
| Locking | Prevent accidental edits |
| Version History | Track changes with restore capability |
| Comments | Collaborative feedback |
| Permissions | Visibility and edit access control |

### Template Record Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Template name |
| category | enum | linkedin / email / proposal |
| content | JSON | Block-based content |
| rawMarkdown | text | Markdown export |
| subject | string | Email subject line |
| status | enum | draft / published / archived |
| tags | JSON | Searchable tags |
| variables | JSON | `{{variable}}` definitions |
| isFavorite / isPinned / isLocked | boolean | Management flags |
| version | int | Auto-incrementing version |
| usageCount | int | Times used in campaigns |

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/resources/templates` | List templates |
| POST | `/api/resources/templates` | Create template |
| GET | `/api/resources/templates/:id` | Get template |
| PUT | `/api/resources/templates/:id` | Update template |
| DELETE | `/api/resources/templates/:id` | Delete template |
| GET | `/api/resources/templatefolders` | List folders |
| GET | `/api/resources/templatehistory` | Version history |
| POST | `/api/resources/templatecomments` | Add comment |

---

## 9. Task Boards

**Sidebar:** Task Boards | **Path:** `/taskboards` | **Icon:** SquareKanban

General-purpose project management with customizable Kanban boards.

### Board Structure

Each board has:
- **Name** - Board title
- **Columns** - Custom columns with names and colors (e.g., "To Do" #blue, "In Progress" #yellow, "Done" #green)
- **Lead Link** (optional) - Can be linked to a CRM lead

### Task Record Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Task title |
| description | text | Detailed description |
| priority | enum | high / medium / low |
| columnId | string | Current column position |
| position | int | Order within column |
| assignee | string | Assigned person |
| dueDate | date | Deadline |
| tags | JSON | Custom labels |
| subtasks | JSON | `[{ id, text, done }]` checklist items |
| leadId | string | Optional linked lead |

### Frontend Features

- **Kanban Board** - Drag-and-drop between columns with position tracking
- **Task Detail Panel:**
  - Full task editing
  - Subtask checklist with completion tracking
  - Comments thread
  - File attachments (paste screenshots)
  - Markdown notes editor
  - Due date picker
  - Priority selector
- **Document Linking** - Link and open local Markdown files

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/extra/taskboards` | List boards |
| POST | `/api/extra/taskboards` | Create board |
| PUT | `/api/extra/taskboards/:id` | Update board |
| DELETE | `/api/extra/taskboards/:id` | Delete board |
| GET | `/api/extra/tasks` | List tasks (?boardId) |
| POST | `/api/extra/tasks` | Create task |
| PUT | `/api/extra/tasks/:id` | Update task |
| DELETE | `/api/extra/tasks/:id` | Delete task |

### Integration

- **Leads** - Can spawn a dedicated board per lead (linked via `linkedBoardId`)
- **Automation** - Rules can auto-create tasks (e.g., "Call Booked" -> create follow-up task)
- **Calendar** - Task due dates appear on unified calendar

---

## 10. Jobs Module

**Sidebar:** Jobs | **Path:** `/jobs` | **Icon:** Briefcase

Job search tracking and application pipeline management.

### Job Lifecycle

```
Saved -> Applied -> Interview -> Offer -> Accepted
                                      \-> Rejected
```

### Job Record Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Job posting title |
| role | string | Target role |
| company | string | Company name |
| location | string | City/region |
| locationType | enum | remote / onsite / hybrid |
| status | enum | saved / applied / interview / offer / rejected / accepted |
| description | text | Full job description |
| contactPerson | string | Recruiter/hiring manager |
| contactEmail | string | Contact email |
| experienceLevel | string | Junior / Mid / Senior |
| priority | enum | Priority level |
| requirements | JSON | Job requirements list |
| skills | JSON | Required skills list |
| salaryCurrency | string | Currency code |
| salaryMin / salaryMax | float | Salary range |
| appliedAt | date | Application date |
| interviewDates | JSON | Scheduled interview dates |
| source | string | Where found (LinkedIn, Indeed, etc.) |
| sourceUrl | string | Job posting URL |

### Frontend Features

- **JobBoard** - Kanban with status columns
- **JobDetailPanel** - Full job profile with all fields
- **JobSearchPanel** - External job search integration
- **OutreachComposer** - Email templates for applications/follow-ups

---

## 11. Skill Mastery (The Garden)

**Sidebar:** The Garden | **Path:** `/skills` | **Icon:** Sprout

Gamified personal development system with a garden growth metaphor.

### Concept

Each skill you're developing is represented as a plant in your garden. As you practice and complete routines, plants grow through stages:

```
Seed -> Sprouting -> Growing -> Mastered
```

### Components

| Component | Description |
|-----------|-------------|
| GardenView | Visual cluster of skill plants at various growth stages |
| RoutineSection | Daily habit tracker with streak counting |
| PathTreeView | React Flow milestone map showing knowledge prerequisites |

### Data Structure

```json
{
  "xp": 1250,
  "level": 5,
  "totalCompletions": 47,
  "skills": [
    { "id": "sk-1", "name": "React Hooks", "level": 3, "xp": 450, "status": "growing" }
  ],
  "routines": [
    { "id": "rt-1", "name": "Practice coding", "streak": 12, "lastCompleted": "2026-02-14" }
  ],
  "pathTree": [
    { "id": "pt-1", "name": "React Fundamentals", "unlocked": true, "completed": true }
  ]
}
```

### Gamification Loop

1. Complete daily routine -> Gain XP
2. XP accumulates -> Skill levels up
3. Level up -> Plant grows to next stage
4. Unlock path milestones -> Access advanced topics

---

## 12. Notifications System

Real-time notification system integrated across all modules.

### How Notifications Work

1. **Sources:** Automation rules, system events, call outcomes
2. **Delivery:** WebSocket push for instant display + database persistence
3. **UI:** Bell icon in header with unread badge count
4. **Actions:** Mark as read (individual or bulk)

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List notifications (filter: unread) |
| GET | `/api/notifications/count` | Unread count |
| PATCH | `/api/notifications/:id/read` | Mark single as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Notification Record

| Field | Type | Description |
|-------|------|-------------|
| type | string | info / success / warning / error |
| title | string | Notification headline |
| message | string | Detail text |
| read | boolean | Read status |
| metadata | JSON | Contextual data (leadId, callId, etc.) |

---

## 13. Core Infrastructure

### Event Bus (`server/services/eventBus.js`)

Central nervous system connecting all modules. Every significant action publishes an event.

**Events:**
| Event | Emitted By | Consumed By |
|-------|-----------|-------------|
| `call:initiated` | Call Service | Automation |
| `call:completed` | Call Service | Automation, Intelligence |
| `call:failed` | Call Service | Automation |
| `call:status-changed` | Call Service | Automation |
| `lead:status-changed` | Lead Service | Automation, Intelligence |
| `campaign:lead-processed` | Campaign Service | Automation |
| `email:sent` | Email Service | Automation |
| `task:completed` | Task Service | Automation |
| `notification:created` | Notification Service | WebSocket |

### WebSocket Hub (`server/services/callWebSocket.js`)

Real-time bidirectional communication using Socket.io.

**Emitted Events:**
| Event | Purpose |
|-------|---------|
| `agent:status` | Agent state changes (idle/dialing/speaking) |
| `agent:step` | React Flow node transitions |
| `agent:log` | Activity feed messages |
| `call:update` | Call record updates |
| `notification` | Push notifications to client |

### API Key Adapter System (`server/services/apiKeyService.js`)

Per-user isolated adapter instances prevent API key bleeding between users.

**Adapters:**
| Adapter | Providers | Purpose |
|---------|-----------|---------|
| telephony | Vapi, Twilio | Making calls |
| voice | ElevenLabs | Text-to-speech |
| llm | OpenAI, Anthropic | AI completions |
| stt | Deepgram | Speech-to-text |

### Redis Caching (`server/config/redisClient.js`)

| Cache Key | TTL | Purpose |
|-----------|-----|---------|
| `dashboard:{userId}` | 2 min | Dashboard stats |
| `intel:{leadId}` | 1 hour | Lead intelligence |
| `insights:{userId}` | 5 min | Strategy insights |

### Rate Limiting (`server/middleware/rateLimiter.js`)

Redis-backed per-route rate limiting to prevent API abuse.

### Database (Prisma + PostgreSQL)

All models defined in `server/prisma/schema.prisma`. Key models:

| Model | Count | Description |
|-------|-------|-------------|
| User | core | Authentication + settings |
| Lead | CRM | Business contacts |
| Call | calling | Call records |
| CallScript | calling | Reusable scripts |
| MeetingNote | calling | Post-call notes |
| AgentInstance | calling | AI agent state |
| CallLog | calling | Event audit trail |
| LeadIntelligence | brain | AI analysis records |
| Proposal | dealdesk | Deal proposals |
| Task | boards | Kanban tasks |
| TaskBoard | boards | Board definitions |
| Template | templates | Communication templates |
| Content | studio | Video content records |
| Job | jobs | Job applications |
| SkillMastery | garden | Gamification data |
| Notification | system | Alert records |
| AutomationRule | system | Custom rules |
| Settings | system | User config + API keys |

---

## 14. Data Flow Example

### Scenario: Booking a Lead End-to-End

```
1. SCRAPER: User scrapes "Electricians in Henderson" -> 50 leads imported

2. CALLING: User spawns AI agent with those 50 leads + call script
   -> Agent calls Lead #1 via Vapi
   -> Vapi webhook updates call to "in-progress"
   -> Call completes with outcome: "booked"

3. EVENT BUS: call:completed published

4. AUTOMATION ENGINE (listening to all events):
   -> Rule matches: "call booked"
   -> Action 1: Creates task "Follow up with Lead #1" in board
   -> Action 2: Sends notification "Meeting Booked!"

5. INTELLIGENCE SERVICE (listening to call:completed):
   -> Gathers: Lead profile + all calls + messages
   -> Sends to LLM for analysis
   -> Returns: dealHeat=85, buyingIntent="high", budget="$5k-$10k"
   -> Upserts LeadIntelligence record

6. DEAL DESK: Lead #1 now appears in "High Intent" pipeline
   -> User clicks "Generate Proposal"
   -> LLM generates proposal with sections + pricing
   -> User edits and sends via email

7. LEAD STATUS: User marks lead as "Won"
   -> lead:status-changed event
   -> Automation: Celebration notification
   -> Intelligence: Re-analyzes (dealHeat -> 100)

8. DASHBOARD: Stats update on next load
   -> Conversion rate increases
   -> Call booking rate updated
   -> Recent activity shows the journey
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| Visualization | React Flow (agent graphs, skill trees) |
| Toasts | Sonner |
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| WebSocket | Socket.io |
| Telephony | Vapi, Twilio |
| AI/LLM | OpenAI GPT-4o, Anthropic Claude |
| Voice | ElevenLabs |
| Speech-to-Text | Deepgram |
| Web Scraping | Cheerio |
| Auth | JWT-based with per-user settings |
