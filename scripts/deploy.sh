#!/usr/bin/env bash
# deploy.sh — Deploy Business Hub to VPS via SSH
# Usage: ./scripts/deploy.sh [branch]
set -euo pipefail

BRANCH="${1:-master}"
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

echo "=== Deploying Business Hub (branch: ${BRANCH}) ==="

# Step 1: Create backup
echo ""
echo "--- Creating backup ---"
eval ${SSH_CMD} << ENDSSH
set -e
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/\${TIMESTAMP}"
mkdir -p "\${BACKUP_PATH}"

cd "${APP_DIR}" 2>/dev/null || { echo "App directory not found, skipping backup"; exit 0; }
git rev-parse HEAD > "\${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "no-git" > "\${BACKUP_PATH}/commit.sha"
cp -f docker-compose.yml "\${BACKUP_PATH}/docker-compose.yml" 2>/dev/null || true
cp -f .env "\${BACKUP_PATH}/.env" 2>/dev/null || true
docker exec business-hub-db pg_dump -U postgres business_hub > "\${BACKUP_PATH}/db.sql" 2>/dev/null || echo "DB dump skipped"
echo "Backup: \${TIMESTAMP}"
ENDSSH

# Step 2: Pull latest code
echo ""
echo "--- Pulling latest code ---"
eval ${SSH_CMD} << ENDSSH
set -e
cd "${APP_DIR}"
git fetch origin
git checkout ${BRANCH}
git pull origin ${BRANCH}
echo "At commit: \$(git rev-parse --short HEAD)"
ENDSSH

# Step 3: Build and deploy
echo ""
echo "--- Building and deploying ---"
eval ${SSH_CMD} << ENDSSH
set -e
cd "${APP_DIR}"
docker compose build --no-cache
docker compose up -d
sleep 10
docker exec business-hub-backend npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss 2>/dev/null || echo "Prisma push skipped"
ENDSSH

# Step 4: Health check
echo ""
echo "--- Running health checks ---"
./scripts/health-check.sh

echo ""
echo "=== Deploy complete ==="
