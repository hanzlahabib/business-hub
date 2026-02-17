#!/usr/bin/env bash
# health-check.sh — Verify Business Hub services are healthy on VPS
# Usage: ./scripts/health-check.sh
# Exit 0 on success, 1 on failure
set -euo pipefail

RETRIES=5
DELAY=5

# Load env vars
if [ -f .env ]; then
    export $(grep -E '^(VPS_HOST|VPS_PORT|VPS_USER|VPS_PASSWORD)=' .env | xargs)
fi

if [ -z "${VPS_HOST:-}" ] || [ -z "${VPS_PASSWORD:-}" ]; then
    echo "ERROR: VPS_HOST and VPS_PASSWORD must be set in .env"
    exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o PubkeyAuthentication=no -p ${VPS_PORT:-22}"
SSH_CMD="sshpass -p '${VPS_PASSWORD}' ssh ${SSH_OPTS} ${VPS_USER:-root}@${VPS_HOST}"

echo "Checking backend health (http://localhost:3003/api/health)..."
BACKEND_OK=false
for i in $(seq 1 $RETRIES); do
    HTTP_CODE=$(eval ${SSH_CMD} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/api/health 2>/dev/null" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "Backend OK (attempt $i)"
        BACKEND_OK=true
        break
    fi
    echo "Backend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... ($i/$RETRIES)"
    sleep $DELAY
done

if [ "$BACKEND_OK" != "true" ]; then
    echo "FAIL: Backend health check failed after $RETRIES attempts"
    exit 1
fi

echo "Checking frontend (http://localhost:5175/)..."
FRONTEND_OK=false
for i in $(seq 1 $RETRIES); do
    HTTP_CODE=$(eval ${SSH_CMD} "curl -s -o /dev/null -w '%{http_code}' http://localhost:5175/ 2>/dev/null" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "Frontend OK (attempt $i)"
        FRONTEND_OK=true
        break
    fi
    echo "Frontend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... ($i/$RETRIES)"
    sleep $DELAY
done

if [ "$FRONTEND_OK" != "true" ]; then
    echo "FAIL: Frontend health check failed after $RETRIES attempts"
    exit 1
fi

echo "All health checks passed"
exit 0
