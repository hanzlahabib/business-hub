/**
 * Environment Validation
 *
 * Validates required and optional environment variables on server startup.
 * Fails fast on missing required vars, warns on missing optional vars.
 *
 * Usage:
 *   import { validateEnv } from './config/validateEnv.js'
 *   validateEnv()  // Call before server start
 */

import logger from './logger.js'

const REQUIRED = [
    'DATABASE_URL',
]

const OPTIONAL = [
    { key: 'PORT', default: '3002', desc: 'Server port' },
    { key: 'JWT_SECRET', desc: 'Secret key for signing JWT tokens (REQUIRED in production)' },
    { key: 'JWT_EXPIRES_IN', default: '7d', desc: 'JWT token expiry duration' },
    { key: 'CORS_ORIGINS', desc: 'Comma-separated allowed origins (e.g. https://brain.hanzla.com)' },
    { key: 'TWILIO_ACCOUNT_SID', desc: 'Twilio account SID for calling' },
    { key: 'TWILIO_AUTH_TOKEN', desc: 'Twilio auth token' },
    { key: 'TWILIO_PHONE_NUMBER', desc: 'Twilio phone number' },
    { key: 'OPENAI_API_KEY', desc: 'OpenAI API key for AI features' },
    { key: 'VAPI_API_KEY', desc: 'Vapi API key for voice agents' },
    { key: 'DEEPGRAM_API_KEY', desc: 'Deepgram API key for STT' },
    { key: 'WEBHOOK_BASE_URL', desc: 'Public URL for webhooks' },
    { key: 'SMTP_HOST', desc: 'SMTP host for email' },
    { key: 'SMTP_PORT', desc: 'SMTP port for email' },
    { key: 'SMTP_USER', desc: 'SMTP username' },
    { key: 'SMTP_PASS', desc: 'SMTP password' },
    { key: 'LOG_LEVEL', default: 'info', desc: 'Winston log level' },
]

export function validateEnv() {
    const errors = []
    const warnings = []

    // Check required vars
    for (const key of REQUIRED) {
        if (!process.env[key]) {
            errors.push(`Missing required env var: ${key}`)
        }
    }

    // Check optional vars
    for (const { key, default: defaultVal, desc } of OPTIONAL) {
        if (!process.env[key]) {
            if (defaultVal) {
                process.env[key] = defaultVal
                warnings.push(`${key} not set, using default: ${defaultVal} (${desc})`)
            } else {
                warnings.push(`${key} not set — ${desc} will be unavailable`)
            }
        }
    }

    // Fail fast on missing required vars
    if (errors.length > 0) {
        for (const err of errors) {
            logger.error(err)
        }
        logger.error('Server cannot start due to missing required environment variables')
        process.exit(1)
    }

    // Log warnings for missing optional vars
    if (warnings.length > 0) {
        logger.warn(`${warnings.length} optional env vars not configured:`)
        for (const warn of warnings) {
            logger.warn(`  → ${warn}`)
        }
    }

    logger.info('Environment validation passed')
}

export default validateEnv
