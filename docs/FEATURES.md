# Business Hub - Comprehensive Feature Documentation

**System Overview**
Business Hub is an all-in-one enterprise operating system designed to consolidate schedule management, CRM, AI-driven outreach, project management, and personal growth into a single unified platform. It utilizes a React frontend (Vite) and a Node.js/Express backend with PostgreSQL (Prisma) and Redis.

---

## 1. Authentication & User Management
**Description:** Centralized identity management system ensuring secure access to the platform and user-specific data isolation.

**Key Capabilities:**
- **User Registration/Login:** Email and password-based authentication.
- **Profile Management:** Manage personal details, experience level, and skills (used for AI personalization in emails/proposals).
- **Online Presence:** Store links to Portfolio, LinkedIn, and GitHub.
- **Session Management:** Secure token-based session handling with automatic re-verification.

**API Endpoints:**
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and receive session token.
- `GET /api/auth/profile`: Retrieve current user details.
- `PUT /api/auth/profile`: Update user profile fields.

**UI Components:**
- `LoginForm`, `RegisterForm`: Authentication screens.
- `ProfileEditor`: Modal to update user details and skills.
- `ProtectedRoute`: Wrapper to ensure authorized access to routes.

---

## 2. Dashboard / Command Center
**Description:** The landing page providing a high-level real-time overview of business operations, health, and recent activities.

**Key Capabilities:**
- **KPI Cards:** Visual metrics for Total Leads, Conversion Rate, Active Calls, and Booking Rate with trend indicators (sparklines).
- **Pipeline Velocity:** Visual bar chart showing lead distribution across stages (New, Contacted, Won, etc.).
- **Activity Timeline:** Chronological feed of recent system events (calls, emails, lead updates).
- **AI Suggestions:** Dynamic insights prompting actions (e.g., "Review 5 new leads", "Follow up on stalled deal").
- **Live Status:** Real-time indicators for active agents and unread notifications.

**API Endpoints:**
- `GET /api/dashboard`: Aggregated statistics and recent activity feed.

**UI Components:**
- `DashboardView`: Main container.
- `KpiCard`: Reusable metric display component.
- `StatsBar`: High-level progress tracking.

---

## 3. Leads CRM
**Description:** A complete Customer Relationship Management system to track potential clients from discovery to deal closure.

**Key Capabilities:**
- **Lead Management:** CRUD operations for leads including company details, contact info, and status.
- **Lead Scraping:** Integrated Google Search scraper to find new leads based on queries (e.g., "Web agencies in NYC").
- **Auto-Enrichment:** Extracts contact info (emails, phones) from scraped websites.
- **Import/Export:** Bulk import from CSV/Markdown and export functionality.
- **Views:** Toggle between **Table View** (data-dense) and **Kanban Board** (visual pipeline).
- **Detail Panel:** Slide-over panel showing lead intelligence, activity timeline, and notes.
- **Deduplication:** Automatic checking against existing records during import/scraping.

**API Endpoints:**
- `GET /api/leads`: List all leads with filtering, search, and pagination.
- `POST /api/leads`: Create a lead.
- `PUT /api/leads/:id`: Update lead details.
- `DELETE /api/leads/:id`: Remove a lead.
- `POST /api/leads/bulk`: Bulk create leads.
- `POST /api/scraper/search`: Scrape Google for leads.
- `POST /api/scraper/import`: Bulk save scraped leads.
- `GET /api/leads/:id/activity`: Get aggregated history for a lead.

**UI Components:**
- `LeadsView`: Main controller with search, filters, and view toggles.
- `LeadBoard`: Kanban view with drag-and-drop status changes.
- `LeadTableView`: Data-dense grid view with sorting.
- `LeadDetailPanel`: Comprehensive lead context with tabs (Details, Messages, Calls, Activity, Intelligence).
- `ImportLeadsModal`: Tool for parsing and importing data.
- `LeadActivityTimeline`: Chronological event feed per lead.
- `LeadIntelligence`: AI-powered insights widget.

---

## 4. AI Calling System
**Description:** An advanced telephony module enabling manual and autonomous AI-driven voice calls to leads. Supports integration with **Vapi** (AI Voice) and **Twilio** (Telephony).

