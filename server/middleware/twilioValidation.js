/**
 * Twilio Request Validation Middleware
 *
 * Validates X-Twilio-Signature to ensure webhooks are genuinely from Twilio.
 * Uses HMAC-SHA1 with Auth Token / API Key Secret.
 *
 * Enable in production by setting TWILIO_VALIDATE_REQUESTS=true in .env
 * Disabled by default in development for easier testing.
 */

import crypto from 'crypto'
import logger from '../config/logger.js'

/**
 * Create middleware that validates Twilio webhook signatures
 */
export function validateTwilioRequest(options = {}) {
    const authToken = options.authToken || process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_AUTH_TOKEN
    const shouldValidate = options.validate ?? (process.env.TWILIO_VALIDATE_REQUESTS === 'true')

    return (req, res, next) => {
        // Skip validation in development unless explicitly enabled
        if (!shouldValidate) {
            return next()
        }

        if (!authToken) {
            logger.warn('⚠️ Twilio validation enabled but no auth token configured')
            return next()
        }

        const signature = req.headers['x-twilio-signature']
        if (!signature) {
            logger.warn('⚠️ Missing X-Twilio-Signature header')
            return res.status(403).send('Forbidden: Missing signature')
        }

        // Build the full URL Twilio used (important: must match exactly)
        const protocol = req.headers['x-forwarded-proto'] || req.protocol
        const host = req.headers['x-forwarded-host'] || req.headers.host
        const url = `${protocol}://${host}${req.originalUrl}`

        // Get POST body parameters (Twilio sends form-encoded)
        const params = req.body || {}

        const isValid = validateSignature(authToken, signature, url, params)

        if (!isValid) {
            logger.warn(`⚠️ Invalid Twilio signature for ${req.originalUrl}`)
            return res.status(403).send('Forbidden: Invalid signature')
        }

        next()
    }
}

/**
 * Validate a Twilio request signature
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function validateSignature(authToken, signature, url, params) {
    // Sort POST params alphabetically and append to URL
    const sortedKeys = Object.keys(params).sort()
    let data = url
    for (const key of sortedKeys) {
        data += key + params[key]
    }

    // HMAC-SHA1
    const computed = crypto
        .createHmac('sha1', authToken)
        .update(data, 'utf-8')
        .digest('base64')

    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(computed)
        )
    } catch {
        return false
    }
}

export default validateTwilioRequest
