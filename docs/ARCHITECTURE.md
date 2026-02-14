# Business Hub API — Architecture

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (Vite + React)"]
        SPA["SPA (React Router)"]
        WS_CLIENT["WebSocket Client"]
    end

    subgraph Backend["Backend (Express.js)"]
        MW["Middleware Stack"]
        ROUTES["API Routes"]
        SERVICES["Service Layer"]
        WS_SERVER["WebSocket Server"]
    end

    subgraph Data["Data Layer"]
        DB["PostgreSQL"]
        PRISMA["Prisma ORM"]
        CACHE["In-Memory Cache"]
    end

    subgraph External["External APIs"]
        TWILIO["Twilio (Voice)"]
        VAPI["Vapi (AI Agents)"]
        OPENAI["OpenAI (GPT)"]
        DEEPGRAM["Deepgram (STT)"]
        SMTP["SMTP (Email)"]
    end

    SPA -->|HTTP| MW
    WS_CLIENT -->|WebSocket| WS_SERVER
    MW --> ROUTES
    ROUTES --> SERVICES
    SERVICES --> PRISMA
    PRISMA --> DB
    SERVICES --> CACHE
    SERVICES --> External
    WS_SERVER -->|Events| WS_CLIENT
```

## Middleware Chain

```
Request → Helmet → CORS → JSON Parser → Sanitize → Request Logger → Rate Limiter → Auth → Route Handler → Error Handler
```

| Middleware | File | Purpose |
|---|---|---|
| Helmet | `helmet` (npm) | Security headers (X-Frame-Options, HSTS, etc.) |
| CORS | `cors` (npm) | Cross-origin resource sharing |
| Sanitize | `middleware/sanitize.js` | Strip XSS from body/query/params |
| Request Logger | `middleware/requestLogger.js` | Log method, URL, status, duration |
| Rate Limiter | `middleware/rateLimiter.js` | 100 req/15min (general), 10 req/5min (auth) |
| Auth | `middleware/auth.js` | `x-user-id` header validation |
| Error Handler | `middleware/errorHandler.js` | Global catch-all for unhandled errors |

## API Route Map

| Prefix | Route File | Auth | Description |
|---|---|---|---|
| `/api/auth` | `routes/auth.js` | ❌ | Login, register, profile |
| `/api/leads` | `routes/leads.js` | ✅ | Lead CRUD + pipeline |
| `/api/jobs` | `routes/jobs.js` | ✅ | Job CRUD + applications |
| `/api/contents` | `routes/contents.js` | ✅ | Content studio |
| `/api/resources` | `routes/extra.js` | ✅ | Task boards, templates, settings |
| `/api/skillmastery` | `routes/skillMastery.js` | ✅ | Skill tracking + mastery |
| `/api/calls` | `routes/calls.js` | ✅ | Call CRUD, scripts, stats |
| `/api/agents` | `routes/agents.js` | ✅ | AI agent management |
| `/api/campaigns` | `routes/campaignRoutes.js` | ✅ | Campaign CRUD + analytics |
| `/api/calls/twilio` | `routes/twilioWebhooks.js` | Twilio | Twilio webhooks |
| `/api/calls/vapi` | `routes/vapiWebhooks.js` | ❌ | Vapi webhooks |

## WebSocket Events

```mermaid
sequenceDiagram
    participant Client
    participant Server
    
    Client->>Server: connect /ws/calls
    Server->>Client: { type: "connected", clientId }
    Client->>Server: { type: "auth", userId }
    Server->>Client: { type: "auth:ok" }
    Client->>Server: { type: "subscribe:agent", agentId }
    Server->>Client: { type: "subscribed", agentId }
    
    loop Heartbeat every 30s
        Server->>Client: ping
        Client->>Server: pong
    end
    
    loop Agent Events
        Server->>Client: { type: "agent:step-change" }
        Server->>Client: { type: "agent:status" }
        Server->>Client: { type: "agent:log" }
        Server->>Client: { type: "call:update" }
    end
```

## Data Flow

```mermaid
graph LR
    subgraph Calling Flow
        LEAD[Lead] --> CAMPAIGN[Campaign]
        CAMPAIGN --> AGENT[AI Agent]
        AGENT --> CALL[Call via Twilio/Vapi]
        CALL --> WEBHOOK[Webhook]
        WEBHOOK --> UPDATE[Update Call Record]
        UPDATE --> WS[WebSocket Broadcast]
    end
```

## Directory Structure

```
server/
├── config/           # Database, logger, env validation
│   ├── prisma.js
│   ├── logger.js
│   └── validateEnv.js
├── middleware/        # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── requestLogger.js
│   ├── sanitize.js
│   └── security.js
├── routes/            # API route handlers
├── services/          # Business logic
├── adapters/          # External API adapters (Twilio, Vapi, Deepgram)
├── repositories/      # Data access layer
└── index.js           # Server entry point
```
