import prisma from '../config/prisma.js'

export const userRepository = {
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
            include: {
                settings: true,
                emailSettings: true
            }
        })
    },

    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                settings: true,
                emailSettings: true
            }
        })
    },

    async create(data) {
        return prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash: data.passwordHash,
                settings: {
                    create: {
                        theme: 'dark',
                        notifications: true
                    }
                }
            }
        })
    },

    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data
        })
    }
}

export default userRepository
