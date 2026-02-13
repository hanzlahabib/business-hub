import prisma from '../config/prisma.js'

export const skillMasteryRepository = {
    async findByUserId(userId) {
        const record = await prisma.skillMastery.findUnique({
            where: { userId }
        })
        return record || null
    },

    async upsert(userId, data) {
        const record = await prisma.skillMastery.upsert({
            where: { userId },
            update: { data },
            create: { userId, data }
        })
        return record
    }
}

export default skillMasteryRepository
