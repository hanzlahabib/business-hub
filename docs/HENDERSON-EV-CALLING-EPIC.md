# Henderson EV — AI Contractor Outreach System

Auto-call 27 Henderson/Las Vegas electricians using Vapi AI + Twilio to find 1-3 contractors willing to buy leads from hendersonevcharger.com at $50-150/lead.

---

## Current Status

| Item | Status |
|------|--------|
| All 4 sprints | Code complete |
| Vapi AI integrated | Done (imported Twilio number) |
| Configurable assistant | Done (no more hardcoded prompts) |
| Campaign system | Done |
| DNC compliance | Done |
| **Blocker** | Twilio trial account — needs $20 upgrade to call unverified numbers |

**Next step**: Upgrade Twilio ($20), then test full Vapi AI call flow end-to-end.

---

## Architecture Overview

```
Schedule Manager UI
  ├── ScriptEditor (configure AI assistant per niche)
  ├── BatchCallLauncher (select leads, pick script, launch)
  └── AgentDashboard (monitor live agents)
        ↓
CallScript (DB) — stores talking points + assistantConfig (voice, LLM, business context)
        ↓
callService.initiateCall()
  → loads script → merges assistantConfig → builds system prompt
  → passes to adapter
        ↓
Adapter Factory (TELEPHONY_PROVIDER env var)
  ├── VapiAdapter → Vapi API (manages STT + LLM + TTS)
  ├── TwilioAdapter → Twilio TwiML (keypress-only or Media Streams)
  └── MockAdapter → local testing
        ↓
Webhooks (call status, end-of-call-report, transcript)
  → update Call record → update Lead status → send SMS follow-up
```

---

## What's Built

### Sprint 1 — TwiML Call Flow + Outbound Dialer

Pre-recorded pitch using Twilio's `<Say>` + `<Gather>` for keypress responses.

| File | What |
|------|------|
| `server/routes/twilioWebhooks.js` | TwiML endpoints: `/twiml`, `/gather`, `/interested`, `/status`, `/recording`, `/amd`, `/stream`, `/sms` |
| `server/adapters/telephony/twilioAdapter.js` | Twilio adapter with AMD, Media Streams, SMS |
| `server/scripts/batch-call-henderson.js` | CLI batch caller (uses adapter factory, DNC filtering) |

**TwiML Flow:**
```
Call connects → <Say> pitch → <Gather numDigits=1>
  → 1: Interested → SMS follow-up
  → 2: Not interested → polite goodbye
  → 3: Call back later → schedule follow-up
  → No input: repeat once → goodbye
```

### Sprint 2 — AMD, DNC, SMS Follow-up

| File | What |
|------|------|
| `server/services/dncService.js` | Do Not Call list using Lead tags field (no migration needed) |
| `server/middleware/twilioValidation.js` | HMAC-SHA1 signature validation for Twilio webhooks |

- **AMD** (Answering Machine Detection): Twilio `MachineDetection` parameter detects voicemail vs human
- **DNC**: In-memory cache with 60s TTL, uses Lead model `tags` field (`opted-out`, `dnc-reason:*`, `dnc-date:*`)
- **SMS STOP handler**: Replies with "STOP" add to DNC list automatically
- **SMS follow-up**: Interested leads get a follow-up text with website link

### Sprint 3 — Conversational AI (Two Approaches)

**Approach A: Vapi AI (Active — recommended)**

Vapi handles the entire conversation: STT (Deepgram) + LLM (GPT-4o-mini) + TTS (ElevenLabs). We just configure the assistant and Vapi handles the rest.

| File | What |
|------|------|
| `server/adapters/telephony/vapiAdapter.js` | Vapi adapter — niche-agnostic, driven by assistantConfig |
| `server/routes/vapiWebhooks.js` | Handles: status-update, end-of-call-report, transcript, hang, tool-calls |

**Approach B: Twilio Media Streams (Fallback — for custom STT/LLM/TTS)**

Bidirectional WebSocket for real-time audio. Twilio streams audio → Deepgram STT → GPT-4o → ElevenLabs TTS → stream back.

| File | What |
|------|------|
| `server/services/twilioMediaStream.js` | WebSocket server at `/ws/twilio-media` |
| `server/services/callConversationEngine.js` | Real-time pipeline: mulaw audio → STT → LLM → TTS → mulaw |

### Sprint 4 — Campaigns, Transcription, Multi-Niche Support

| File | What |
|------|------|
| `server/services/campaignService.js` | Campaign CRUD using AgentInstance model (no migration needed) |
| `server/routes/campaignRoutes.js` | REST API: campaigns, DNC endpoints, batch transcription |
| `server/services/transcriptionService.js` | Transcribe recordings via STT + AI summary via LLM |

