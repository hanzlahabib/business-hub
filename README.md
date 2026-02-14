# Business Hub — All-in-One Business Management Platform

> **Lead generation → Outreach → AI calling → Pipeline tracking → Deal closing** — a complete revenue operations platform in a single, self-hosted application.

---

## Overview

Business Hub is a full-stack business management platform that combines CRM, AI-powered calling, lead generation, campaign management, job tracking, content planning, and skill development into one unified interface. Built with **React + TypeScript** on the frontend and **Express.js + PostgreSQL** on the backend, it's designed for solo operators, small teams, and agencies who need enterprise-level tools without the enterprise price tag.

### What Makes It Different

- **AI Calling Engine** — Not just a dialer. A full bidirectional conversation pipeline (Audio → STT → LLM → TTS → Audio) that handles calls autonomously, negotiates rates, and books meetings.
- **Lead Scraper** — Google search-based lead discovery with automatic website scraping for emails, phone numbers, and industry classification.
- **Autonomous Agents** — AI agents that process lead queues independently, making calls, handling objections, and reporting results in real-time via WebSocket.
- **Self-Hosted** — Your data stays on your servers. No per-seat pricing. No vendor lock-in.

---

## Core Features

### 1. Lead Management (CRM)

Full-featured CRM with pipeline visualization and lead lifecycle management.

| Capability | Details |
|---|---|
| **Lead CRUD** | Create, update, delete leads with rich metadata (company, contact, email, phone, industry, website, tags) |
| **Pipeline Board** | Drag-and-drop Kanban board with customizable columns (New → Contacted → Qualified → Proposal → Won/Lost) |
| **Lead Table View** | Sortable, filterable data table with search — all columns visible at a glance |
| **Lead Profiles** | Individual lead detail pages with notes, call history, messages, and linked task boards |
| **Follow-Up Tracking** | Follow-up date scheduling with automatic status transitions |
| **Tagging System** | Arbitrary tag assignment for segmentation and filtering |
| **Import/Export** | CSV import for bulk lead loading with smart field mapping |
| **DNC List** | Do-Not-Call list management — automatically skip DNC leads in campaigns |

**Data Model:** Each lead stores `name`, `company`, `contactPerson`, `email`, `phone`, `status`, `source`, `industry`, `website`, `websiteIssues` (JSON array), `tags` (JSON array), `linkedBoardId`, `followUpDate`, `lastContactedAt`, `notes`.

---

### 2. AI Calling System

The centerpiece of the platform — a complete AI-powered outbound calling system.

#### 2a. Call Scripts

| Capability | Details |
|---|---|
| **Script Editor** | Rich script creation with opening lines, talking points, objection handlers, and closing strategies |
| **Script Purposes** | Pre-built categories: discovery, follow-up, closing, rate-negotiation |
| **Objection Handling** | Define objection-response pairs the AI uses during conversations |
| **Rate Ranges** | Configure min/max/target rates and currency for negotiation-focused scripts |
| **AI Assistant Config** | Per-script configuration: business name, agent name, agent role, voice ID, LLM model, LLM provider, temperature, max duration, conversation style, end call phrases, custom system prompt |
| **Usage Analytics** | Track usage count and success rate per script |

#### 2b. AI Conversation Engine

Real-time bidirectional conversation pipeline for AI-powered phone calls.

```
Caller Audio (mulaw) → Deepgram STT → OpenAI GPT → TTS → mulaw Audio → Caller
```

| Capability | Details |
|---|---|
| **Real-Time STT** | Deepgram Nova-2 model for speech-to-text with interim/final transcript handling |
| **LLM Conversation** | OpenAI GPT-driven conversation with script context, lead data, and conversation history |
| **Text-to-Speech** | AI-generated voice responses streamed back to the caller in real-time |
| **Interruption Handling** | Detects when the human interrupts and gracefully handles speech overlap |
| **Intent Classification** | Classifies user intent during conversation (interested, not-interested, question, objection, callback) |
| **Outcome Detection** | Automatic detection of call outcomes: booked, follow-up, not-interested, voicemail |
| **Conversation Ender Detection** | Recognizes goodbye phrases to end calls naturally |
| **Turn Limits** | Configurable max conversation turns (default: 30) to prevent runaway calls |

#### 2c. Autonomous AI Agents

AI agents that autonomously process lead queues, making calls without human intervention.

