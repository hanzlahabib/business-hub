import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import automationService from '../services/automationService.js'

const router = express.Router()
router.use(authMiddleware)

// GET /api/automation/rules — list all rules for user
router.get('/rules', async (req, res) => {
    try {
        const userId = req.user.id

        // Seed default rules on first access
        await automationService.registerDefaultRules(userId)

        const rules = await prisma.automationRule.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        res.json(rules)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/automation/rules — create a new rule
router.post('/rules', async (req, res) => {
    try {
        const userId = req.user.id
        const { name, description, trigger, conditions, actions, enabled } = req.body

        if (!name || !trigger || !actions) {
            return res.status(400).json({ error: 'name, trigger, and actions are required' })
        }

        const rule = await prisma.automationRule.create({
            data: {
                name,
                description: description || '',
                trigger,
                conditions: conditions || [],
                actions,
                enabled: enabled !== false,
                userId
            }
        })
        res.status(201).json(rule)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT /api/automation/rules/:id — update a rule
router.put('/rules/:id', async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params
        const { name, description, trigger, conditions, actions, enabled } = req.body

        const existing = await prisma.automationRule.findFirst({
            where: { id, userId }
        })
        if (!existing) return res.status(404).json({ error: 'Rule not found' })

        const rule = await prisma.automationRule.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(trigger !== undefined && { trigger }),
                ...(conditions !== undefined && { conditions }),
                ...(actions !== undefined && { actions }),
                ...(enabled !== undefined && { enabled })
            }
        })
        res.json(rule)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE /api/automation/rules/:id — delete a rule
router.delete('/rules/:id', async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        const existing = await prisma.automationRule.findFirst({
            where: { id, userId }
        })
        if (!existing) return res.status(404).json({ error: 'Rule not found' })

        await prisma.automationRule.delete({ where: { id } })
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
