import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()
router.use(authMiddleware)

// GET /api/notifications — list notifications (optionally ?unread=true)
router.get('/', async (req, res) => {
    try {
        const where = { userId: req.user.id }
        if (req.query.unread === 'true') where.read = false

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(req.query.limit) || 50
        })
        res.json(notifications)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/notifications/count — unread count
router.get('/count', async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { userId: req.user.id, read: false }
        })
        res.json({ unread: count })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true }
        })
        res.json(notification)
    } catch (err) {
        res.status(404).json({ error: 'Notification not found' })
    }
})

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
    try {
        const result = await prisma.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true }
        })
        res.json({ updated: result.count })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
