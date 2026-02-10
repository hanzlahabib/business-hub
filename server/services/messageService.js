import messageRepository from '../repositories/messageRepository.js'
import leadRepository from '../repositories/leadRepository.js'

export const messageService = {
    async getMessagesByLead(userId, leadId) {
        return messageRepository.findAllByUserId(userId, leadId)
    },

    async logReceivedMessage(userId, { leadId, channel, subject, body }) {
        const message = await messageRepository.create({
            userId,
            leadId,
            type: 'received',
            channel,
            subject: subject || '',
            body: body || '',
            status: 'received'
        })

        // Update lead status to replied if it was contacted
        const lead = await leadRepository.findById(leadId, userId)
        if (lead && lead.status === 'contacted') {
            await leadRepository.update(leadId, userId, { status: 'replied' })
        }

        return message
    },

    async logCall(userId, { leadId, notes, outcome }) {
        const message = await messageRepository.create({
            userId,
            leadId,
            type: 'sent',
            channel: 'call',
            subject: `Call - ${outcome || 'No outcome'}`,
            body: notes || '',
            status: 'sent'
        })

        // Update lead's lastContactedAt
        await leadRepository.update(leadId, userId, { lastContactedAt: new Date() })

        return message
    },

    async getStats(userId, leadId) {
        return messageRepository.getStats(userId, leadId)
    }
}

export default messageService