**Configurable Assistant System (the big one):**

| File | What |
|------|------|
| `CallScript.assistantConfig` (Prisma) | JSON field storing all AI config per script |
| `callService._buildSystemPrompt()` | Auto-generates system prompt from script fields + business context |
| `ScriptEditor.tsx` | UI with collapsible "AI Assistant Configuration" panel |

---

## Configurable Assistant — How It Works

Each CallScript now has an `assistantConfig` JSON field that configures the entire AI assistant without code changes:

```json
{
  "businessName": "Henderson EV Charger Pros",
  "businessWebsite": "hendersonevcharger.com",
  "businessLocation": "Henderson, Nevada",
  "agentName": "Mike",
  "agentRole": "lead generation specialist",
  "conversationStyle": "friendly, casual, and professional",
  "voiceId": "adam",
  "llmModel": "gpt-4o-mini",
  "temperature": 0.7,
  "maxDuration": 300,
  "customSystemPrompt": null
}
```

**Flow:**
1. User fills out ScriptEditor UI (business context + talking points + objections + AI config)
2. Script saved with `assistantConfig` to DB
3. When a call is made, `callService` loads script → merges `assistantConfig` → auto-generates system prompt
4. VapiAdapter uses the config for voice, LLM model, temperature, greeting, etc.
5. **No code changes needed for new niches** — just create a new script in the UI

**Auto-generated system prompt includes:**
- Agent persona (name, role, style)
- Business context (name, website, location)
- Goal from script purpose
- Talking points
- Objection handlers
- Rate negotiation parameters
- Closing strategy
- Conversation style rules

**Custom override:** Set `customSystemPrompt` in the UI to bypass auto-generation and use your own prompt.

---

## Voice Presets

| Name | Voice | ElevenLabs ID |
|------|-------|---------------|
| adam | Deep male | `pNInz6obpgDQGcFmaJgB` |
| josh | Natural male | `TxGEqnHWrfWFTfGW9XjX` |
| rachel | Female | `21m00Tcm4TlvDq8ikWAM` |
| arnold | Deep male | `VR6AewLTigWG4xSOukaG` |
| bella | Soft female | `EXAVITQu4vr4xnSDxMaL` |

---

## API Endpoints Added

### Campaign API (`/api/campaigns` — auth required)

| Method | Endpoint | What |
|--------|----------|------|
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create campaign (auto-selects leads) |
| `GET` | `/api/campaigns/:id` | Campaign detail with funnel stats |
| `GET` | `/api/campaigns/analytics` | Cross-campaign analytics |
| `POST` | `/api/campaigns/:id/transcribe` | Batch transcribe campaign calls |
| `POST` | `/api/campaigns/calls/:id/transcribe` | Transcribe single call |

### DNC API (`/api/campaigns/dnc` — auth required)

| Method | Endpoint | What |
|--------|----------|------|
| `GET` | `/api/campaigns/dnc/list` | List all DNC numbers |
| `POST` | `/api/campaigns/dnc/add` | Add number to DNC |
| `DELETE` | `/api/campaigns/dnc/remove` | Remove from DNC |

### Vapi Webhooks (`/api/calls/vapi` — no auth)

| Method | Endpoint | What |
|--------|----------|------|
| `POST` | `/api/calls/vapi/webhook` | Receives all Vapi events (status, transcript, end-of-call-report) |

### Twilio Webhooks (`/api/calls/twilio` — Twilio signature validation)

| Method | Endpoint | What |
|--------|----------|------|
| `POST` | `/api/calls/twilio/twiml` | Initial TwiML pitch |
| `POST` | `/api/calls/twilio/gather` | Keypress handler |
| `POST` | `/api/calls/twilio/interested` | Interested flow |
| `POST` | `/api/calls/twilio/status` | Call status updates |
| `POST` | `/api/calls/twilio/recording` | Recording callbacks |
| `POST` | `/api/calls/twilio/amd` | Answering Machine Detection |
| `POST` | `/api/calls/twilio/stream` | Media Streams TwiML |
| `POST` | `/api/calls/twilio/sms` | Inbound SMS handler |

---

## Environment Variables

```env
# Telephony provider (active)
TELEPHONY_PROVIDER=vapi         # vapi | twilio | mock

# Vapi AI
VAPI_API_KEY=faabd0f0-...       # Private API key
VAPI_PHONE_NUMBER_ID=e1b9e433-... # Imported Twilio number

# Twilio (still needed for SMS — Vapi doesn't do SMS)
TWILIO_ACCOUNT_SID=AC2208ac...
TWILIO_API_KEY_SID=SKab922c...
TWILIO_API_KEY_SECRET=iBqLHK...
TWILIO_PHONE_NUMBER=+17259991133

# AI Providers (used by Vapi or directly)
ELEVENLABS_API_KEY=your_key
OPENAI_API_KEY=your_key
DEEPGRAM_API_KEY=your_key

# Webhooks
WEBHOOK_BASE_URL=https://yourserver.com  # Public URL for provider callbacks

# Mock mode
CALLING_MOCK_MODE=false         # true = skip all real calls
```

