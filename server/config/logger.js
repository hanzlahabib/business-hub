/**
 * Structured Logger — Winston
 *
 * Centralized logging with JSON format, timestamps, and log levels.
 * Replaces all console.log/error usage across the server.
 *
 * Usage:
 *   import logger from './config/logger.js'
 *   logger.info('Server started', { port: 3002 })
 *   logger.error('DB connection failed', { error: err.message })
 */

import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = winston.format

// Custom dev-friendly format
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level}] ${message}${metaStr}`
})

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    defaultMeta: { service: 'business-hub' },
    transports: [
        // Console — colorized for dev
        new winston.transports.Console({
            format: combine(colorize(), devFormat)
        }),
    ],
})

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880,  // 5MB
        maxFiles: 5,
        format: combine(timestamp(), winston.format.json())
    }))
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5,
        format: combine(timestamp(), winston.format.json())
    }))
}

export default logger
