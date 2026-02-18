/**
 * Intelligence Routes — Lead analysis + strategy insights
 */

import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import intelligenceService from '../services/intelligenceService.js'
import logger from '../config/logger.js'

const router = express.Router()
router.use(authMiddleware)

// Get intelligence for a lead
router.get('/lead/:leadId', async (req, res) => {
    try {
        const intel = await prisma.leadIntelligence.findUnique({
            where: { leadId: req.params.leadId },
            include: { lead: { select: { id: true, name: true, company: true, status: true } } }
        })
        res.json(intel || null)
    } catch (err) {
        logger.error('Intelligence fetch error:', { error: err.message })
        res.status(500).json({ error: 'Failed to fetch intelligence' })
    }
})

// Force re-analysis of a lead
router.post('/analyze/:leadId', async (req, res) => {
    try {
        const intel = await intelligenceService.analyzeLead(req.params.leadId, req.user.id, { force: true })
        res.json(intel)
    } catch (err) {
        logger.error('Intelligence analysis error:', { error: err.message })
        res.status(500).json({ error: err.message })
    }
})

// Get strategy insights (hot leads, stalled, suggestions)
router.get('/insights', async (req, res) => {
    try {
        const insights = await intelligenceService.getStrategyInsights(req.user.id)
        res.json(insights)
    } catch (err) {
        logger.error('Strategy insights error:', { error: err.message })
        res.status(500).json({ error: 'Failed to get strategy insights' })
    }
})

// Top leads by dealHeat
router.get('/leaderboard', async (req, res) => {
    try {
        const leaders = await prisma.leadIntelligence.findMany({
            where: { userId: req.user.id, dealHeat: { not: null } },
            include: { lead: { select: { id: true, name: true, company: true, status: true, industry: true } } },
            orderBy: { dealHeat: 'desc' },
            take: 10
        })
        res.json(leaders)
    } catch (err) {
        logger.error('Leaderboard error:', { error: err.message })
        res.status(500).json({ error: 'Failed to get leaderboard' })
    }
})

export default router