| Capability | Details |
|---|---|
| **Agent Spawning** | Create named agents with a script, lead queue, and configuration |
| **Queue Processing** | Sequential lead processing with configurable delays between calls |
| **Step Machine** | Agent state transitions: `lead-selected → dialing → speaking → negotiating → booked/skipped` |
| **Pause/Resume/Stop** | Full lifecycle control over running agents |
| **Real-Time Dashboard** | React Flow-based visual dashboard showing agent step changes, animated edges, and live activity feed |
| **WebSocket Events** | `agent:step-change`, `agent:status`, `agent:log`, `call:update` — all streamed to the frontend in real-time |
| **Stats Tracking** | Per-agent: total calls, booked count, skipped count, average duration |
| **Batch Calling** | Launch batch calls across multiple leads with live progress tracking |

#### 2d. Call Logging & Analytics

| Capability | Details |
|---|---|
| **Call Log Table** | Filterable table of all calls with lead name, duration, status, outcome, recordings |
| **Call Stats Cards** | Today's calls, total calls, booked meetings, average duration, conversion rate |
| **Outcome Breakdown** | Pie chart of call outcomes: booked, follow-up, not-interested, voicemail |
| **Daily Volume Chart** | Line chart of calls per day over the last 30 days |
| **Call Recordings** | Twilio recording URLs stored on each call record |
| **Transcriptions** | Full call transcription via Deepgram with AI-generated summaries |
| **Sentiment Analysis** | AI classifies each call as positive, neutral, or negative |
| **Meeting Notes** | Auto-generated from transcriptions with action items, decisions, and follow-up dates |

#### 2e. Rate Negotiation

AI-powered pricing strategy for service-based businesses.

| Capability | Details |
|---|---|
| **AI Strategy Suggestions** | LLM analyzes lead data, past negotiations, and market context to suggest optimal rates |
| **Negotiation Tracking** | Track initial rate → proposed rate → final rate with status (pending, negotiating, accepted, rejected, counter-offered) |
| **History-Aware** | Uses past negotiation history with the same lead to inform strategy |

---

### 3. Campaign Management

Organize and track outreach at scale.

| Capability | Details |
|---|---|
| **Campaign Creation** | Name, script, industry, tier (1/2/3), lead selection, board linking |
| **Campaign Dashboard** | List view of all campaigns with status, lead count, and conversion metrics |
| **Campaign Analytics** | Aggregated stats across campaigns: total calls, booked meetings, conversion rates, daily volume |
| **DNC Filtering** | Automatic exclusion of Do-Not-Call leads from campaigns |
| **Multi-Provider** | Works with Twilio and Vapi telephony providers |

---

### 4. Lead Scraper & Automation

Automated lead discovery and enrichment.

| Capability | Details |
|---|---|
| **Google Search Scraping** | Search queries return business names and website URLs with smart filtering (skips Google, social media, etc.) |
| **Website Scraping** | Extracts emails (from page text + mailto links), phone numbers (from text + tel links) from business websites |
| **Industry Classification** | AI guesses industry from website meta descriptions and titles (10 categories: software, marketing, consulting, etc.) |
| **Deduplication** | Compares scraped leads against existing database by website domain, email, and company name |
| **Bulk Import** | Scraped leads can be imported directly into the CRM |

---

### 5. Email Outreach

Template-based email campaigns with personalization.

| Capability | Details |
|---|---|
| **Email Templates** | Create and manage reusable email templates with subject lines and body content |
| **Variable Personalization** | `{{company}}`, `{{contactPerson}}`, `{{email}}`, `{{industry}}`, `{{website}}` — auto-replaced per lead |
| **Batch Sending** | Send to multiple leads with configurable delays between emails (default: 30 seconds) |
| **Daily Limits** | Configurable daily email quota to stay within SMTP provider limits |
| **Send Tracking** | All sent emails logged as Message records with delivery status |
| **Auto Status Update** | Lead status automatically set to "contacted" after successful email delivery |
| **SMTP Configuration** | User-configurable SMTP settings (host, port, credentials) |
| **Message History** | Full communication history per lead across email, WhatsApp, LinkedIn, and calls |

---

### 6. Job Tracker

Application tracking system for job seekers or recruiters.

