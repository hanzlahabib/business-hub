import prisma from '../config/prisma.js'

export const jobRepository = {
    async findAllByUserId(userId) {
        return prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async findById(id, userId) {
        return prisma.job.findFirst({
            where: { id, userId }
        })
    },

    async create(data) {
        return prisma.job.create({
            data
        })
    },

    async update(id, userId, data) {
        return prisma.job.update({
            where: { id, userId },
            data
        })
    },

    async delete(id, userId) {
        return prisma.job.delete({
            where: { id, userId }
        })
    }
}

export default jobRepository
