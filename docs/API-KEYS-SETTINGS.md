# API Keys Settings — Per-User Key Management

**Date:** 2026-02-13
**Status:** Implemented
**Scope:** Central UI for API key configuration + per-user adapter isolation

---

## Overview

Users configure API keys (Vapi, Twilio, OpenAI, ElevenLabs, Deepgram, Webhooks) through a Settings Modal tab instead of editing `.env` files. Keys are stored per-user in the database and loaded into per-user adapter instances at runtime. No `process.env` mutation — keys never bleed between users.

## Architecture

```
User fills form in "API Keys" tab
  → PATCH /api/resources/settings saves to Settings.config.apiKeys in DB
  → loadUserKeys(userId) updates per-user in-memory cache
  → Cached adapter instances invalidated
  → Next adapter access creates fresh instances with that user's keys
  → Adapters fall back to .env defaults for any missing keys
```

### Key Design Decisions

- **No `process.env` writes** — prevents key bleeding between users in the same Node process
- **Per-user adapter cache** (`Map<userId, adapterInstances>`) — each user gets their own adapter singletons
- **Constructor injection** — adapters already supported `config.apiKey || process.env.X`; we pass config directly via `createAdapters(config)`
- **Lazy invalidation** — adapter cache for a user is cleared when they save new keys; next access recreates

## Data Shape (stored in `Settings.config`)

```json
{
  "apiKeys": {
    "vapi": { "apiKey": "...", "phoneNumberId": "..." },
    "twilio": { "accountSid": "...", "apiKeySid": "...", "apiKeySecret": "...", "phoneNumber": "..." },
    "openai": { "apiKey": "..." },
    "elevenlabs": { "apiKey": "..." },
    "deepgram": { "apiKey": "..." },
    "webhook": { "baseUrl": "..." }
  }
}
```

## Files Created

### `src/components/Forms/ApiKeysTab.tsx`
Central UI component for API key configuration. Rendered inside SettingsModal when "API Keys" tab is active.

- 6 collapsible provider cards (Vapi, Twilio, OpenAI, ElevenLabs, Deepgram, Webhooks)
- Active/Missing Key status badges per provider
- Password-type inputs with toggle visibility (eye icon)
- Collapsible setup instructions with external "Get Key" links
- Single "Save All API Keys" button
- Loads existing values on mount from `GET /api/resources/settings`

### `server/services/apiKeyService.js`
Per-user API key service. Zero `process.env` mutation.

**Exports:**

| Function | Purpose |
|----------|---------|
| `loadAllUserKeys()` | Startup: loads all users' keys from DB into per-user Map cache |
| `loadUserKeys(userId)` | On save: reloads one user's keys, invalidates their cached adapters |
| `getUserKeys(userId)` | Returns raw apiKeys object from cache |
| `getAdaptersForUser(userId)` | Returns per-user adapter instances (cached, created via `createAdapters`) |
| `invalidateUserAdapters(userId)` | Clears cached adapters for a user |

## Files Modified

### `server/adapters/index.js`
Added `createAdapters(config)` export — creates fresh adapter instances with explicit config passed to constructors. Does NOT touch the global `_adapters` singleton. Existing `getAdapters()` unchanged for backward compat.

### `src/components/Forms/SettingsModal.tsx`
- Added `API Keys` tab (`{ id: 'apikeys', label: 'API Keys', icon: Key }`)
- Renders `<ApiKeysTab />` when active

### `server/routes/extra.js`
- `PATCH /settings` handler now calls `loadUserKeys(req.user.id)` when `apiKeys` is in the payload
- Imported `loadUserKeys` from apiKeyService

### `server/index.js`
- Calls `loadAllUserKeys()` at startup (after WebSocket init, before `server.listen`)
- Imported `loadAllUserKeys` from apiKeyService

### Service Migration (13 call sites across 8 files)

All services migrated from `getAdapters()` (global singleton) to `getAdaptersForUser(userId)` (per-user instances):

| File | Call Sites | userId Source |
|------|-----------|--------------|
| `server/services/callService.js` | 2 | `initiateCall(userId)` param; `handleWebhook` looks up `call.userId` from DB |
| `server/services/agentCallingService.js` | 1 | Threaded through `_waitForCallCompletion(..., userId)` |
| `server/services/callScriptService.js` | 1 | `generate(userId, ...)` param |
| `server/services/callConversationEngine.js` | 4 | Added `userId` to constructor, stored as `this.userId` |
| `server/services/transcriptionService.js` | 2 | `transcribeCall(callId, userId)` param; threaded to `_generateSummary` |
| `server/services/meetingNoteService.js` | 1 | `transcribeAndSummarize(userId, ...)` param |
| `server/services/rateNegotiationService.js` | 1 | `suggestStrategy(userId, ...)` param |
| `server/routes/twilioWebhooks.js` | 1 | Looks up `lead.userId` from DB |
| `server/services/twilioMediaStream.js` | 0 (caller) | Looks up `call.userId` from DB, passes to `CallConversationEngine` constructor |

### Not Changed (intentionally)
- `server/scripts/batch-call-henderson.js` — standalone script, not multi-user, reads `.env` directly
- `server/adapters/index.js` — `getAdapters()` still exported for `getAdapterInfo()` and batch scripts

## Env Var Mapping

Keys stored in DB map to these env vars (used as fallback when no DB key exists):

| DB Path | Env Var |
|---------|---------|
| `apiKeys.vapi.apiKey` | `VAPI_API_KEY` |
| `apiKeys.vapi.phoneNumberId` | `VAPI_PHONE_NUMBER_ID` |
| `apiKeys.twilio.accountSid` | `TWILIO_ACCOUNT_SID` |
| `apiKeys.twilio.apiKeySid` | `TWILIO_API_KEY_SID` |
| `apiKeys.twilio.apiKeySecret` | `TWILIO_API_KEY_SECRET` |
| `apiKeys.twilio.phoneNumber` | `TWILIO_PHONE_NUMBER` |
| `apiKeys.openai.apiKey` | `OPENAI_API_KEY` |
| `apiKeys.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` |
| `apiKeys.deepgram.apiKey` | `DEEPGRAM_API_KEY` |
| `apiKeys.webhook.baseUrl` | `WEBHOOK_BASE_URL` |

## Verification Checklist

- [ ] Start server (`make server`) — verify "API keys loaded for N user(s)" log appears
- [ ] Open Settings Modal → "API Keys" tab visible with 3 tabs (General, Email, API Keys)
- [ ] Provider cards show correct Active/Missing Key badges based on stored data
- [ ] Fill in a key → Save → reload page → key persists (masked in UI)
- [ ] Toggle eye icon reveals/hides secret values
- [ ] Collapsible setup instructions expand/collapse correctly
- [ ] Server logs: no `process.env` mutation warnings
- [ ] Two different users' keys don't interfere with each other
- [ ] Services use correct per-user adapters (verify via call initiation)
- [ ] Webhook handler (`twilioWebhooks.js`) resolves userId from lead record
- [ ] `CallConversationEngine` receives userId via constructor and uses per-user adapters
