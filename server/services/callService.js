/**
 * Call Service — Provider-agnostic call orchestration
 * 
 * Uses TelephonyAdapter from the adapter factory.
 * All business logic lives here, never in adapters.
 */

import prisma from '../config/prisma.js'
import { getAdaptersForUser } from './apiKeyService.js'

export const callService = {
    /**
     * Initiate an outbound call to a lead
     */
    async initiateCall(userId, { leadId, scriptId, assistantConfig = {} }) {
        const { telephony } = getAdaptersForUser(userId)

        // Get lead
        const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } })
        if (!lead) throw new Error('Lead not found')
        if (!lead.phone) throw new Error('Lead has no phone number')

        // Get script if provided — merge assistantConfig from script + call params
        let script = null
        if (scriptId) {
            script = await prisma.callScript.findFirst({ where: { id: scriptId, userId } })
            if (script) {
                const scriptConfig = script.assistantConfig || {}
                // Script config is the base, call-level params override
                assistantConfig = {
                    ...scriptConfig,
                    ...assistantConfig,
                    openingLine: assistantConfig.openingLine || script.openingLine,
                    systemPrompt: assistantConfig.systemPrompt || this._buildSystemPrompt(script),
                }
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
        // Look up call first to get userId for per-user adapters
        const callLookup = await prisma.call.findFirst({
            where: { providerCallId: payload.call_id || payload.CallSid || payload.providerCallId },
            select: { userId: true }
        })
        const { telephony } = getAdaptersForUser(callLookup?.userId)
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
     * Build system prompt from a call script + assistantConfig
     * If customSystemPrompt is set in assistantConfig, use that directly.
     * Otherwise, auto-generate from script fields + business context.
     */
    _buildSystemPrompt(script) {
        const ac = script.assistantConfig || {}

        // If user provided a full custom system prompt, use it directly
        if (ac.customSystemPrompt) return ac.customSystemPrompt

        const agentName = ac.agentName || 'Alex'
        const agentRole = ac.agentRole || 'sales representative'
        const businessName = ac.businessName || 'our company'
        const businessWebsite = ac.businessWebsite || ''
        const businessLocation = ac.businessLocation || ''
        const style = ac.conversationStyle || 'friendly and professional'

        let prompt = `You are ${agentName}, a ${style} ${agentRole} for ${businessName}.\n\n`

        // Goal from script purpose
        if (script.purpose) {
            prompt += `YOUR GOAL: ${script.purpose}\n\n`
        }

        // Business context
        const contextParts = []
        if (businessWebsite) contextParts.push(`- You represent ${businessWebsite}`)
        if (businessLocation) contextParts.push(`- Based in ${businessLocation}`)
        if (script.industry) contextParts.push(`- Industry: ${script.industry}`)
        if (contextParts.length > 0) {
            prompt += `CONTEXT:\n${contextParts.join('\n')}\n\n`
        }

        // Talking points
        if (script.talkingPoints?.length > 0) {
            prompt += `KEY TALKING POINTS:\n`
            for (const tp of script.talkingPoints) {
                prompt += `- ${tp.topic}: ${tp.script}\n`
            }
            prompt += '\n'
        }

        // Objection handlers
        if (script.objectionHandlers?.length > 0) {
            prompt += `OBJECTION HANDLING:\n`
            for (const oh of script.objectionHandlers) {
                prompt += `- "${oh.objection}" → "${oh.response}"\n`
            }
            prompt += '\n'
        }

        // Rate negotiation
        if (script.rateRange) {
            const r = script.rateRange
            prompt += `RATE NEGOTIATION:\n`
            prompt += `- Target: $${r.target}${r.currency ? ' ' + r.currency : ''}\n`
            prompt += `- Range: $${r.min} - $${r.max}\n\n`
        }

        // Closing strategy
        if (script.closingStrategy) {
            prompt += `CLOSING STRATEGY:\n${script.closingStrategy}\n\n`
        }

        // Conversation style rules
        prompt += `CONVERSATION STYLE:\n`
        prompt += `- Keep ALL responses SHORT — 1-2 sentences max (this is a phone call, not an essay)\n`
        prompt += `- Sound natural and conversational\n`
        prompt += `- Don't be pushy — if they say no, be gracious\n`
        prompt += `- NEVER make claims you can't back up\n`

        return prompt
    }
}

export default callService
