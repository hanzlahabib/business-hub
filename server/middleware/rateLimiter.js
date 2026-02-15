/**
 * Rate Limiter Middleware
 *
 * Simple in-memory rate limiter for Express.
 * Limits requests per IP within a sliding window.
 *
 * Usage:
 *   import { rateLimiter, authLimiter } from './middleware/rateLimiter.js'
 *   app.use('/api', rateLimiter())
 *   app.use('/api/auth', authLimiter())
 */

/**
 * General API rate limiter (100 req / 15 min)
 */
export function rateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000  // 15 minutes
    const max = options.max || 500
    const message = options.message || 'Too many requests, please try again later.'

    const requests = new Map()  // IP → { count, resetTime }

    // Clean up expired entries every window
    setInterval(() => {
        const now = Date.now()
        for (const [ip, data] of requests) {
            if (now > data.resetTime) requests.delete(ip)
        }
    }, windowMs)

    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown'
        const now = Date.now()

        if (!requests.has(ip) || now > requests.get(ip).resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs })
            return next()
        }

        const data = requests.get(ip)
        data.count++

        // Set rate limit headers
        res.set('X-RateLimit-Limit', String(max))
        res.set('X-RateLimit-Remaining', String(Math.max(0, max - data.count)))
        res.set('X-RateLimit-Reset', new Date(data.resetTime).toISOString())

        if (data.count > max) {
            return res.status(429).json({ error: message })
        }

        next()
    }
}

/**
 * Strict rate limiter for auth routes (10 req / 5 min)
 * Prevents brute-force login/registration attacks.
 */
export function authLimiter() {
    return rateLimiter({
        windowMs: 5 * 60 * 1000,   // 5 minutes
        max: 10,                     // 10 attempts
        message: 'Too many authentication attempts. Please wait 5 minutes.'
    })
}

/**
 * Very strict limiter for sensitive operations (5 req / 15 min)
 * For password reset, API key generation, etc.
 */
export function strictLimiter() {
    return rateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Rate limit exceeded for sensitive operation. Please wait.'
    })
}
