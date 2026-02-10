import express from 'express'
import authMiddleware from '../middleware/auth.js'
import prisma from '../config/prisma.js'
import { executeCampaign } from '../services/outreachScheduler.js'

const router = express.Router()
router.use(authMiddleware)

// Execute outreach campaign
router.post('/campaign', async (req, res) => {
    const { leadIds, templateId, delaySeconds = 30 } = req.body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ success: false, error: 'leadIds array is required' })
    }

    if (!templateId) {
        return res.status(400).json({ success: false, error: 'templateId is required' })
    }

    try {
        const result = await executeCampaign({
            userId: req.user.id,
            leadIds,
            templateId,
            delayMs: Math.max(5000, delaySeconds * 1000) // Minimum 5s delay
        })

        res.json({ success: true, ...result })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Get outreach history/stats
router.get('/history', async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                userId: req.user.id,
                type: 'sent',
                channel: 'email'
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                lead: { select: { name: true, email: true, status: true } }
            }
        })

        // Stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const sentToday = messages.filter(m => new Date(m.createdAt) >= today).length

        const thisWeek = new Date()
        thisWeek.setDate(thisWeek.getDate() - 7)
        const sentThisWeek = messages.filter(m => new Date(m.createdAt) >= thisWeek).length

        res.json({
            success: true,
            stats: {
                sentToday,
                sentThisWeek,
                totalSent: messages.length
            },
            messages
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Get leads that haven't been contacted yet
router.get('/uncontacted', async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                userId: req.user.id,
                OR: [
                    { status: 'new' },
                    { status: null },
                    { lastContactedAt: null }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ success: true, count: leads.length, leads })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