| Capability | Details |
|---|---|
| **Job Board** | Kanban board for job applications with customizable status columns |
| **Job Table View** | Data table with all jobs, filterable by status, location, company |
| **Job Details** | Title, company, location (remote/onsite/hybrid), description, salary range (min/max + currency), requirements, skills, experience level, priority, source URL |
| **CV Management** | Upload and manage multiple CV/resume files with one default selection |
| **Job Search Prompts** | Save and reuse job search configurations with sources, tags, and custom prompts |
| **Job Templates** | Reusable job application templates |

---

### 7. Task Boards

Project and task management with Kanban boards.

| Capability | Details |
|---|---|
| **Multiple Boards** | Create unlimited task boards, each with custom columns |
| **Custom Columns** | Define column names and colors per board |
| **Drag-and-Drop** | Drag tasks between columns to update status |
| **Task Details** | Title, description, status, priority, assignee, due date, tags |
| **Subtasks** | Nested subtask lists within each task (stored as JSON) |
| **Lead Linking** | Link task boards to specific leads for project-based tracking |
| **Position Ordering** | Tasks maintain their position within columns |

---

### 8. Content Studio

Content pipeline management for creators and marketers.

| Capability | Details |
|---|---|
| **Content CRUD** | Create and manage content items with type (long/short), status (idea → script → recording → published), topic, hook, notes |
| **Content Pipeline** | Visual pipeline view of content by status |
| **Scheduling** | Schedule content for specific dates |
| **Slide Details** | Store lecture numbers and folder references for educational content |
| **Comments** | Add comments to content items for collaboration |
| **URL Tracking** | Attach multiple URLs to content items (published links, references) |

---

### 9. Template System

Comprehensive template management for all business communications.

| Capability | Details |
|---|---|
| **Template Categories** | LinkedIn, email, proposal, and custom categories |
| **Rich Content** | Supports raw markdown and structured JSON content |
| **Template Variables** | Define variables that get replaced when templates are used |
| **Folder Organization** | Group templates into folders with custom icons and colors |
| **Version Control** | Templates track version numbers |
| **Usage Analytics** | Track how many times each template has been used and when |
| **Favorites & Pinning** | Mark templates as favorites or pin them for quick access |
| **Locking** | Lock templates to prevent unauthorized edits |
| **History & Comments** | Full audit trail of template changes with comment threads |

---

### 10. Skill Mastery

Personal and team skill development tracking.

| Capability | Details |
|---|---|
| **Skill Tree** | Visual skill progression system |
| **Progress Tracking** | Track learning progress per skill with JSON-based flexible data storage |
| **User-Specific** | Each user has their own skill mastery data |

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6, React Router, React Flow, Framer Motion |
| **Backend** | Node.js, Express.js, ES Modules |
| **Database** | PostgreSQL with Prisma ORM |
| **Real-Time** | WebSocket (ws library) with server-side heartbeat |
| **AI / LLM** | OpenAI GPT (pluggable via adapter pattern) |
| **Speech-to-Text** | Deepgram Nova-2 (pluggable via adapter pattern) |
| **Text-to-Speech** | Pluggable TTS adapter |
| **Telephony** | Twilio Voice + Vapi AI (pluggable via adapter pattern) |
| **Email** | Nodemailer with user-configurable SMTP |
| **Testing** | Playwright (72 E2E tests — 51 API + 21 UI) |
| **CI/CD** | GitHub Actions pipeline |
| **Logging** | Winston (structured JSON, file rotation) |
| **Security** | Helmet, rate limiting (3 tiers), input sanitization |

### Adapter Pattern (Pluggable Providers)

The calling system uses a clean adapter pattern, making it easy to swap providers:

```
server/adapters/
├── telephony/        # Twilio, Vapi (voice call providers)
├── llm/              # OpenAI (conversation AI)
├── stt/              # Deepgram (speech-to-text)
├── voice/            # TTS providers
└── index.js          # Adapter factory
```

Each adapter implements a standard interface. To add a new provider (e.g., ElevenLabs for TTS), implement the interface and register it in the factory.

### Security

| Feature | Implementation |
|---|---|
| **Security Headers** | Helmet.js — X-Frame-Options, HSTS, XSS-Protection, Referrer-Policy |
| **Rate Limiting** | 3 tiers: 100 req/15min (general), 10 req/5min (auth), 5 req/15min (strict) |
| **Input Sanitization** | Strips `<script>` tags, event handlers, `javascript:` URIs from all inputs |
| **File Upload Validation** | Extension whitelist, 10MB size limit, path traversal prevention |
| **Environment Validation** | Fails fast on missing required vars, warns on missing optional vars |
| **Per-User API Keys** | Users configure their own Twilio/OpenAI/Deepgram keys — never stored in `process.env` |

