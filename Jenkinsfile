pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_ACTION',
            choices: ['deploy', 'rollback'],
            description: 'Deploy latest code or rollback to a previous backup'
        )
        string(
            name: 'ROLLBACK_TAG',
            defaultValue: '',
            description: 'Backup timestamp to rollback to (e.g. 20260217_143000). Leave empty for latest backup.'
        )
        string(
            name: 'BRANCH',
            defaultValue: 'master',
            description: 'Branch to deploy (useful for dev environments)'
        )
    }

    environment {
        APP_DIR       = '/opt/business-hub'
        BACKUP_DIR    = '/opt/business-hub-backups'
        COMPOSE_FILE  = "${APP_DIR}/docker-compose.yml"
        MAX_BACKUPS   = '5'
    }

    stages {
        stage('Checkout') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                checkout scm
            }
        }

        stage('Pre-deploy Backup') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@$VPS_HOST << 'ENDSSH'
                        set -e
                        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                        BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
                        mkdir -p "${BACKUP_PATH}"

                        # Save current git commit hash
                        cd "${APP_DIR}"
                        git rev-parse HEAD > "${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "no-git" > "${BACKUP_PATH}/commit.sha"

                        # Backup docker-compose.yml and .env
                        cp -f "${COMPOSE_FILE}" "${BACKUP_PATH}/docker-compose.yml" 2>/dev/null || true
                        cp -f "${APP_DIR}/.env" "${BACKUP_PATH}/.env" 2>/dev/null || true

                        # Database dump
                        docker exec business-hub-db pg_dump -U postgres business_hub > "${BACKUP_PATH}/db.sql" 2>/dev/null || echo "DB dump skipped (container not running)"

                        echo "Backup created at ${BACKUP_PATH}"
                        ls -lh "${BACKUP_PATH}/"
ENDSSH
                    '''
                }
            }
        }

        stage('Pull Latest Code') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@\$VPS_HOST << ENDSSH
                        set -e
                        cd ${APP_DIR}
                        git fetch origin
                        git checkout ${params.BRANCH}
                        git pull origin ${params.BRANCH}
                        echo "Checked out ${params.BRANCH} at \$(git rev-parse --short HEAD)"
ENDSSH
                    """
                }
            }
        }

        stage('Build & Deploy') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@$VPS_HOST << 'ENDSSH'
                        set -e
                        cd "${APP_DIR}"

                        # Build and deploy with Docker Compose
                        docker compose build --no-cache
                        docker compose up -d

                        # Wait for backend container to be ready
                        echo "Waiting for backend container..."
                        sleep 10

                        # Run Prisma schema push inside backend container
                        docker exec business-hub-backend npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss 2>/dev/null || echo "Prisma push skipped"

                        echo "Deploy complete"
ENDSSH
                    '''
                }
            }
        }

        stage('Rollback') {
            when {
                expression { params.DEPLOY_ACTION == 'rollback' }
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@\$VPS_HOST << ENDSSH
                        set -e
                        ROLLBACK_TAG="${params.ROLLBACK_TAG}"

                        # If no tag specified, use the latest backup
                        if [ -z "\\\${ROLLBACK_TAG}" ]; then
                            ROLLBACK_TAG=\\\$(ls -1t ${BACKUP_DIR}/ | head -1)
                            echo "No tag specified, using latest backup: \\\${ROLLBACK_TAG}"
                        fi

                        BACKUP_PATH="${BACKUP_DIR}/\\\${ROLLBACK_TAG}"

                        if [ ! -d "\\\${BACKUP_PATH}" ]; then
                            echo "ERROR: Backup not found at \\\${BACKUP_PATH}"
                            echo "Available backups:"
                            ls -1t ${BACKUP_DIR}/
                            exit 1
                        fi

                        echo "Rolling back to \\\${ROLLBACK_TAG}..."

                        cd ${APP_DIR}

                        # Stop current containers
                        docker compose down

                        # Restore docker-compose.yml and .env if backed up
                        cp -f "\\\${BACKUP_PATH}/docker-compose.yml" "${COMPOSE_FILE}" 2>/dev/null || true
                        cp -f "\\\${BACKUP_PATH}/.env" "${APP_DIR}/.env" 2>/dev/null || true

                        # Checkout the backed-up commit
                        COMMIT=\\\$(cat "\\\${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "")
                        if [ -n "\\\${COMMIT}" ] && [ "\\\${COMMIT}" != "no-git" ]; then
                            git checkout "\\\${COMMIT}"
                            echo "Checked out commit \\\${COMMIT}"
                        fi

                        # Rebuild and start containers
                        docker compose build --no-cache
                        docker compose up -d

                        # Wait for DB container
                        sleep 10

                        # Restore database
                        if [ -f "\\\${BACKUP_PATH}/db.sql" ]; then
                            echo "Restoring database..."
                            docker exec -i business-hub-db psql -U postgres -d business_hub < "\\\${BACKUP_PATH}/db.sql"
                            echo "Database restored"
                        fi

                        echo "Rollback to \\\${ROLLBACK_TAG} complete"
ENDSSH
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@$VPS_HOST << 'ENDSSH'
                        set -e

                        echo "Running health checks..."
                        RETRIES=5
                        DELAY=5

                        # Check backend health
                        for i in $(seq 1 $RETRIES); do
                            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/health 2>/dev/null || echo "000")
                            if [ "$HTTP_CODE" = "200" ]; then
                                echo "Backend health check passed (attempt $i)"
                                break
                            fi
                            if [ "$i" = "$RETRIES" ]; then
                                echo "ERROR: Backend health check failed after $RETRIES attempts"
                                exit 1
                            fi
                            echo "Backend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... (attempt $i/$RETRIES)"
                            sleep $DELAY
                        done

                        # Check frontend
                        for i in $(seq 1 $RETRIES); do
                            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")
                            if [ "$HTTP_CODE" = "200" ]; then
                                echo "Frontend health check passed (attempt $i)"
                                break
                            fi
                            if [ "$i" = "$RETRIES" ]; then
                                echo "ERROR: Frontend health check failed after $RETRIES attempts"
                                exit 1
                            fi
                            echo "Frontend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... (attempt $i/$RETRIES)"
                            sleep $DELAY
                        done

                        echo "All health checks passed"
ENDSSH
                    '''
                }
            }
        }

        stage('Cleanup Old Backups') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@$VPS_HOST << 'ENDSSH'
                        BACKUP_COUNT=$(ls -1d /opt/business-hub-backups/*/ 2>/dev/null | wc -l)
                        if [ "$BACKUP_COUNT" -gt 5 ]; then
                            REMOVE_COUNT=$((BACKUP_COUNT - 5))
                            echo "Removing $REMOVE_COUNT old backup(s)..."
                            ls -1dt /opt/business-hub-backups/*/ | tail -n $REMOVE_COUNT | xargs rm -rf
                        fi
                        echo "Current backups:"
                        ls -1t /opt/business-hub-backups/ 2>/dev/null || echo "No backups"
ENDSSH
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo 'Deploy failed! Check logs above for details.'
            echo 'To rollback, run this pipeline with DEPLOY_ACTION=rollback'
        }
        success {
            echo "Deploy/Rollback completed successfully at ${new Date()}"
        }
    }
}
