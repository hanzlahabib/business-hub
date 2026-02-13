# Schedule Manager — Make Commands
# Loads VPS credentials from .env automatically

include .env
export

# Paths
RANKRENT_DIR := /home/hanzla/development/vibe-coding/rank-and-rent

# SSH/Rsync base commands (use env vars, never hardcode creds)
SSH_OPTS := -o StrictHostKeyChecking=no -o PubkeyAuthentication=no -p $(VPS_PORT)
SSH_CMD := sshpass -p '$(VPS_PASSWORD)' ssh $(SSH_OPTS) $(VPS_USER)@$(VPS_HOST)
RSYNC_CMD := sshpass -p '$(VPS_PASSWORD)' rsync -avz -e "ssh $(SSH_OPTS)"

.PHONY: backup backup-binary ssh server client deploy deploy-restart vps-status vps-logs

# ============================================
# Database Backup (Docker PostgreSQL)
# ============================================

backup:
	@mkdir -p backups
	@echo "Backing up business_hub database..."
	@docker exec business-hub-db pg_dump -U postgres business_hub > backups/business_hub_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved:"
	@ls -lh backups/ | tail -1

backup-binary:
	@mkdir -p backups
	@echo "Creating binary backup..."
	@docker exec business-hub-db pg_dump -U postgres -Fc business_hub > backups/business_hub_$$(date +%Y%m%d_%H%M%S).dump
	@echo "Binary backup saved:"
	@ls -lh backups/ | tail -1

# ============================================
# VPS Access
# ============================================

ssh:
	$(SSH_CMD)

vps-status:
	@$(SSH_CMD) "pm2 status"

vps-logs:
	@$(SSH_CMD) "pm2 logs rank-and-rent --lines 50 --nostream"

# ============================================
# Rank & Rent — VPS Deployment
# (Local build + rsync — VPS OOMs on next build)
# ============================================

deploy:
	@echo "=== Building rank-and-rent locally ==="
	cd $(RANKRENT_DIR) && pnpm build
	@echo ""
	@echo "=== Syncing .next directory ==="
	$(RSYNC_CMD) --delete $(RANKRENT_DIR)/.next $(VPS_USER)@$(VPS_HOST):$(VPS_PROJECT_PATH)/
	@echo ""
	@echo "=== Syncing config files ==="
	$(RSYNC_CMD) $(RANKRENT_DIR)/package.json $(RANKRENT_DIR)/pnpm-lock.yaml $(RANKRENT_DIR)/next.config.ts $(VPS_USER)@$(VPS_HOST):$(VPS_PROJECT_PATH)/
	@echo ""
	@echo "=== Syncing src/ ==="
	$(RSYNC_CMD) --delete $(RANKRENT_DIR)/src/ $(VPS_USER)@$(VPS_HOST):$(VPS_PROJECT_PATH)/src/
	@echo ""
	@echo "=== Syncing public/ ==="
	$(RSYNC_CMD) --delete $(RANKRENT_DIR)/public/ $(VPS_USER)@$(VPS_HOST):$(VPS_PROJECT_PATH)/public/
	@echo ""
	@echo "=== Restarting PM2 ==="
	@$(SSH_CMD) "cd $(VPS_PROJECT_PATH) && pm2 restart rank-and-rent || (PORT=3002 pm2 start pnpm --name rank-and-rent -- start)"
	@echo ""
	@echo "Deploy complete!"

deploy-restart:
	@echo "Restarting rank-and-rent on VPS..."
	@$(SSH_CMD) "pm2 restart rank-and-rent"
	@echo "Done!"

deploy-deps:
	@echo "Installing production deps on VPS..."
	@$(SSH_CMD) "cd $(VPS_PROJECT_PATH) && CI=true pnpm install --prod"
	@echo "Done!"

# ============================================
# Local Dev
# ============================================

server:
	pnpm server

client:
	pnpm client
