/**
 * Call Script Service — AI-powered script management
 * 
 * Uses LLMAdapter for AI script generation.
 */

import prisma from '../config/prisma.js'
import { getAdaptersForUser } from './apiKeyService.js'

export const callScriptService = {
    async getAll(userId) {
        return prisma.callScript.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        })
    },

    async getById(id, userId) {
        const script = await prisma.callScript.findFirst({ where: { id, userId } })
        if (!script) throw new Error('Script not found')
        return script
    },

    async create(userId, data) {
        return prisma.callScript.create({
            data: { ...data, userId }
        })
    },

    async update(id, userId, data) {
        const script = await prisma.callScript.findFirst({ where: { id, userId } })
        if (!script) throw new Error('Script not found')
        return prisma.callScript.update({ where: { id }, data })
    },

    async delete(id, userId) {
        const script = await prisma.callScript.findFirst({ where: { id, userId } })
        if (!script) throw new Error('Script not found')
        return prisma.callScript.delete({ where: { id } })
    },

    /**
     * Generate a script using AI
     */
    async generate(userId, { purpose, industry, rateRange, context }) {
        const { llm } = getAdaptersForUser(userId)
        const generated = await llm.generateScript({ purpose, industry, rateRange, context })

        // Save generated script
        return prisma.callScript.create({
            data: {
                name: `${purpose || 'Sales'} Script — ${industry || 'General'}`,
                purpose,
                industry,
                openingLine: generated.openingLine,
                talkingPoints: generated.talkingPoints,
                objectionHandlers: generated.objectionHandlers,
                closingStrategy: generated.closingStrategy,
                rateRange: rateRange || undefined,
                userId
            }
        })
    }
}

export default callScriptService
