/**
 * Intelligence Routes — Lead analysis + strategy insights
 */

import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import intelligenceService from '../services/intelligenceService.js'

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
        console.error('Intelligence fetch error:', err.message)
        res.status(500).json({ error: 'Failed to fetch intelligence' })
    }
})

// Force re-analysis of a lead
router.post('/analyze/:leadId', async (req, res) => {
    try {
        const intel = await intelligenceService.analyzeLead(req.params.leadId, req.user.id, { force: true })
        res.json(intel)
    } catch (err) {
        console.error('Intelligence analysis error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// Get strategy insights (hot leads, stalled, suggestions)
router.get('/insights', async (req, res) => {
    try {
        const insights = await intelligenceService.getStrategyInsights(req.user.id)
        res.json(insights)
    } catch (err) {
        console.error('Strategy insights error:', err.message)
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
        console.error('Leaderboard error:', err.message)
        res.status(500).json({ error: 'Failed to get leaderboard' })
    }
})

export default router
