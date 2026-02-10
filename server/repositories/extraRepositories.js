import prisma from '../config/prisma.js'

export const taskBoardRepository = {
    async findAllByUserId(userId) {
        return prisma.taskBoard.findMany({ where: { userId }, include: { tasks: true } })
    },
    async create(userId, data) {
        return prisma.taskBoard.create({ data: { ...data, userId } })
    }
}

export const taskRepository = {
    async findAllByUserId(userId) {
        return prisma.task.findMany({ where: { userId } })
    },
    async create(userId, data) {
        return prisma.task.create({ data: { ...data, userId } })
    }
}

export const templateRepository = {
    async findAllByUserId(userId) {
        return prisma.template.findMany({ where: { userId }, include: { folder: true } })
    },
    async create(userId, data) {
        return prisma.template.create({ data: { ...data, userId } })
    }
}

export const templateFolderRepository = {
    async findAllByUserId(userId) {
        return prisma.templateFolder.findMany({ where: { userId }, include: { templates: true } })
    },
    async create(userId, data) {
        return prisma.templateFolder.create({ data: { ...data, userId } })
    }
}

export const settingsRepository = {
    async findByUserId(userId) {
        return prisma.settings.findUnique({ where: { userId } })
    },
    async upsert(userId, config) {
        return prisma.settings.upsert({
            where: { userId },
            update: { config },
            create: { userId, config }
        })
    }
}

export const emailSettingsRepository = {
    async findByUserId(userId) {
        return prisma.emailSettings.findUnique({ where: { userId } })
    },
    async upsert(userId, config) {
        return prisma.emailSettings.upsert({
            where: { userId },
            update: { config },
            create: { userId, config }
        })
    }
}

export const jobSearchPromptRepository = {
    async findAllByUserId(userId) {
        return prisma.jobSearchPrompt.findMany({ where: { userId } })
    },
    async create(userId, data) {
        return prisma.jobSearchPrompt.create({ data: { ...data, userId } })
    }
}
