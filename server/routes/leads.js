import express from 'express'
import leadService from '../services/leadService.js'
import authMiddleware from '../middleware/auth.js'
import eventBus from '../services/eventBus.js'
import { validate, createLeadSchema, updateLeadSchema } from '../middleware/validate.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
    try {
        const leads = await leadService.getAll(req.user.id)
        res.json(leads)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', validate(createLeadSchema), async (req, res) => {
    try {
        const lead = await leadService.create(req.user.id, req.body)
        res.status(201).json(lead)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Bulk update — PATCH /api/leads/bulk
router.patch('/bulk', async (req, res) => {
    try {
        const { ids, updates } = req.body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' })
        }
        const { name, company, contactPerson, email, phone, status, source, industry, website, websiteIssues, tags, linkedBoardId, followUpDate, lastContactedAt, notes, typeId } = updates || {}
        const allowedUpdates = { name, company, contactPerson, email, phone, status, source, industry, website, websiteIssues, tags, linkedBoardId, followUpDate, lastContactedAt, notes, typeId }
        const prisma = (await import('../config/prisma.js')).default
        await prisma.lead.updateMany({
            where: { id: { in: ids }, userId: req.user.id },
            data: allowedUpdates
        })
        // Return the updated leads
        const updated = await prisma.lead.findMany({
            where: { id: { in: ids }, userId: req.user.id },
            include: { leadType: true }
        })
        res.json(updated)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Bulk delete — DELETE /api/leads/bulk
router.delete('/bulk', async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' })
        }
        const prisma = (await import('../config/prisma.js')).default
        await prisma.lead.deleteMany({
            where: { id: { in: ids }, userId: req.user.id }
        })
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const lead = await leadService.getById(req.params.id, req.user.id)
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.put('/:id', validate(updateLeadSchema), async (req, res) => {
    try {
        const oldLead = await leadService.getById(req.params.id, req.user.id)
        const lead = await leadService.update(req.params.id, req.user.id, req.body)

        // Emit status change event if status actually changed
        if (req.body.status && req.body.status !== oldLead.status) {
            eventBus.publish('lead:status-changed', {
                userId: req.user.id, entityId: lead.id, entityType: 'lead',
                data: { leadName: lead.name, status: lead.status, previousStatus: oldLead.status }
            })
        }
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.patch('/:id', validate(updateLeadSchema), async (req, res) => {
    try {
        const oldLead = await leadService.getById(req.params.id, req.user.id)
        const lead = await leadService.update(req.params.id, req.user.id, req.body)

        // Emit status change event if status actually changed
        if (req.body.status && req.body.status !== oldLead.status) {
            eventBus.publish('lead:status-changed', {
                userId: req.user.id, entityId: lead.id, entityType: 'lead',
                data: { leadName: lead.name, status: lead.status, previousStatus: oldLead.status }
            })
        }
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await leadService.delete(req.params.id, req.user.id)
        res.status(204).send()
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

// GET /api/leads/:id/activity — aggregated activity timeline
router.get('/:id/activity', async (req, res) => {
    try {
        const leadId = req.params.id
        const userId = req.user.id
        const prisma = (await import('../config/prisma.js')).default

        // Parallel queries
        const [calls, messages, notifications] = await Promise.all([
            prisma.call.findMany({
                where: { leadId, userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: {
                    id: true, status: true, outcome: true, duration: true,
                    summary: true, createdAt: true, sentiment: true
                }
            }),
            prisma.message.findMany({
                where: { leadId, userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: {
                    id: true, subject: true, status: true, type: true,
                    channel: true, createdAt: true
                }
            }),
            prisma.notification.findMany({
                where: {
                    userId,
                    metadata: { path: ['leadId'], equals: leadId }
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true, type: true, title: true, message: true, createdAt: true
                }
            })
        ])

        // Unify into timeline
        const timeline = [
            ...calls.map(c => ({
                id: c.id, type: 'call', icon: 'phone',
                title: `Call ${c.status}${c.outcome ? ` — ${c.outcome}` : ''}`,
                subtitle: c.summary || (c.duration ? `Duration: ${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : ''),
                timestamp: c.createdAt,
                metadata: { callId: c.id, sentiment: c.sentiment }
            })),
            ...messages.map(m => ({
                id: m.id, type: 'email', icon: 'mail',
                title: `${m.type === 'received' ? 'Received' : 'Sent'} ${m.channel || 'email'}${m.subject ? `: ${m.subject}` : ''}`,
                subtitle: `Status: ${m.status}`,
                timestamp: m.createdAt,
                metadata: { messageId: m.id }
            })),
            ...notifications.map(n => ({
                id: n.id, type: 'notification', icon: 'bell',
                title: n.title,
                subtitle: n.message,
                timestamp: n.createdAt,
                metadata: {}
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

        res.json(timeline)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router

