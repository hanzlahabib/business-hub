import prisma from '../config/prisma.js'

export const messageRepository = {
    async findAllByUserId(userId, leadId) {
        const where = { userId }
        if (leadId) where.leadId = leadId

        return prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { lead: true }
        })
    },

    async findById(id, userId) {
        return prisma.message.findFirst({
            where: { id, userId },
            include: { lead: true }
        })
    },

    async create(data) {
        return prisma.message.create({
            data
        })
    },

    async update(id, userId, data) {
        return prisma.message.update({
            where: { id, userId },
            data
        })
    },

    async delete(id, userId) {
        return prisma.message.delete({
            where: { id, userId }
        })
    },

    async getStats(userId, leadId) {
        const messages = await prisma.message.findMany({
            where: { userId, leadId }
        })

        return {
            total: messages.length,
            sent: messages.filter(m => m.type === 'sent').length,
            received: messages.filter(m => m.type === 'received').length,
            byChannel: {
                email: messages.filter(m => m.channel === 'email').length,
                whatsapp: messages.filter(m => m.channel === 'whatsapp').length,
                linkedin: messages.filter(m => m.channel === 'linkedin').length,
                call: messages.filter(m => m.channel === 'call').length
            },
            lastContact: messages.length > 0
                ? messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
                : null
        }
    }
}

export default messageRepository