**Key Capabilities:**
- **Autonomous Agents:** "Spawn" AI agents to work through a queue of leads sequentially.
- **Conversation Engine:** Real-time STT (Deepgram) to LLM (OpenAI) to TTS (ElevenLabs) pipeline for natural conversations.
- **Call Scripts:** Template-based scripts with talking points, objection handlers, rate negotiation ranges, and closing strategies.
- **Live Monitoring:** Real-time transcription and status updates via WebSocket.
- **Batch Dialing:** Launch campaigns to call multiple leads with configurable delays.
- **Call Recording & Transcription:** Auto-save audio and generate text transcripts + AI summaries.
- **Analytics:** Track booking rates, average duration, and agent performance.
- **Webhook Processing:** Inbound status updates from Vapi/Twilio with signature verification.
- **Stuck Call Reconciliation:** Auto-detects and resolves calls stuck in "queued" state.
- **Zombie Agent Recovery:** Resets agents left in "running" state on server restart.

**API Endpoints:**
- `POST /api/calls/initiate`: Start a single outbound call.
- `GET /api/calls`: List call history with filters.
- `GET /api/calls/:id`: Get call details with transcript.
- `GET /api/calls/stats`: Aggregate calling performance metrics.
- `GET /api/calls/scripts/list`: Retrieve available call scripts.
- `POST /api/calls/scripts`: Create a call script.
- `PUT /api/calls/scripts/:id`: Update a call script.
- `POST /api/agents`: Spawn a new AI calling agent.
- `POST /api/agents/:id/start`: Start an agent's calling queue.
- `POST /api/agents/:id/pause`: Pause an active agent.
- `GET /api/agents/:id`: Get agent status and progress.
- `POST /api/calls/vapi/webhook`: Handle Vapi provider callbacks.
- `POST /api/calls/twilio/webhook`: Handle Twilio provider callbacks.

**UI Components:**
- `CallingView`: Main hub with tabs for calls, scripts, agents, and analytics.
- `AgentDashboard`: Control center for active AI agents with real-time status.
- `LiveCallBanner`: Global indicator of active calls.
- `ScriptEditor`: Builder for AI conversation flows with talking points and objection handlers.
- `CallDetailPanel`: Review transcripts, recordings, and outcomes.

---

## 5. Task Boards
**Description:** A project management system using Kanban boards to organize work items.

**Key Capabilities:**
- **Custom Boards:** Create multiple boards (e.g., "Project Alpha", "Marketing").
- **Column Management:** Customizable workflow stages with color coding.
- **Task Management:** Rich tasks with subtasks, due dates, priorities (high/medium/low), and descriptions.
- **Block-Based Editor:** Notion-style rich text editor for task descriptions.
- **Lead Integration:** Link boards directly to specific leads for deal-specific tracking.
- **Drag-and-Drop:** Move tasks between columns to update status.

**API Endpoints:**
- `GET /api/resources/taskboards`: List all boards.
- `POST /api/resources/taskboards`: Create a board.
- `PUT /api/resources/taskboards/:id`: Update board (columns, name).
- `DELETE /api/resources/taskboards/:id`: Delete a board.
- `GET /api/resources/tasks`: List tasks (filterable by board/column).
- `POST /api/resources/tasks`: Create a task.
- `PATCH /api/resources/tasks/:id`: Update task status/content/position.
- `DELETE /api/resources/tasks/:id`: Delete a task.

**UI Components:**
- `TaskBoardsView`: Main view with board selector and kanban columns.
- `TaskCard`: Drag-and-drop task item with priority badges.
- `TaskDetailPanel`: Detailed view with subtasks, editor, and metadata.

---

## 6. Jobs Management
**Description:** A dedicated module for tracking job applications and career opportunities.

**Key Capabilities:**
- **Application Tracker:** Pipeline stages (Saved, Applied, Interview, Offer, Rejected).
- **Job Search:** Integrated aggregator fetching listings from multiple sources.
- **CV Manager:** Manage and select resumes/CVs for applications.
- **Outreach Composer:** Write cover letters/emails using templates and user profile data.
- **Interview Scheduler:** Track upcoming interview dates associated with job entries.
- **Search Prompts:** Save and reuse job search queries.

