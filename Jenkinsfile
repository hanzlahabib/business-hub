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
        APP_DIR    = '/opt/business-hub'
        BACKUP_DIR = '/opt/business-hub-backups'
    }

    stages {
        stage('Pre-deploy Backup') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sh '''#!/bin/bash
                    set -e
                    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                    BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
                    mkdir -p "${BACKUP_PATH}"

                    cd "${APP_DIR}"
                    git rev-parse HEAD > "${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "no-git" > "${BACKUP_PATH}/commit.sha"
                    cp -f docker-compose.yml "${BACKUP_PATH}/docker-compose.yml" 2>/dev/null || true
                    cp -f .env "${BACKUP_PATH}/.env" 2>/dev/null || true

                    docker exec business-hub-db pg_dump -U postgres business_hub > "${BACKUP_PATH}/db.sql" 2>/dev/null || echo "DB dump skipped"

                    echo "Backup created: ${TIMESTAMP}"
                    ls -lh "${BACKUP_PATH}/"
                '''
            }
        }

        stage('Pull Latest Code') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sh """#!/bin/bash
                    set -e
                    cd ${APP_DIR}
                    git fetch origin
                    git checkout ${params.BRANCH}
                    git pull origin ${params.BRANCH}
                    echo "At commit: \$(git rev-parse --short HEAD)"
                """
            }
        }

        stage('Build & Deploy') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sh '''#!/bin/bash
                    set -e
                    cd "${APP_DIR}"
                    pnpm install --ignore-workspace 2>/dev/null || npm install 2>/dev/null || echo "Deps install skipped"
                    docker compose build --no-cache
                    docker compose up -d
                    echo "Waiting for containers to start..."
                    sleep 10
                    docker exec business-hub-backend npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss 2>/dev/null || echo "Prisma push skipped"
                    echo "Deploy complete"
                '''
            }
        }

        stage('Rollback') {
            when {
                expression { params.DEPLOY_ACTION == 'rollback' }
            }
            steps {
                sh """#!/bin/bash
                    set -e
                    ROLLBACK_TAG="${params.ROLLBACK_TAG}"

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
                    cd ${APP_DIR}

                    docker compose down

                    cp -f "\${BACKUP_PATH}/docker-compose.yml" docker-compose.yml 2>/dev/null || true
                    cp -f "\${BACKUP_PATH}/.env" .env 2>/dev/null || true

                    COMMIT=\$(cat "\${BACKUP_PATH}/commit.sha" 2>/dev/null || echo "")
                    if [ -n "\${COMMIT}" ] && [ "\${COMMIT}" != "no-git" ]; then
                        git checkout "\${COMMIT}"
                        echo "Checked out commit \${COMMIT}"
                    fi

                    docker compose build --no-cache
                    docker compose up -d
                    sleep 10

                    if [ -f "\${BACKUP_PATH}/db.sql" ]; then
                        echo "Restoring database..."
                        docker exec -i business-hub-db psql -U postgres -d business_hub < "\${BACKUP_PATH}/db.sql"
                        echo "Database restored"
                    fi

                    echo "Rollback to \${ROLLBACK_TAG} complete"
                """
            }
        }

        stage('Health Check') {
            steps {
                sh '''#!/bin/bash
                    set -e
                    RETRIES=5
                    DELAY=5

                    echo "Checking backend health..."
                    for i in $(seq 1 $RETRIES); do
                        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://business-hub-backend:3002/api/health 2>/dev/null || \
                                    curl -s -o /dev/null -w "%{http_code}" http://172.17.0.1:3003/api/health 2>/dev/null || echo "000")
                        if [ "$HTTP_CODE" = "200" ]; then
                            echo "Backend OK (attempt $i)"
                            break
                        fi
                        if [ "$i" = "$RETRIES" ]; then
                            echo "ERROR: Backend health check failed after $RETRIES attempts"
                            exit 1
                        fi
                        echo "Backend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... ($i/$RETRIES)"
                        sleep $DELAY
                    done

                    echo "Checking frontend..."
                    for i in $(seq 1 $RETRIES); do
                        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://business-hub-frontend:80/ 2>/dev/null || \
                                    curl -s -o /dev/null -w "%{http_code}" http://172.17.0.1:5175/ 2>/dev/null || echo "000")
                        if [ "$HTTP_CODE" = "200" ]; then
                            echo "Frontend OK (attempt $i)"
                            break
                        fi
                        if [ "$i" = "$RETRIES" ]; then
                            echo "ERROR: Frontend health check failed after $RETRIES attempts"
                            exit 1
                        fi
                        echo "Frontend not ready (HTTP $HTTP_CODE), retrying in ${DELAY}s... ($i/$RETRIES)"
                        sleep $DELAY
                    done

                    echo "All health checks passed"
                '''
            }
        }

        stage('Cleanup Old Backups') {
            when {
                expression { params.DEPLOY_ACTION == 'deploy' }
            }
            steps {
                sh '''#!/bin/bash
                    BACKUP_COUNT=$(ls -1d /opt/business-hub-backups/*/ 2>/dev/null | wc -l)
                    if [ "$BACKUP_COUNT" -gt 5 ]; then
                        REMOVE_COUNT=$((BACKUP_COUNT - 5))
                        echo "Removing $REMOVE_COUNT old backup(s)..."
                        ls -1dt /opt/business-hub-backups/*/ | tail -n $REMOVE_COUNT | xargs rm -rf
                    fi
                    echo "Current backups:"
                    ls -1t /opt/business-hub-backups/ 2>/dev/null || echo "No backups"
                '''
            }
        }
    }

    post {
        failure {
            echo 'Deploy failed! Check logs above for details.'
            echo 'To rollback, run this pipeline with DEPLOY_ACTION=rollback'
        }
        success {
            echo "Deploy/Rollback completed successfully"
        }
    }
}
