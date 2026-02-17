/**
 * Call Scheduler Service
 * 
 * Polls for calls with status='scheduled' where scheduledAt <= now,
 * then triggers them via callService.initiateCall.
 * 
 * Runs every 30 seconds on the server process.
 */

import prisma from '../config/prisma.js'
import callService from './callService.js'
import { callLogService } from './callLogService.js'
import logger from '../config/logger.js'

let schedulerInterval = null

export const callSchedulerService = {
    /**
     * Start the scheduler on server boot
     */
    init() {
        if (schedulerInterval) {
            logger.warn('Call scheduler already running — skipping duplicate init')
            return
        }

        // Poll every 30 seconds
        schedulerInterval = setInterval(() => {
            this._processDueCalls().catch(err => {
                logger.error('Call scheduler tick failed', { error: err.message })
            })
        }, 30000)

        // Run immediately on boot to catch any due calls
        this._processDueCalls().catch(err => {
            logger.error('Call scheduler initial run failed', { error: err.message })
        })

        logger.info('Call scheduler started (30s interval)')
    },

    /**
     * Stop the scheduler cleanly (for graceful shutdown)
     */
    shutdown() {
        if (schedulerInterval) {
            clearInterval(schedulerInterval)
            schedulerInterval = null
            logger.info('Call scheduler stopped')
        }
    },

    /**
     * Process all calls that are due to fire
     */
    async _processDueCalls() {
        const now = new Date()

        const dueCalls = await prisma.call.findMany({
            where: {
                status: 'scheduled',
                scheduledAt: { lte: now }
            },
            include: { lead: true },
            take: 20 // Process max 20 per tick to avoid overload
        })

        if (dueCalls.length === 0) return

        logger.info(`Call scheduler: ${dueCalls.length} call(s) due`, {
            callIds: dueCalls.map(c => c.id)
        })

        for (const scheduledCall of dueCalls) {
            try {
                // Pass existingCallId so initiateCall reuses this record instead of creating a duplicate
                const result = await callService.initiateCall(scheduledCall.userId, {
                    leadId: scheduledCall.leadId,
                    scriptId: scheduledCall.scriptId || undefined,
                    assistantConfig: {},
                    existingCallId: scheduledCall.id
                })

                await callLogService.log(scheduledCall.id, scheduledCall.userId, 'scheduler-triggered',
                    `Scheduled call auto-triggered → ${scheduledCall.lead?.name || scheduledCall.leadId}`,
                    { scheduledAt: scheduledCall.scheduledAt }, 'info'
                )

                logger.info('Scheduled call triggered', {
                    callId: scheduledCall.id,
                    leadId: scheduledCall.leadId
                })
            } catch (err) {
                // Mark as failed if initiation fails
                await prisma.call.update({
                    where: { id: scheduledCall.id },
                    data: {
                        status: 'failed',
                        errorReason: `Scheduler trigger failed: ${err.message}`,
                        failedAt: new Date()
                    }
                })

                await callLogService.log(scheduledCall.id, scheduledCall.userId, 'scheduler-error',
                    `Scheduled call failed to trigger: ${err.message}`,
                    { error: err.message }, 'error'
                )

                logger.error('Scheduled call trigger failed', {
                    callId: scheduledCall.id,
                    error: err.message
                })
            }
        }
    }
}

export default callSchedulerService