**API Endpoints:**
- `GET /api/jobs`: List tracked jobs with filters.
- `POST /api/jobs`: Create a job entry.
- `PUT /api/jobs/:id`: Update job details/status.
- `DELETE /api/jobs/:id`: Remove a job entry.
- `POST /api/upload/cv`: Upload PDF resumes.
- `GET /api/resources/cvfiles`: List uploaded CVs.

**UI Components:**
- `JobsView`: Kanban board for applications with drag-and-drop.
- `JobSearchPanel`: Search interface with saved prompts.
- `OutreachComposer`: Email editor for applications.
- `CVManager`: Resume management modal.

---

## 7. Content Studio
**Description:** A specialized pipeline for video and content creators to manage production workflows.

**Key Capabilities:**
- **Production Pipeline:** Kanban stages: Idea, Script, Recording, Editing, Thumbnail, Published.
- **Content Types:** Distinguish between Long-form videos and Shorts.
- **Pipeline Analytics:** Track publishing velocity, bottlenecks, and "stuck" items.
- **Scripting:** Rich text area for writing hooks and scripts.
- **Resource Linking:** Attach research URLs (YouTube, Docs, GitHub) to content cards.
- **Scheduling:** Set scheduled and published dates for content calendar.

**API Endpoints:**
- `GET /api/contents`: Retrieve content items with filters.
- `POST /api/contents`: Create a content item.
- `PATCH /api/contents/:id`: Move content between stages or update details.
- `DELETE /api/contents/:id`: Remove a content item.

**UI Components:**
- `ContentStudioView`: Main container with pipeline board and stats.
- `PipelineBoard`: Visual workflow columns.
- `ContentStats`: Weekly goals and streak tracking.
- `ContentCard`: Individual content item with status badges.

---

## 8. Templates System
**Description:** A reusable repository for text content, used across emails, LinkedIn posts, proposals, and documents.

**Key Capabilities:**
- **Block-Based Editor:** Rich content creation with headings, lists, callouts, and code blocks.
- **Variables:** Define placeholders like `{{company}}` or `{{name}}` for dynamic replacement.
- **Categories:** Organize templates by type (Email, Proposal, LinkedIn, Custom).
- **Version History:** Track changes and restore previous versions of templates.
- **Folder Structure:** Nested organization for managing large libraries of templates.
- **Comments:** Collaborative annotation on templates.

**API Endpoints:**
- `GET /api/resources/templates`: List templates with folder/category filters.
- `POST /api/resources/templates`: Create a template.
- `PUT /api/resources/templates/:id`: Update template content.
- `DELETE /api/resources/templates/:id`: Remove a template.
- `GET /api/resources/templatefolders`: List folders.
- `POST /api/resources/templatefolders`: Create a folder.
- `GET /api/resources/templatehistory`: Retrieve version history.
- `GET /api/resources/templatecomments`: List comments on a template.

**UI Components:**
- `TemplatesView`: Explorer interface with folder tree and template list.
- `BlockEditor`: The WYSIWYG editor core.
- `FolderTree`: Sidebar navigation for folders.
- `VersionHistory`: Timeline of template changes.

---

## 9. Skill Mastery
**Description:** A gamified personal growth tracker based on the "Skill Garden" concept.

**Key Capabilities:**
- **Skill Trees:** Visual node-based graph (React Flow) mapping milestones, knowledge, and resources.
- **Gamification:** Earn XP, track streaks, and level up skills from "Seed" to "Mastered".
- **Daily Routine:** Track habits associated with specific skills.
- **Journaling:** Daily reflection logs tied to skill progress.
- **Visual Growth:** Plant icons evolve (Seed, Sprout, Tree) based on progress percentage.
- **Multiple Paths:** Create separate learning paths for different skill domains.

**API Endpoints:**
- `GET /api/skillmastery`: Retrieve full skill tree data.
- `PUT /api/skillmastery`: Sync progress updates.

**UI Components:**
- `SkillMasteryView`: Main dashboard with path selector.
- `GardenView`: Grid view of all active skills with visual indicators.
- `PathTreeView`: Interactive node graph of a specific skill path.

