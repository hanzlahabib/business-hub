import leadRepository from '../repositories/leadRepository.js'
import eventBus from './eventBus.js'

const leadService = {
    async getAll(userId) {
        return leadRepository.findAllByUserId(userId)
    },

    async getById(id, userId) {
        const lead = await leadRepository.findById(id, userId)
        if (!lead) throw new Error('Lead not found')
        return lead
    },

    async create(userId, data) {
        const lead = await leadRepository.create({ ...data, userId })

        eventBus.publish('lead:created', {
            userId,
            entityId: lead.id,
            entityType: 'lead',
            data: { lead, leadName: lead.name, source: lead.source }
        })

        return lead
    },

    async update(id, userId, data) {
        const existing = await leadRepository.findById(id, userId)
        if (!existing) throw new Error('Lead not found')
        const updated = await leadRepository.update(id, userId, data)

        // Emit status change event if status changed
        if (data.status && data.status !== existing.status) {
            eventBus.publish('lead:status-changed', {
                userId,
                entityId: id,
                entityType: 'lead',
                data: { leadId: id, leadName: updated.name, oldStatus: existing.status, status: data.status }
            })
        }

        eventBus.publish('lead:updated', {
            userId,
            entityId: id,
            entityType: 'lead',
            data: { lead: updated, leadName: updated.name }
        })

        return updated
    },

    async delete(id, userId) {
        const existing = await leadRepository.findById(id, userId)
        if (!existing) throw new Error('Lead not found')
        return leadRepository.delete(id, userId)
    }
}

export default leadService
