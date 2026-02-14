/**
 * Input Sanitization Middleware
 *
 * Strips dangerous HTML/script content from request body, query, and params.
 * Prevents XSS attacks via stored or reflected payloads.
 *
 * Usage:
 *   import { sanitizeInput } from './middleware/sanitize.js'
 *   app.use(sanitizeInput())
 */

/**
 * Recursively sanitize a value:
 *   - Strings: strip <script> tags, event handlers, javascript: URIs
 *   - Objects/Arrays: recurse
 *   - Other types: pass through
 */
function sanitize(value) {
    if (typeof value === 'string') {
        return value
            // Remove <script>...</script> blocks
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            // Remove event handlers (onclick, onerror, etc.)
            .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
            // Remove javascript: URIs
            .replace(/javascript\s*:/gi, '')
            // Remove data: URIs with script content
            .replace(/data\s*:\s*text\/html/gi, '')
            // Trim
            .trim()
    }

    if (Array.isArray(value)) {
        return value.map(sanitize)
    }

    if (value && typeof value === 'object') {
        const sanitized = {}
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitize(val)
        }
        return sanitized
    }

    return value
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 */
export function sanitizeInput() {
    return (req, _res, next) => {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitize(req.body)
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitize(req.query)
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitize(req.params)
        }
        next()
    }
}

export default sanitizeInput