---

## 10. Automation Engine
**Description:** An event-driven system to automate workflows based on configurable triggers and actions.

**Key Capabilities:**
- **Rules Engine:** Define "If [Trigger] Then [Action]" logic (e.g., "If Call Booked, Create Task").
- **Triggers:** Supports events like `call:completed`, `lead:status-changed`, `call:failed`.
- **Actions:** Create tasks, send notifications, update lead status, trigger AI analysis.
- **Auto-Analysis:** Automatically triggers AI intelligence analysis when calls complete.
- **Default Rules:** Pre-seeded rules for common workflows.
- **Enable/Disable:** Toggle individual rules on/off without deleting them.

**API Endpoints:**
- `GET /api/automation/rules`: List active automation rules.
- `POST /api/automation/rules`: Create a new rule.
- `PUT /api/automation/rules/:id`: Update rule configuration.
- `DELETE /api/automation/rules/:id`: Remove a rule.
- `POST /api/agent/execute`: Manually trigger agent actions.

**UI Components:**
- `AutomationView`: Interface to manage rules, view execution history, and monitor events.
- `RuleEditor`: Configuration form for trigger/action pairs.

---

## 11. Neural Brain (AI Intelligence)
**Description:** The analytical core that processes unstructured data (call transcripts, emails, notes) into actionable business intelligence.

**Key Capabilities:**
- **Lead Intelligence:** Analyzes all interactions to score "Deal Heat" (0-100) and "Buying Intent" (low/medium/high/critical).
- **Fact Extraction:** Auto-extracts Budget, Timeline, Decision Maker, and Pain Points from conversations.
- **Strategic Insights:** Identifies stalled deals and suggests "Next Best Actions".
- **Leaderboard:** Ranks leads by probability of closing.
- **Executive Summaries:** Auto-generated 2-3 sentence overviews of each lead's status.
- **Risk Assessment:** Identifies potential deal risks and blockers.
- **EventBus Integration:** Auto-triggers re-analysis when calls complete or lead status changes.

**API Endpoints:**
- `GET /api/intelligence/lead/:leadId`: Get intelligence for a specific lead.
- `POST /api/intelligence/analyze/:leadId`: Force re-analysis of a lead.
- `GET /api/intelligence/insights`: Aggregated strategic advice across all leads.
- `GET /api/intelligence/leaderboard`: Top leads ranked by deal heat.

**UI Components:**
- `NeuralBrainView`: Intelligence dashboard with leaderboard and strategy insights.
- `LeadIntelligence`: Component embedded in Lead Detail Panel showing deal heat, extracted facts, and next actions.

---

## Cross-Module Flow: Lead → Intelligence → Deal Desk Pipeline

The CRM, Neural Brain, and Deal Desk modules form a connected sales pipeline. A lead does **not** appear in Deal Desk until it has been analyzed by the Intelligence Service.

```
                         ┌─────────────────────────────┐
                         │  Lead Created in CRM (/leads) │
                         └──────────────┬──────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
                  │  Manual   │  │ Status Change │  │Call Completed │
                  │  Analyze  │  │  (EventBus)   │  │  (EventBus)  │
                  │  Button   │  │lead:status-   │  │call:completed│
                  └─────┬─────┘  │  changed      │  └──────┬───────┘
                        │        └──────┬────────┘         │
                        ▼               ▼                  ▼
              ┌──────────────────────────────────────────────────┐
              │      intelligenceService.analyzeLead()            │
              │  POST /api/intelligence/analyze/:leadId           │
              └──────────────────────┬───────────────────────────┘
                        ┌────────────┴────────────┐
                        ▼                         ▼
              ┌─────────────────┐      ┌──────────────────┐
              │  LLM Available   │      │  No LLM Key      │
              │  AI extracts:    │      │  Heuristic:       │
              │  dealHeat,       │      │  callCount × 15   │
              │  buyingIntent,   │      │  + sentiment      │
              │  budget, etc.    │      │  bonus             │
              └────────┬─────────┘      └────────┬──────────┘
                       └────────────┬────────────┘
                                    ▼
              ┌──────────────────────────────────────────────────┐
              │         Upsert LeadIntelligence record            │
              │         (dealHeat, buyingIntent, risks, etc.)     │
              └──────────────────────┬───────────────────────────┘
                                     ▼
              ┌──────────────────────────────────────────────────┐
              │   Lead appears in Deal Desk Pipeline (/dealdesk)  │
              │   GET /intelligence/leaderboard                   │
              │   → Kanban: Critical | High | Medium | Low        │
              └──────────────────────┬───────────────────────────┘
                                     ▼
              ┌──────────────────────────────────────────────────┐
              │   "Proposal →" button                             │
              │   POST /api/proposals/generate/:leadId            │
              │   → AI-generated Proposal (draft)                 │
              │   → Lifecycle: Draft → Sent → Accepted/Rejected   │
              └──────────────────────────────────────────────────┘
```