---

## File Map

### New Files (created during this epic)

```
server/
├── routes/
│   ├── twilioWebhooks.js          # TwiML + SMS + AMD + status webhooks
│   ├── vapiWebhooks.js            # Vapi event webhooks
│   └── campaignRoutes.js          # Campaign + DNC REST API
├── services/
│   ├── dncService.js              # Do Not Call list (TCPA compliance)
│   ├── campaignService.js         # Campaign management using AgentInstance
│   ├── transcriptionService.js    # Call recording transcription + AI summary
│   ├── twilioMediaStream.js       # WebSocket for Twilio Media Streams
│   └── callConversationEngine.js  # Real-time STT → LLM → TTS pipeline
├── middleware/
│   └── twilioValidation.js        # HMAC-SHA1 webhook signature verification
└── scripts/
    └── batch-call-henderson.js    # CLI batch caller with DNC + adapter factory
```

### Modified Files

```
server/
├── adapters/
│   └── telephony/
│       ├── vapiAdapter.js         # Rewritten — niche-agnostic, config-driven
│       └── twilioAdapter.js       # Added AMD, Media Streams, SMS
├── services/
│   └── callService.js             # Enhanced _buildSystemPrompt(), script config merging
├── index.js                       # Added Vapi/campaign routes, Media Streams WS
└── prisma/
    └── schema.prisma              # Added assistantConfig Json field to CallScript

src/modules/calling/
├── components/
│   └── ScriptEditor.tsx           # Added AI Assistant Configuration panel
└── hooks/
    └── useCalls.ts                # Added AssistantConfig interface
```

---

## Henderson EV Data

| Item | Count |
|------|-------|
| Contractor leads in DB | 27 |
| Tier 1 (priority) | 8 |
| Tier 2 | 10 |
| Tier 3 | 9 |
| Phone number | (725) 999-1133 |
| CallScript in DB | "Henderson EV - Contractor Discovery Call" |
| Task board columns | 6 (New → Contacted → Interested → Negotiating → Closed → Not Interested) |

---

## Batch Call Script Usage

```bash
# Preview without calling
node server/scripts/batch-call-henderson.js --dry-run

# Call tier-1 only (8 contractors)
node server/scripts/batch-call-henderson.js --tier 1

# Call first 3, 30s delay between calls
node server/scripts/batch-call-henderson.js --limit 3 --delay 30

# Call all with phone numbers
node server/scripts/batch-call-henderson.js
```

The script uses the adapter factory (`TELEPHONY_PROVIDER` env var) so it works with both Vapi and Twilio. DNC numbers are automatically filtered.

---

## Adding a New Niche (Zero Code)

To use this system for a different lead gen niche (e.g., plumber, roofer, HVAC):

1. **Create leads** — Add contractor leads to a TaskBoard in Schedule Manager
2. **Create a script** — Go to Calling → Scripts → New Script
3. **Fill in the Script Editor:**
   - Basic: name, purpose, industry
   - Opening line (what the AI says first)
   - AI Configuration (expand the panel):
     - Business name, website, location
     - Agent name and persona
     - Voice preset and LLM model
   - Talking points (key selling points)
   - Objection handlers (common pushbacks + responses)
   - Rate range and closing strategy
4. **Launch calls** — Use BatchCallLauncher or the CLI script
5. **Monitor** — AgentDashboard shows live progress via WebSocket

No adapter changes, no code changes, no deployments.

---

## Cost Estimate (Vapi AI)

| Component | Cost/min | 5-min call |
|-----------|----------|-----------|
| Vapi orchestration | $0.05 | $0.25 |
| ElevenLabs TTS (via Vapi) | $0.07 | $0.35 |
| GPT-4o mini LLM | $0.006 | $0.03 |
| Deepgram STT | ~$0.004 | $0.02 |
| **Total** | **~$0.13/min** | **~$0.65/call** |

27 contractors × ~$0.65/call = **~$17.55 total** for the Henderson EV campaign.

---

## What's Left (Not Code)

1. **Upgrade Twilio** — $20 minimum top-up to remove trial restrictions
2. **Set WEBHOOK_BASE_URL** — Need public URL (ngrok or deployed server) for Vapi/Twilio callbacks
3. **Test end-to-end** — Call personal number first, then one contractor
4. **Run tier-1 batch** — 8 priority contractors
5. **Run remaining tiers** — 19 more contractors based on tier-1 results
