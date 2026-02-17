#!/usr/bin/env bash
# rollback.sh — Rollback Business Hub to a previous backup
# Usage: ./scripts/rollback.sh [backup_timestamp]
#   If no timestamp provided, uses the latest backup.
set -euo pipefail

ROLLBACK_TAG="${1:-}"
APP_DIR="/opt/business-hub"
BACKUP_DIR="/opt/business-hub-backups"

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

echo "=== Rolling back Business Hub ==="

eval ${SSH_CMD} << ENDSSH
set -e
ROLLBACK_TAG="${ROLLBACK_TAG}"

# Use latest backup if none specified
if [ -z "\${ROLLBACK_TAG}" ]; then
    ROLLBACK_TAG=\$(ls -1t ${BACKUP_DIR}/ | head -1)
    echo "Using latest backup: \${ROLLBACK_TAG}"
fi

BACKUP_PATH="${BACKUP_DIR}/\${ROLLBACK_TAG}"

if [ ! -d "\${BACKUP_PATH}" ]; then
    echo "ERROR: Backup not found at \${BACKUP_PATH}"
    echo "Available backups:"
    ls -1t ${BACKUP_DIR}/
    exit 1
fi

echo "Rolling back to \${ROLLBACK_TAG}..."

cd "${APP_DIR}"

# Stop current containers
docker compose down

# Restore config files
cp -f "\${BACKUP_PATH}/docker-compose.yml" docker-compose.yml 2>/dev/null || true
cp -f "\${BACKUP_PATH}/.env" .env 2>/dev/null || true

# Checkout backed-up commit
COMMIT=\$(cat "\${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "")
if [ -n "\${COMMIT}" ] && [ "\${COMMIT}" != "no-git" ]; then
    git checkout "\${COMMIT}"
    echo "Checked out commit \${COMMIT}"
fi

# Rebuild and start
docker compose build --no-cache
docker compose up -d
sleep 10

# Restore database
if [ -f "\${BACKUP_PATH}/db.sql" ]; then
    echo "Restoring database..."
    docker exec -i business-hub-db psql -U postgres -d business_hub < "\${BACKUP_PATH}/db.sql"
    echo "Database restored"
fi

echo "Rollback to \${ROLLBACK_TAG} complete"
ENDSSH

# Health check
echo ""
echo "--- Running health checks ---"
./scripts/health-check.sh

echo ""
echo "=== Rollback complete ==="