### Analysis Triggers

| Trigger | Source | Event | Automatic? |
|---------|--------|-------|------------|
| Manual analyze | LeadDetailPanel → "Analyze Lead" button | `POST /intelligence/analyze/:leadId` | No — user clicks |
| Status change | Lead dragged to new column or status updated via API | `lead:status-changed` EventBus | Yes |
| Call completed | Vapi/Twilio webhook fires after call ends | `call:completed` EventBus | Yes |

### Key Data Flow

1. **Leads Board** (`/leads`) — CRUD for contacts, no intelligence yet
2. **Intelligence Service** — analyzes lead context (calls, messages, notes) → creates `LeadIntelligence` with `dealHeat` (0-100) and `buyingIntent` (low/medium/high/critical)
3. **Deal Desk Pipeline** (`/dealdesk`) — queries `GET /intelligence/leaderboard` which returns all leads with intelligence, sorted by `dealHeat`, grouped into kanban columns by `buyingIntent`
4. **Proposals** — generated from lead intelligence, tracked through Draft → Sent → Accepted/Rejected lifecycle

> **Note:** Without an OpenAI API key, analysis uses a heuristic fallback (based on call count and sentiment). Leads still appear in Deal Desk but with less detailed intelligence.

---

## 12. Deal Desk (Proposals)
**Description:** A module for managing the bottom-of-funnel sales process with AI-assisted proposal generation.

**Key Capabilities:**
- **Pipeline Tracking:** Monitor deals grouped by buying intent (Critical, High, Medium, Low).
- **Proposal Generator:** AI-assisted drafting of proposals based on Lead Intelligence data.
- **Pricing Tables:** Structured itemized pricing with totals and currency.
- **Status Tracking:** Track proposals through lifecycle: Draft, Sent, Accepted, Rejected.
- **Validity Period:** Set expiration dates on proposals.

**API Endpoints:**
- `GET /api/proposals`: List proposals with status/lead filters.
- `POST /api/proposals`: Create a proposal.
- `GET /api/proposals/:id`: Get proposal details.
- `PUT /api/proposals/:id`: Update proposal content/status.
- `DELETE /api/proposals/:id`: Remove a proposal.
- `POST /api/proposals/generate/:leadId`: Auto-generate proposal draft from lead intelligence.

**UI Components:**
- `DealDeskView`: Pipeline view and proposal management.
- `ProposalEditor`: Document editor for proposal content and pricing.

---

## 13. Notifications
**Description:** Centralized notification system for user alerts and system updates.

**Key Capabilities:**
- **Real-time Alerts:** Delivered via WebSocket (e.g., "Call Completed", "Lead Won").
- **Type Classification:** Categorized by Call, Lead, Task, Campaign, or System.
- **Actionable:** Notifications link directly to relevant resources.
- **Read/Unread Tracking:** Mark individual or bulk notifications as read.
- **Persistent Storage:** All notifications saved to database for history.

**API Endpoints:**
- `GET /api/notifications`: Retrieve notification history with filters.
- `PATCH /api/notifications/:id/read`: Mark as read.
- `PATCH /api/notifications/read-all`: Mark all as read.

**UI Components:**
- `AppHeader`: Contains the notification bell with unread count badge.
- `NotificationDropdown`: List of recent notifications with action links.

---

## 14. Outreach / Campaigns
**Description:** Mass communication tools for scaling lead engagement through email and calling campaigns.