### Database Schema

17 PostgreSQL models managed by Prisma ORM:

| Model | Purpose |
|---|---|
| `User` | Authentication + relations to all user data |
| `Lead` | CRM contacts with pipeline status |
| `Job` | Job applications with salary data |
| `Task` / `TaskBoard` | Kanban-style project management |
| `Template` / `TemplateFolder` | Communication templates with folders |
| `Content` | Content pipeline items |
| `Message` | Cross-channel communication history |
| `EmailTemplate` / `EmailSettings` | Email configuration |
| `Call` | Call records with transcriptions, summaries, sentiment |
| `CallScript` | AI conversation scripts with assistant config |
| `AgentInstance` | Autonomous AI agents (also used for campaigns) |
| `MeetingNote` | Auto-generated meeting notes from call transcriptions |
| `RateNegotiation` | AI-powered pricing negotiation tracking |
| `SkillMastery` | Personal skill development data |
| `CVFile` | Resume/CV file management |
| `JobSearchPrompt` / `JobTemplate` | Job search configuration |

### WebSocket Architecture

Real-time event streaming with reliability features:

- **Server-Side Heartbeat** — 30-second ping interval, 10-second pong timeout
- **Dead Connection Cleanup** — Terminates connections that miss pong responses
- **Exponential Backoff Reconnection** — Frontend reconnects with 1s → 2s → 4s → 30s backoff
- **Agent Event Subscriptions** — Subscribe to specific agent IDs for targeted event delivery
- **Event Types:** `agent:step-change`, `agent:status`, `agent:log`, `call:update`

### API Documentation

Interactive Swagger UI available at `/api-docs` when the server is running.

**Endpoint Groups:**
- `/api/auth` — Register, login, profile
- `/api/leads` — Lead CRUD + pipeline
- `/api/jobs` — Job CRUD + applications
- `/api/calls` — Call management, scripts, stats
- `/api/agents` — AI agent lifecycle
- `/api/campaigns` — Campaign CRUD + analytics
- `/api/resources` — Task boards, templates, settings
- `/api/skillmastery` — Skill tracking
- `/api/email` — Email sending + templates
- `/api/scraper` — Lead discovery
- `/api/health` — System diagnostics (DB, memory, uptime, WS clients)

---

## Testing

72 end-to-end tests across 2 test projects:

| Project | Tests | Coverage |
|---|---|---|
| **API Tests** | 51 | Auth flow, CRUD for leads/jobs/content/tasks, templates, calling, agents, campaigns, health |
| **UI Tests** | 21 | Login, dashboard, leads, jobs, task boards, content, templates, calling, analytics, settings |

Run tests:
```bash
npx playwright test                    # All tests
npx playwright test --project=api      # API only
npx playwright test --project=ui       # UI only (headed: --headed)
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+

### Setup

```bash
# Clone & install
git clone <repo-url> && cd schedule-manager
pnpm install

# Configure environment
cp .env.example .env
# Set DATABASE_URL (required)
# Optionally set: TWILIO_*, OPENAI_API_KEY, DEEPGRAM_API_KEY, VAPI_API_KEY

# Setup database
cd server && npx prisma generate && npx prisma db push && cd ..

# Start
pnpm run dev          # Frontend → http://localhost:5173
node server/index.js  # Backend → http://localhost:3002
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: 3002) |
| `TWILIO_ACCOUNT_SID` | ❌ | For outbound calls |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio authentication |
| `TWILIO_PHONE_NUMBER` | ❌ | Caller ID for outbound calls |
| `OPENAI_API_KEY` | ❌ | For AI conversation + summarization |
| `DEEPGRAM_API_KEY` | ❌ | For speech-to-text |
| `VAPI_API_KEY` | ❌ | For Vapi voice agents |
| `SMTP_HOST/PORT/USER/PASS` | ❌ | For email outreach |

> **Note:** External API keys are optional. The platform works for CRM/jobs/tasks/content without them. AI calling and email features require their respective keys.

---

## License

Private / Commercial. Contact for licensing.
