import prisma from '../config/prisma.js'

export const leadRepository = {
    async findAllByUserId(userId) {
        return prisma.lead.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async findById(id, userId) {
        return prisma.lead.findFirst({
            where: { id, userId }
        })
    },

    async create(data) {
        return prisma.lead.create({
            data
        })
    },

    async update(id, userId, data) {
        return prisma.lead.update({
            where: { id, userId },
            data
        })
    },

    async delete(id, userId) {
        return prisma.lead.delete({
            where: { id, userId }
        })
    }
}

export default leadRepository