**Key Capabilities:**
- **Email Campaigns:** Bulk send emails to selected leads using templates with variable substitution.
- **Batch Calling:** Queue multiple leads for sequential AI agent dialing with configurable delays.
- **DNC Management:** "Do Not Call" list enforcement.
- **Campaign History:** Logs of all executions and per-lead results.
- **Target Filtering:** Select leads by status, tags, or custom criteria.

**API Endpoints:**
- `POST /api/outreach/campaign`: Execute email campaign.
- `GET /api/campaigns`: List calling campaigns.
- `POST /api/campaigns`: Create a calling campaign.
- `GET /api/campaigns/:id`: Get campaign details with progress.

**UI Components:**
- `CampaignBuilder`: Configuration interface for target selection and messaging.
- `CampaignHistory`: Results and analytics per campaign.

---

## 15. Email System
**Description:** Service layer for handling email delivery with multi-provider support.

**Key Capabilities:**
- **Provider Agnostic:** Supports Gmail, SendGrid, Amazon SES, Resend, and Custom SMTP.
- **Templating:** Variable injection into subject/body before sending.
- **Throttling:** Daily limits and delay enforcement to prevent spam flagging.
- **Lead Tracking:** Auto-links sent emails to lead records and updates `lastContactedAt`.

**API Endpoints:**
- `POST /api/email/send`: Send individual email.
- `GET /api/resources/emailsettings`: Retrieve SMTP/provider config.
- `PUT /api/resources/emailsettings`: Update email provider configuration.

---

## 16. Settings & API Keys
**Description:** Global configuration management for the user's workspace and third-party integrations.

**Key Capabilities:**
- **Provider Config:** Secure per-user storage for API keys (OpenAI, Twilio, Vapi, ElevenLabs, Deepgram).
- **User Preferences:** Theme (Light/Dark), notification preferences.
- **Email Settings:** SMTP provider selection and configuration.
- **Adapter Isolation:** Each user's API keys are loaded into isolated adapter instances with no cross-user leakage.

**API Endpoints:**
- `GET /api/resources/settings`: Retrieve user settings.
- `PATCH /api/resources/settings`: Update general settings (includes encrypted API keys).
- `GET /api/resources/emailsettings`: Retrieve email provider config.
- `PATCH /api/resources/emailsettings`: Update email provider config.

**UI Components:**
- `SettingsModal`: Central settings dialog with multiple tabs.
- `ApiKeysTab`: Secure input fields for third-party provider keys.
- `ThemeToggle`: Light/Dark mode switcher.

---

## 17. WebSocket Real-time Updates
**Description:** The real-time communication layer pushing live updates to the frontend without polling.

**Key Capabilities:**
- **Call Status:** Pushes "Ringing", "Connected", "Completed" states instantly.
- **Agent Visualization:** Streams AI agent decision steps (Thinking, Speaking, Waiting).
- **Notifications:** Pushes new alerts without page refresh.
- **Heartbeat:** Ensures connection health and auto-reconnects.
- **User Isolation:** Broadcasts are filtered by userId so users only see their own data.
- **Auth Verification:** WebSocket connections verify userId against database.

**Architecture:**
- **Server:** `ws` library on shared HTTP server, path `/ws/calls`.
- **Client:** Custom `useWebSocket` hook with exponential backoff reconnection.
- **Events:** `call:update`, `agent:update`, `notification:new`, `heartbeat`.

---

## 18. Calendar Views
**Description:** Temporal visualization layer for all time-based entities across the platform.

**Key Capabilities:**
- **Unified View:** Displays Content, Tasks, Interviews, and Milestones on one grid.
- **Drag-and-Drop:** Reschedule items by dragging them to new dates.
- **View Modes:** Toggle between Month, Week, Day, and List views.
- **Filtering:** Toggle visibility of different item types.
- **Sidebar:** Quick task creation and daily agenda view.

**UI Components:**
- `WeekView`: 7-day grid with time slots.
- `MonthGrid`: Traditional calendar grid.
- `CalendarSidebar`: Mini calendar, quick add, and daily agenda.

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design system
- **State Management:** React hooks + context
- **Routing:** React Router v6
- **Real-time:** Custom WebSocket hook
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)

