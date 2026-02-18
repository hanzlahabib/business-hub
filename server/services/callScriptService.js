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
        const { name, purpose, industry, openingLine, talkingPoints, objectionHandlers, closingStrategy, rateRange, assistantConfig, isActive } = data
        return prisma.callScript.create({
            data: { name, purpose, industry, openingLine, talkingPoints, objectionHandlers, closingStrategy, rateRange, assistantConfig, isActive, userId }
        })
    },

    async update(id, userId, data) {
        const script = await prisma.callScript.findFirst({ where: { id, userId } })
        if (!script) throw new Error('Script not found')
        const { name, purpose, industry, openingLine, talkingPoints, objectionHandlers, closingStrategy, rateRange, assistantConfig, isActive } = data
        return prisma.callScript.update({ where: { id }, data: { name, purpose, industry, openingLine, talkingPoints, objectionHandlers, closingStrategy, rateRange, assistantConfig, isActive } })
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
