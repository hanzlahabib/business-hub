#!/bin/bash
#
# Verify Twilio webhook endpoints are accessible from the public internet.
# Run AFTER starting the cloudflare tunnel and dev server.
#
# Usage:
#   pnpm run dev                    # terminal 1
#   npx cloudflared tunnel ...      # terminal 2 (if not already running)
#   bash scripts/verify-webhooks.sh # terminal 3
#

set -e

# Use WEBHOOK_BASE_URL from env if set, otherwise load from .env
if [ -z "$WEBHOOK_BASE_URL" ] && [ -f .env ]; then
  export $(grep WEBHOOK_BASE_URL .env | xargs)
fi

BASE="${WEBHOOK_BASE_URL:-http://localhost:3002}"
echo "🔍 Testing webhook endpoints at: $BASE"
echo ""

PASS=0
FAIL=0

check() {
  local name=$1
  local url=$2
  local method=${3:-GET}

  local code
  if [ "$method" = "POST" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "CallSid=test&CallStatus=completed" --max-time 10 2>/dev/null)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 2>/dev/null)
  fi

  if [ "$code" -ge 200 ] && [ "$code" -lt 500 ]; then
    echo "  ✅ $name → HTTP $code"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name → HTTP $code (unreachable or server error)"
    FAIL=$((FAIL+1))
  fi
}

echo "1️⃣  API Health (sanity check)"
check "Health" "$BASE/api/health"

echo ""
echo "2️⃣  Twilio Webhook Endpoints"
check "TwiML" "$BASE/api/calls/twilio/twiml?leadId=test&scriptId=test" POST
check "Gather" "$BASE/api/calls/twilio/gather?leadId=test" POST
check "Status" "$BASE/api/calls/twilio/status" POST
check "Recording" "$BASE/api/calls/twilio/recording" POST
check "SMS" "$BASE/api/calls/twilio/sms" POST
check "AMD" "$BASE/api/calls/twilio/amd" POST

echo ""
echo "3️⃣  Call Webhook (generic)"
check "Webhook" "$BASE/api/calls/webhook" POST

echo ""
echo "═══════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "⚠️  Some endpoints are unreachable. Check:"
  echo "    1. Is the dev server running? (pnpm run dev)"
  echo "    2. Is the cloudflare tunnel active?"
  echo "    3. Does WEBHOOK_BASE_URL in .env match the tunnel URL?"
  exit 1
fi

echo ""
echo "🎉 All webhook endpoints verified! Ready for Twilio calls."
