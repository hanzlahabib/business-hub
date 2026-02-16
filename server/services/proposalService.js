/**
 * Proposal Service — CRUD for proposals
 * 
 * Follows the same pattern as leadService / rateNegotiationService.
 */

import prisma from '../config/prisma.js'
import intelligenceService from './intelligenceService.js'

export const proposalService = {
    async create(userId, data) {
        return prisma.proposal.create({
            data: {
                title: data.title,
                status: data.status || 'draft',
                content: data.content || { sections: [], pricing: [] },
                totalValue: data.totalValue || null,
                currency: data.currency || 'USD',
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                leadId: data.leadId,
                userId
            },
            include: { lead: { select: { id: true, name: true, company: true } } }
        })
    },

    async getAll(userId, { leadId, status } = {}) {
        const where = { userId }
        if (leadId) where.leadId = leadId
        if (status) where.status = status

        return prisma.proposal.findMany({
            where,
            include: { lead: { select: { id: true, name: true, company: true } } },
            orderBy: { createdAt: 'desc' }
        })
    },

    async getById(id, userId) {
        const proposal = await prisma.proposal.findFirst({
            where: { id, userId },
            include: { lead: { select: { id: true, name: true, company: true, email: true } } }
        })
        if (!proposal) throw new Error('Proposal not found')
        return proposal
    },

    async update(id, userId, data) {
        const existing = await prisma.proposal.findFirst({ where: { id, userId } })
        if (!existing) throw new Error('Proposal not found')

        const updateData = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.status !== undefined) updateData.status = data.status
        if (data.content !== undefined) updateData.content = data.content
        if (data.totalValue !== undefined) updateData.totalValue = data.totalValue
        if (data.currency !== undefined) updateData.currency = data.currency
        if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null
        if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason

        // Track status transitions
        if (data.status === 'sent' && existing.status !== 'sent') updateData.sentAt = new Date()
        if (data.status === 'accepted' && existing.status !== 'accepted') updateData.acceptedAt = new Date()

        return prisma.proposal.update({
            where: { id },
            data: updateData,
            include: { lead: { select: { id: true, name: true, company: true } } }
        })
    },

    async delete(id, userId) {
        const existing = await prisma.proposal.findFirst({ where: { id, userId } })
        if (!existing) throw new Error('Proposal not found')
        return prisma.proposal.delete({ where: { id } })
    },

    async generateDraft(leadId, userId) {
        return intelligenceService.generateProposal(leadId, userId)
    }
}

export default proposalService
