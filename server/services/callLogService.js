/**
 * Call Log Service — Tracks every call state transition and event
 *
 * Provides an audit trail for debugging call failures,
 * showing exactly what happened at each step.
 */

import prisma from '../config/prisma.js'
import logger from '../config/logger.js'

export const callLogService = {
    /**
     * Create a call log entry
     */
    async log(callId, userId, event, message, details = null, level = 'info') {
        try {
            return await prisma.callLog.create({
                data: { callId, userId, event, message, details, level }
            })
        } catch (err) {
            // Don't let logging failures break the calling flow
            logger.error('Failed to create call log', { callId, event, error: err.message })
            return null
        }
    },

    /**
     * Get all logs for a specific call
     */
    async getByCall(callId, userId) {
        return prisma.callLog.findMany({
            where: { callId, userId },
            orderBy: { createdAt: 'asc' }
        })
    },

    /**
     * Get recent activity across all calls for a user
     */
    async getRecent(userId, limit = 50) {
        return prisma.callLog.findMany({
            where: { userId },
            include: {
                call: {
                    select: {
                        id: true,
                        status: true,
                        lead: { select: { id: true, name: true, company: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }
}

export default callLogService
