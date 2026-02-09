/**
 * Simple rate limiter middleware for Express.
 * Limits requests per IP within a sliding window.
 * 
 * Usage:
 *   const { rateLimiter } = require('./middleware/rateLimiter')
 *   app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }))
 */

function rateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutes
    const max = options.max || 100 // max requests per window
    const message = options.message || 'Too many requests, please try again later.'

    const requests = new Map() // IP → { count, resetTime }

    // Clean up expired entries periodically
    setInterval(() => {
        const now = Date.now()
        for (const [ip, data] of requests) {
            if (now > data.resetTime) {
                requests.delete(ip)
            }
        }
    }, windowMs)

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress
        const now = Date.now()

        if (!requests.has(ip) || now > requests.get(ip).resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs })
            return next()
        }

        const data = requests.get(ip)
        data.count++

        // Set rate limit headers
        res.set('X-RateLimit-Limit', max)
        res.set('X-RateLimit-Remaining', Math.max(0, max - data.count))
        res.set('X-RateLimit-Reset', new Date(data.resetTime).toISOString())

        if (data.count > max) {
            return res.status(429).json({ error: message })
        }

        next()
    }
}

module.exports = { rateLimiter }
