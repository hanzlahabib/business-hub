import { AppError } from '../errors/index.js'

/**
 * Global error handler middleware for Express.
 * Catches all errors thrown via next(err) and returns consistent JSON responses.
 *
 * - AppError subclasses → uses their statusCode + message
 * - Prisma P2025 (record not found) → 404
 * - Prisma P2002 (unique constraint) → 409
 * - Everything else → 500 with generic message (no leak)
 */
export function globalErrorHandler(err, req, res, _next) {
    // Already an application error — use its status
    if (err instanceof AppError) {
        const response = { error: err.message }
        if (err.fields && Object.keys(err.fields).length > 0) {
            response.fields = err.fields
        }
        return res.status(err.statusCode).json(response)
    }

    // Prisma "record not found" errors
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Resource not found' })
    }

    // Prisma "unique constraint violation"
    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'field'
        return res.status(409).json({ error: `A record with this ${field} already exists` })
    }

    // Unknown errors — log but don't leak internals
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal server error' })
}
