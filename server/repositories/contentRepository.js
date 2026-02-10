import prisma from '../config/prisma.js'

export const contentRepository = {
    async findAllByUserId(userId) {
        return prisma.content.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async findById(id, userId) {
        return prisma.content.findFirst({
            where: { id, userId }
        })
    },

    async create(data) {
        return prisma.content.create({
            data
        })
    },

    async update(id, userId, data) {
        return prisma.content.update({
            where: { id, userId },
            data
        })
    },

    async delete(id, userId) {
        return prisma.content.delete({
            where: { id, userId }
        })
    }
}

export default contentRepository
