/**
 * Campaign API Routes
 *
 * CRUD for outreach campaigns + analytics endpoint.
 * Campaigns are higher-level wrappers around the agent system.
 */

import express from 'express'
import campaignService from '../services/campaignService.js'
import transcriptionService from '../services/transcriptionService.js'
import dncService from '../services/dncService.js'

const router = express.Router()

/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const campaigns = await campaignService.getAll(userId)
        res.json(campaigns)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const { name, scriptId, industry, tier, leadIds, boardId } = req.body
        const campaign = await campaignService.create(userId, { name, scriptId, industry, tier, leadIds, boardId })
        res.status(201).json(campaign)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

/**
 * GET /api/campaigns/analytics
 * Campaign analytics dashboard data
 */
router.get('/analytics', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const range = req.query.range || '30d'
        const analytics = await campaignService.getAnalytics(userId, range)
        res.json(analytics)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * GET /api/campaigns/:id
 * Campaign details with funnel + next actions
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const campaign = await campaignService.getById(req.params.id, userId)
        res.json(campaign)
    } catch (err) {
        res.status(404).json({ error: err.message })
    }
})

/**
 * POST /api/campaigns/:id/transcribe
 * Transcribe all untranscribed calls in a campaign
 */
router.post('/:id/transcribe', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const results = await transcriptionService.transcribeUntranscribed(userId, 20)
        res.json({ results })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * GET /api/dnc
 * Get DNC list
 */
router.get('/dnc/list', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const list = await dncService.getDNCList(userId)
        res.json(list)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * POST /api/dnc
 * Add a phone to DNC list
 */
router.post('/dnc/add', async (req, res) => {
    try {
        const { phone, reason } = req.body
        await dncService.addToDNC(phone, reason)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * DELETE /api/dnc
 * Remove a phone from DNC list
 */
router.delete('/dnc/remove', async (req, res) => {
    try {
        const { phone } = req.body
        await dncService.removeFromDNC(phone)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/**
 * POST /api/calls/:id/transcribe
 * Transcribe a single call
 */
router.post('/calls/:id/transcribe', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const result = await transcriptionService.transcribeCall(req.params.id, userId)
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
