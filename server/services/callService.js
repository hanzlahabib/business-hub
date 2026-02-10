/**
 * Call Service — Provider-agnostic call orchestration
 * 
 * Uses TelephonyAdapter from the adapter factory.
 * All business logic lives here, never in adapters.
 */

import prisma from '../config/prisma.js'
import { getAdapters } from '../adapters/index.js'

export const callService = {
    /**
     * Initiate an outbound call to a lead
     */
    async initiateCall(userId, { leadId, scriptId, assistantConfig = {} }) {
        const { telephony } = getAdapters()

        // Get lead
        const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } })
        if (!lead) throw new Error('Lead not found')
        if (!lead.phone) throw new Error('Lead has no phone number')

        // Get script if provided
        let script = null
        if (scriptId) {
            script = await prisma.callScript.findFirst({ where: { id: scriptId, userId } })
            if (script) {
                assistantConfig.openingLine = assistantConfig.openingLine || script.openingLine
                assistantConfig.systemPrompt = this._buildSystemPrompt(script)
            }
        }

        // Create call record
        const call = await prisma.call.create({
            data: {
                leadId,
                direction: 'outbound',
                status: 'queued',
                scriptId: scriptId || undefined,
                userId
            }
        })

        try {
            // Initiate via telephony adapter
            const result = await telephony.initiateCall({
                phoneNumber: lead.phone,
                leadId,
                scriptId,
                assistantConfig
            })

            // Update call with provider ID
            await prisma.call.update({
                where: { id: call.id },
                data: {
                    providerCallId: result.providerCallId,
                    status: result.status || 'ringing'
                }
            })

            // Increment script usage
            if (scriptId) {
                await prisma.callScript.update({
                    where: { id: scriptId },
                    data: { usageCount: { increment: 1 } }
                })
            }

            return { ...call, providerCallId: result.providerCallId, status: result.status }
        } catch (err) {
            await prisma.call.update({
                where: { id: call.id },
                data: { status: 'failed' }
            })
            throw err
        }
    },

    /**
     * Get all calls for a user (with filters)
     */
    async getAll(userId, { leadId, status, outcome, limit = 50, offset = 0 } = {}) {
        const where = { userId }
        if (leadId) where.leadId = leadId
        if (status) where.status = status
        if (outcome) where.outcome = outcome

        const [calls, total] = await Promise.all([
            prisma.call.findMany({
                where,
                include: { lead: true, script: true, meetingNotes: true, negotiations: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.call.count({ where })
        ])

        return { calls, total, limit, offset }
    },

    /**
     * Get a single call with full details
     */
    async getById(id, userId) {
        const call = await prisma.call.findFirst({
            where: { id, userId },
            include: {
                lead: true,
                script: true,
                meetingNotes: true,
                negotiations: true,
                agentInstance: true
            }
        })
        if (!call) throw new Error('Call not found')
        return call
    },

    /**
     * Update call outcome/status
     */
    async update(id, userId, data) {
        const call = await prisma.call.findFirst({ where: { id, userId } })
        if (!call) throw new Error('Call not found')

        const updateData = {}
        if (data.status) updateData.status = data.status
        if (data.outcome) updateData.outcome = data.outcome
        if (data.sentiment) updateData.sentiment = data.sentiment
        if (data.summary) updateData.summary = data.summary
        if (data.transcription) updateData.transcription = data.transcription
        if (data.duration) updateData.duration = data.duration
        if (data.endedAt) updateData.endedAt = new Date(data.endedAt)

        // If call is completed/booked, update lead status
        if (data.outcome === 'booked') {
            await prisma.lead.update({
                where: { id: call.leadId },
                data: { status: 'booked', lastContactedAt: new Date() }
            })
        } else if (data.outcome === 'follow-up') {
            await prisma.lead.update({
                where: { id: call.leadId },
                data: { status: 'follow-up', lastContactedAt: new Date() }
            })
        }

        return prisma.call.update({ where: { id }, data: updateData })
    },

    /**
     * Get call statistics for a user
     */
    async getStats(userId) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [total, todayCount, outcomes, avgDuration] = await Promise.all([
            prisma.call.count({ where: { userId } }),
            prisma.call.count({ where: { userId, createdAt: { gte: today } } }),
            prisma.call.groupBy({
                by: ['outcome'],
                where: { userId, outcome: { not: null } },
                _count: true
            }),
            prisma.call.aggregate({
                where: { userId, duration: { not: null } },
                _avg: { duration: true }
            })
        ])

        const outcomeMap = {}
        outcomes.forEach(o => { outcomeMap[o.outcome] = o._count })

        return {
            total,
            today: todayCount,
            booked: outcomeMap['booked'] || 0,
            followUp: outcomeMap['follow-up'] || 0,
            notInterested: outcomeMap['not-interested'] || 0,
            noAnswer: outcomeMap['no-answer'] || 0,
            avgDuration: Math.round(avgDuration._avg.duration || 0),
            conversionRate: total > 0 ? Math.round(((outcomeMap['booked'] || 0) / total) * 100) : 0
        }
    },

    /**
     * Process webhook from telephony provider
     */
    async handleWebhook(payload) {
        const { telephony } = getAdapters()
        const normalized = await telephony.handleWebhook(payload)

        if (!normalized.providerCallId) return { processed: false }

        const call = await prisma.call.findFirst({
            where: { providerCallId: normalized.providerCallId }
        })
        if (!call) return { processed: false, reason: 'Call not found' }

        const updateData = {}
        if (normalized.status) updateData.status = normalized.status
        if (normalized.duration) updateData.duration = normalized.duration
        if (normalized.recordingUrl) updateData.recordingUrl = normalized.recordingUrl
        if (normalized.transcript) updateData.transcription = normalized.transcript
        if (normalized.summary) updateData.summary = normalized.summary

        if (normalized.status === 'completed' || normalized.status === 'failed') {
            updateData.endedAt = new Date()
        }
        if (normalized.status === 'in-progress' && !call.startedAt) {
            updateData.startedAt = new Date()
        }

        await prisma.call.update({ where: { id: call.id }, data: updateData })
        return { processed: true, callId: call.id, status: normalized.status }
    },

    /**
     * Build system prompt from a call script
     */
    _buildSystemPrompt(script) {
        let prompt = `You are a professional sales agent making an outbound call.\n\n`
        if (script.purpose) prompt += `Purpose: ${script.purpose}\n`
        if (script.industry) prompt += `Industry: ${script.industry}\n`
        if (script.talkingPoints) {
            prompt += `\nKey Talking Points:\n`
            for (const tp of script.talkingPoints) {
                prompt += `- ${tp.topic}: ${tp.script}\n`
            }
        }
        if (script.objectionHandlers) {
            prompt += `\nObjection Handlers:\n`
            for (const oh of script.objectionHandlers) {
                prompt += `- If they say "${oh.objection}": ${oh.response}\n`
            }
        }
        if (script.closingStrategy) prompt += `\nClosing Strategy: ${script.closingStrategy}\n`
        if (script.rateRange) {
            prompt += `\nRate Negotiation: Target $${script.rateRange.target}, range $${script.rateRange.min}-$${script.rateRange.max} ${script.rateRange.currency || 'USD'}\n`
        }
        return prompt
    }
}

export default callService