### Backend Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM (driver adapter pattern)
- **Cache:** Redis
- **Auth:** Header-based (x-user-id) with middleware verification
- **Logging:** Winston with structured JSON logging
- **API Docs:** Swagger UI (OpenAPI spec)
- **Security:** Helmet, CORS, rate limiting, input sanitization

### Deployment
- **Containerization:** Docker Compose (3 services: db, backend, frontend)
- **SSL:** LiteSpeed/CyberPanel managed certificates
- **Database:** PostgreSQL 15 in Docker volume

---

## Messaging Roadmap

### Current State
Follow-up messaging after AI calls uses **email** (free, via user's configured SMTP provider).
SMS via Twilio is available but **disabled by default** (`FOLLOW_UP_SMS_ENABLED=false`) due to high per-message cost (~$0.90/segment).

### Channel Priority

| Channel | Status | Cost | Toggle |
|---------|--------|------|--------|
| **Email** | Active | Free | Always on |
| **WhatsApp (WAHA)** | Planned | Free (self-hosted) | `WHATSAPP_ENABLED` |
| **SMPP (Direct SMS)** | Planned | ~$0.005/msg | `SMPP_ENABLED` |
| **Twilio SMS** | Disabled | ~$0.90/msg | `FOLLOW_UP_SMS_ENABLED` |

### Phase 1: WAHA — WhatsApp Integration (Self-Hosted, Free)

**What:** WAHA (WhatsApp HTTP API) is an open-source REST API for WhatsApp. Self-hosted via Docker, zero per-message cost.

**Deployment:**
```bash
docker run -d --name waha -p 3003:3000 devlikeapro/waha
```

**Integration plan:**
1. Deploy WAHA container on Contabo VPS alongside existing services
2. Create `server/adapters/messaging/wahaAdapter.js` implementing `sendMessage(phone, text)`
3. Add WhatsApp as a messaging channel in AutomationService actions
4. QR code scan via WAHA Dashboard to link WhatsApp Business number
5. Gate behind `WHATSAPP_ENABLED=true` env var

**API example:**
```
POST http://localhost:3003/api/sendText
{ "chatId": "923001234567@c.us", "text": "Thanks for your interest!" }
```

**Resources:**
- GitHub: https://github.com/devlikeapro/waha
- Docs: https://waha.devlike.pro/
- Engines: WEBJS (browser), NOWEB (websocket/Node.js), GOWS (websocket/Go)

### Phase 2: SMPP — Direct Carrier SMS (Low-Cost)

**What:** SMPP (Short Message Peer-to-Peer) is the raw telecom protocol for SMS. Bypasses Twilio middleman for 10-50x cheaper messages.

**How it works:**
```
Current:  App → Twilio HTTP → Twilio SMPP → Carrier → Phone ($0.90/msg)
SMPP:     App → Jasmin SMPP → Carrier → Phone ($0.005-0.02/msg)
```

**Integration plan:**
1. Deploy Jasmin SMS Gateway via Docker on Contabo VPS
2. Get SMPP account from local aggregator (Jazz Business, Telenor Business, or international: BulkSMS, ClickSend)
3. Create `server/adapters/messaging/smppAdapter.js`
4. Add as premium messaging channel for clients who need SMS
5. Gate behind `SMPP_ENABLED=true` env var

**Open-source SMPP gateways:**
- Jasmin: https://github.com/jookies/jasmin (Python, Docker-ready, Apache 2.0)
- Kannel: https://www.kannel.org/ (C-based, battle-tested)

**Cost comparison:**

| Provider | Cost/SMS (US) | Cost/SMS (PK) |
|----------|--------------|---------------|
| Twilio | $0.0079 + carrier | $0.05-0.10 |
| Direct SMPP | $0.001-0.003 | $0.005-0.02 |
| WAHA (WhatsApp) | Free | Free |
| Email | Free | Free |

### SMS Optimization Notes (Applied)
- All SMS messages kept under 160 chars (1 segment) to avoid double-charging
- GSM-7 encoding only (no emojis, no Unicode) to stay in single segment
- SMS disabled by default; offered as premium add-on via env toggle
