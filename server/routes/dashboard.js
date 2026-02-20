import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDelete } from '../config/redisClient.js'
import eventBus from '../services/eventBus.js'

const DASHBOARD_CACHE_TTL = 120  // 2 minutes

const router = express.Router()
router.use(authMiddleware)

// GET /api/dashboard — aggregated stats for command center
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id

        // Check Redis cache
        const cached = await cacheGet(`dashboard:${userId}`)
        if (cached) return res.json(cached)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Run all queries in parallel
        const [
            totalLeads,
            leadsToday,
            leadsByStatus,
            totalCalls,
            callsToday,
            callsByOutcome,
            totalTasks,
            tasksCompleted,
            recentNotifications,
            activeAgents,
            unreadCount,
        ] = await Promise.all([
            prisma.lead.count({ where: { userId } }),
            prisma.lead.count({ where: { userId, createdAt: { gte: today } } }),
            prisma.lead.groupBy({ by: ['status'], where: { userId }, _count: true }),
            prisma.call.count({ where: { userId } }),
            prisma.call.count({ where: { userId, createdAt: { gte: today } } }),
            prisma.call.groupBy({ by: ['outcome'], where: { userId, outcome: { not: null } }, _count: true }),
            prisma.task.count({ where: { userId } }),
            prisma.task.count({ where: { userId, status: 'done' } }),
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.agentInstance.count({ where: { userId, status: 'running' } }),
            prisma.notification.count({ where: { userId, read: false } }),
        ])

        // Recent activity — last 20 events across calls & notifications
        const recentCalls = await prisma.call.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true, status: true, outcome: true, createdAt: true, duration: true,
                lead: { select: { name: true, id: true } }
            }
        })

        const recentActivity = [
            ...recentCalls.map(c => ({
                type: 'call',
                title: `Call ${c.status}: ${c.lead?.name || 'Unknown'}`,
                subtitle: c.outcome || c.status,
                timestamp: c.createdAt,
                actionUrl: '/calling',
                metadata: { callId: c.id, leadId: c.lead?.id }
            })),
            ...recentNotifications.map(n => ({
                type: n.type,
                title: n.title,
                subtitle: n.message,
                timestamp: n.createdAt,
                actionUrl: n.actionUrl,
                metadata: n.metadata
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15)

        // Conversion rate
        const wonLeads = leadsByStatus.find(s => s.status === 'won')?._count || 0
        const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

        // Booking rate
        const bookedCalls = callsByOutcome.find(c => c.outcome === 'booked')?._count || 0
        const bookingRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0

        const response = {
            stats: {
                leads: { total: totalLeads, today: leadsToday, byStatus: leadsByStatus, conversionRate },
                calls: { total: totalCalls, today: callsToday, byOutcome: callsByOutcome, bookingRate },
                tasks: { total: totalTasks, completed: tasksCompleted },
                agents: { active: activeAgents }
            },
            recentActivity,
            unreadNotifications: unreadCount
        }

        // Cache for 2 minutes
        await cacheSet(`dashboard:${userId}`, response, DASHBOARD_CACHE_TTL)

        res.json(response)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/dashboard/trends — 7-day trend data for sparklines
router.get('/trends', async (req, res) => {
    try {
        const userId = req.user.id

        // Check Redis cache
        const cached = await cacheGet(`dashboard-trends:${userId}`)
        if (cached) return res.json(cached)

        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        // Fetch raw data for the last 7 days
        const [leads, calls, wonLeads] = await Promise.all([
            prisma.lead.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.call.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.lead.findMany({
                where: { userId, status: 'won', updatedAt: { gte: sevenDaysAgo } },
                select: { updatedAt: true }
            })
        ])

        // Bucket into 7 days
        const bucketCounts = (records, dateField) => {
            const buckets = Array(7).fill(0)
            records.forEach(r => {
                const d = new Date(r[dateField])
                const dayIndex = Math.floor((d.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24))
                if (dayIndex >= 0 && dayIndex < 7) buckets[dayIndex]++
            })
            return buckets
        }

        const response = {
            leads: bucketCounts(leads, 'createdAt'),
            calls: bucketCounts(calls, 'createdAt'),
            conversions: bucketCounts(wonLeads, 'updatedAt')
        }

        await cacheSet(`dashboard-trends:${userId}`, response, DASHBOARD_CACHE_TTL)
        res.json(response)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Invalidate dashboard cache when key events happen
const invalidateDashboard = (data) => {
    const userId = data?.userId
    if (userId) {
        cacheDelete(`dashboard:${userId}`)
        cacheDelete(`dashboard-trends:${userId}`)
    }
}

eventBus.on('lead:created', invalidateDashboard)
eventBus.on('lead:status-changed', invalidateDashboard)
eventBus.on('call:completed', invalidateDashboard)

export default router
