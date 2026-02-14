/**
 * Request Logger Middleware
 *
 * Logs every HTTP request with method, URL, status, response time.
 * Uses the structured Winston logger.
 *
 * Usage:
 *   import { requestLogger } from './middleware/requestLogger.js'
 *   app.use(requestLogger())
 */

import logger from '../config/logger.js'

export function requestLogger() {
    return (req, res, next) => {
        const start = Date.now()

        // Capture response finish
        res.on('finish', () => {
            const duration = Date.now() - start
            const logData = {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip || req.connection?.remoteAddress,
            }

            // Log based on status code
            if (res.statusCode >= 500) {
                logger.error('Request failed', logData)
            } else if (res.statusCode >= 400) {
                logger.warn('Client error', logData)
            } else if (duration > 1000) {
                logger.warn('Slow request', logData)
            } else {
                logger.info('Request', logData)
            }
        })

        next()
    }
}

export default requestLogger
