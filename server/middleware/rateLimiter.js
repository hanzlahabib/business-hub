/**
 * Rate Limiter Middleware
 *
 * Redis-backed rate limiter with in-memory fallback.
 * Uses INCR + EXPIRE for distributed, persistent rate limiting.
 *
 * Usage:
 *   import { rateLimiter, authLimiter } from './middleware/rateLimiter.js'
 *   app.use('/api', rateLimiter())
 *   app.use('/api/auth', authLimiter())
 */

import { rateLimitIncr, rateLimitTTL, isRedisConnected } from '../config/redisClient.js'

/**
 * General API rate limiter (500 req / 15 min)
 * Redis-backed with in-memory fallback
 */
export function rateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000  // 15 minutes
    const windowSec = Math.ceil(windowMs / 1000)
    const max = options.max || 500
    const message = options.message || 'Too many requests, please try again later.'
    const prefix = options.prefix || 'rl'

    // In-memory fallback if Redis is down
    const fallbackMap = new Map()
    setInterval(() => {
        const now = Date.now()
        for (const [ip, data] of fallbackMap) {
            if (now > data.resetTime) fallbackMap.delete(ip)
        }
    }, windowMs)

    return async (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip || req.connection?.remoteAddress || 'unknown'

        const key = `${prefix}:${ip}`

        // Try Redis first
        if (isRedisConnected()) {
            const count = await rateLimitIncr(key, windowSec)
            if (count !== null) {
                const ttl = await rateLimitTTL(key)
                const resetTime = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowMs))

                res.set('X-RateLimit-Limit', String(max))
                res.set('X-RateLimit-Remaining', String(Math.max(0, max - count)))
                res.set('X-RateLimit-Reset', resetTime.toISOString())

                if (count > max) {
                    return res.status(429).json({ error: message })
                }
                return next()
            }
        }

        // Fallback: in-memory
        const now = Date.now()
        if (!fallbackMap.has(key) || now > fallbackMap.get(key).resetTime) {
            fallbackMap.set(key, { count: 1, resetTime: now + windowMs })
            return next()
        }

        const data = fallbackMap.get(key)
        data.count++

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
        windowMs: 5 * 60 * 1000,
        max: 10,
        prefix: 'rl:auth',
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
        prefix: 'rl:strict',
        message: 'Rate limit exceeded for sensitive operation. Please wait.'
    })
}
