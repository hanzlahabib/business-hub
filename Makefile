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
# Local Dev — Full Workflow
# ============================================

.PHONY: dev start stop install db-start db-stop db-push db-studio prisma clean reset help-dev docker-up docker-down test test-all test-leads test-boards test-api test-ui

help-dev: ## Show dev commands
	@echo ""
	@echo "\033[1m📋 Dev Commands:\033[0m"
	@echo "  \033[36mmake dev\033[0m         — Full start (db + deps + prisma + server)"
	@echo "  \033[36mmake start\033[0m       — Quick start (assumes deps installed)"
	@echo "  \033[36mmake stop\033[0m        — Stop all local services"
	@echo "  \033[36mmake install\033[0m     — Install pnpm dependencies"
	@echo "  \033[36mmake db-start\033[0m    — Start PostgreSQL container"
	@echo "  \033[36mmake db-stop\033[0m     — Stop PostgreSQL container"
	@echo "  \033[36mmake db-push\033[0m     — Push Prisma schema to database"
	@echo "  \033[36mmake db-studio\033[0m   — Open Prisma Studio"
	@echo "  \033[36mmake prisma\033[0m      — Generate Prisma client"
	@echo "  \033[36mmake clean\033[0m       — Stop services + remove node_modules"
	@echo "  \033[36mmake reset\033[0m       — Full reset (clean + install + prisma)"
	@echo "  \033[36mmake docker-up\033[0m   — Start via Docker Compose"
	@echo ""
	@echo "\033[1m🧪 E2E Testing:\033[0m"
	@echo "  \033[36mmake test\033[0m        — Run all API E2E tests"
	@echo "  \033[36mmake test-all\033[0m    — Run all tests (API + UI)"
	@echo "  \033[36mmake test-leads\033[0m  — Run Leads CRM deep tests"
	@echo "  \033[36mmake test-boards\033[0m — Run Task Boards deep tests"
	@echo "  \033[36mmake test-auth\033[0m   — Run Auth + Health tests"
	@echo "  \033[36mmake test-ui\033[0m     — Run UI browser tests"
	@echo "  \033[36mmake test-report\033[0m — Open Playwright HTML report"
	@echo ""

dev: db-start install prisma ## Full dev setup + start
	@echo "🚀 Starting dev server..."
	pnpm run dev

start: db-start ## Quick start (db + dev server)
	pnpm run dev

stop: ## Stop all local services
	@echo "🛑 Stopping services..."
	-lsof -ti :5175,:3002,:3005 2>/dev/null | xargs -r kill -9 2>/dev/null
	@echo "✅ Services stopped"

install: ## Install dependencies with pnpm
	@if [ ! -d "node_modules/.pnpm" ]; then \
		echo "📦 Installing dependencies..."; \
		pnpm install --ignore-workspace; \
		pnpm approve-builds 2>/dev/null || true; \
	else \
		echo "✅ Dependencies already installed"; \
	fi

db-start: ## Start PostgreSQL container
	@if ! docker ps --format '{{.Names}}' | grep -q business-hub-db; then \
		if docker ps -a --format '{{.Names}}' | grep -q business-hub-db; then \
			echo "🐘 Starting existing PostgreSQL container..."; \
			docker start business-hub-db; \
		else \
			echo "🐘 Creating PostgreSQL container..."; \
			docker run -d --name business-hub-db \
				-e POSTGRES_USER=postgres \
				-e POSTGRES_PASSWORD=postgres_password \
				-e POSTGRES_DB=business_hub \
				-p 5433:5432 \
				--restart always \
				postgres:15-alpine; \
		fi; \
		echo "⏳ Waiting for PostgreSQL..."; \
		for i in $$(seq 1 15); do \
			if docker exec business-hub-db pg_isready -U postgres >/dev/null 2>&1; then \
				echo "✅ PostgreSQL ready on port 5433"; \
				break; \
			fi; \
			sleep 1; \
		done; \
	else \
		echo "✅ PostgreSQL already running on port 5433"; \
	fi

db-stop: ## Stop PostgreSQL container
	@docker stop business-hub-db 2>/dev/null && echo "🐘 PostgreSQL stopped" || echo "⚠️  Not running"

db-push: db-start ## Push Prisma schema to database
	npx prisma db push --schema=server/prisma/schema.prisma

db-studio: db-start ## Open Prisma Studio
	npx prisma studio --schema=server/prisma/schema.prisma

prisma: ## Generate Prisma client
	@echo "🔧 Generating Prisma client..."
	@npx prisma generate --schema=server/prisma/schema.prisma

docker-up: ## Start via Docker Compose
	docker compose up --build -d

docker-down: ## Stop Docker Compose
	docker compose down

# ============================================
# E2E Testing (Playwright)
# ============================================

test: test-api ## Run all API E2E tests

test-all: ## Run all E2E tests (API + UI)
	npx playwright test

test-api: ## Run all API E2E test suites
	npx playwright test --project=api

test-leads: ## Run Leads CRM deep E2E tests
	npx playwright test --project=api tests/e2e/api/suite-11-leads-deep.spec.js

test-boards: ## Run Task Boards deep E2E tests
	npx playwright test --project=api tests/e2e/api/suite-12-boards-deep.spec.js

test-auth: ## Run Auth + Health tests (suites 1-2)
	npx playwright test --project=api tests/e2e/api/suites-1-6.spec.js

test-ui: ## Run UI browser tests
	npx playwright test --project=ui

test-report: ## Open last Playwright HTML report
	npx playwright show-report

# ============================================
# Cleanup
# ============================================

clean: stop ## Stop + remove node_modules/dist
	rm -rf node_modules dist
	@echo "🧹 Cleaned"

reset: clean install prisma ## Full reset
	@echo "✅ Reset done. Run 'make dev' to start."
