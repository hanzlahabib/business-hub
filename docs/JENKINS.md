# Jenkins CD Pipeline — Setup Guide

This guide covers setting up the Jenkins deployment pipeline for Business Hub. Useful for demoing Jenkins adoption to teams, showing how devs can independently deploy and rollback.

## Prerequisites

- Jenkins instance running (e.g., `jenkins.hanzla.com:8091`)
- Docker + Docker Compose on the VPS
- SSH access to the VPS from Jenkins

## 1. Add VPS SSH Credentials to Jenkins

1. Go to **Manage Jenkins** > **Credentials** > **System** > **Global credentials**
2. Click **Add Credentials**
3. Kind: **SSH Username with private key** (or **Username with password**)
4. ID: `vps-ssh-key`
5. Username: `root` (or your VPS user)
6. Enter the private key or password
7. Click **OK**

## 2. Create the Jenkins Pipeline Job

1. Click **New Item** on the Jenkins dashboard
2. Name: `business-hub-deploy`
3. Type: **Pipeline**
4. Click **OK**

### Configure the Pipeline:

**General tab:**
- Check **This project is parameterized** (parameters are defined in the Jenkinsfile)
- Check **GitHub project** and enter: `https://github.com/hanzlahabib/business-hub/`

**Build Triggers tab:**
- Check **GitHub hook trigger for GITScm polling**

**Pipeline tab:**
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/hanzlahabib/business-hub.git`
- Branch Specifier: `*/master`
- Script Path: `Jenkinsfile`

Click **Save**.

## 3. Configure GitHub Webhook

1. Go to your GitHub repo > **Settings** > **Webhooks** > **Add webhook**
2. Payload URL: `https://jenkins.hanzla.com/github-webhook/`
3. Content type: `application/json`
4. Secret: (set a secret and add it to Jenkins credentials as `github-webhook-secret`)
5. Events: Select **Just the push event**
6. Click **Add webhook**

## 4. VPS Setup (One-time)

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Clone the repo
mkdir -p /opt
cd /opt
git clone https://github.com/hanzlahabib/business-hub.git
cd business-hub

# Copy .env file (set your production values)
cp .env.example .env
nano .env

# Create backup directory
mkdir -p /opt/business-hub-backups

# Initial deploy
docker compose up --build -d
```

## 5. How to Deploy

### Automatic (on push to master):
Push/merge to `master` > GitHub Actions CI passes > webhook triggers Jenkins > deploy runs automatically.

### Manual:
1. Go to Jenkins > `business-hub-deploy`
2. Click **Build with Parameters**
3. Set `DEPLOY_ACTION` = `deploy`
4. Set `BRANCH` = `master` (or any branch for dev environments)
5. Click **Build**

## 6. How to Rollback

1. Go to Jenkins > `business-hub-deploy`
2. Click **Build with Parameters**
3. Set `DEPLOY_ACTION` = `rollback`
4. Optionally set `ROLLBACK_TAG` to a specific backup timestamp (e.g., `20260217_143000`)
   - Leave empty to use the latest backup
5. Click **Build**

### What rollback does:
- Stops current containers
- Restores `docker-compose.yml` and `.env` from backup
- Checks out the git commit from backup time
- Rebuilds and restarts containers
- Restores the database from the SQL dump
- Runs health checks

## 7. Deploying a Different Branch (Dev Environments)

Devs can deploy their own feature branch:

1. Go to Jenkins > `business-hub-deploy` > **Build with Parameters**
2. Set `BRANCH` = `feature/my-branch`
3. Set `DEPLOY_ACTION` = `deploy`
4. Click **Build**

This pulls and deploys the specified branch on the VPS.

## 8. Pipeline Stages

| Stage | Description |
|-------|-------------|
| **Checkout** | Checks out code from Git |
| **Pre-deploy Backup** | Saves current state (git commit, DB dump, config files) |
| **Pull Latest Code** | `git pull` on VPS |
| **Build & Deploy** | `docker compose build && up -d` + Prisma migrations |
| **Health Check** | Verifies backend `/api/health` and frontend return 200 |
| **Cleanup Old Backups** | Keeps only the 5 most recent backups |

## 9. Local Deploy/Rollback Commands

From your local machine (requires `.env` with VPS credentials):

```bash
# Deploy latest master to VPS
make deploy-prod

# Rollback to latest backup
make rollback

# Check deploy status
make deploy-status
```

## 10. Troubleshooting

**Jenkins can't SSH to VPS:**
- Verify the `vps-ssh-key` credential is correct
- Check VPS firewall allows SSH from Jenkins IP

**Health check fails after deploy:**
- Check container logs: `docker compose logs --tail=50`
- Verify ports 3003 and 5175 are not in use by other services
- Check if the database migration succeeded

**Webhook not triggering:**
- Check GitHub webhook delivery logs (Settings > Webhooks > Recent Deliveries)
- Verify Jenkins URL is reachable from the internet
- Check Jenkins system log for webhook events
