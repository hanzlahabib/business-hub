/**
 * Rate Negotiation Service — AI-powered pricing strategy
 * 
 * Uses LLMAdapter for strategy generation.
 */

import prisma from '../config/prisma.js'
import { getAdapters } from '../adapters/index.js'

export const rateNegotiationService = {
    async getByCall(callId, userId) {
        return prisma.rateNegotiation.findMany({
            where: { callId, userId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async create(userId, callId, data) {
        const call = await prisma.call.findFirst({
            where: { id: callId, userId },
            include: { lead: true }
        })
        if (!call) throw new Error('Call not found')

        return prisma.rateNegotiation.create({
            data: {
                callId,
                leadId: call.leadId,
                initialRate: data.initialRate,
                proposedRate: data.proposedRate,
                currency: data.currency || 'USD',
                status: 'pending',
                userId
            }
        })
    },

    async update(id, userId, data) {
        const neg = await prisma.rateNegotiation.findFirst({ where: { id, userId } })
        if (!neg) throw new Error('Negotiation not found')
        return prisma.rateNegotiation.update({ where: { id }, data })
    },

    /**
     * Get AI-suggested negotiation strategy
     */
    async suggestStrategy(userId, callId, { currentRate, targetRate, marketContext }) {
        const { llm } = getAdapters()

        const call = await prisma.call.findFirst({
            where: { id: callId, userId },
            include: { lead: true }
        })
        if (!call) throw new Error('Call not found')

        // Get past negotiations for this lead
        const history = await prisma.rateNegotiation.findMany({
            where: { leadId: call.leadId, userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        })

        const strategy = await llm.negotiateRate({
            leadData: call.lead,
            currentRate,
            targetRate,
            history: history.map(h => ({ rate: h.proposedRate, status: h.status, date: h.createdAt })),
            marketContext
        })

        // Save strategy on the negotiation record
        const negotiation = await prisma.rateNegotiation.create({
            data: {
                callId,
                leadId: call.leadId,
                initialRate: currentRate,
                proposedRate: strategy.suggestedRate,
                currency: 'USD',
                status: 'negotiating',
                strategy: strategy.strategy,
                notes: strategy.reasoning,
                userId
            }
        })

        return { negotiation, ...strategy }
    },

    /**
     * Record final accepted/rejected rate
     */
    async finalize(id, userId, { finalRate, status }) {
        const neg = await prisma.rateNegotiation.findFirst({ where: { id, userId } })
        if (!neg) throw new Error('Negotiation not found')

        return prisma.rateNegotiation.update({
            where: { id },
            data: { finalRate, status }
        })
    }
}

export default rateNegotiationService
