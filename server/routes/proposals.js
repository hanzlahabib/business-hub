/**
 * Proposal Routes — CRUD + AI generation
 */

import express from 'express'
import authMiddleware from '../middleware/auth.js'
import proposalService from '../services/proposalService.js'
import logger from '../config/logger.js'

const router = express.Router()
router.use(authMiddleware)

// List proposals (optional ?leadId, ?status filters)
router.get('/', async (req, res) => {
    try {
        const proposals = await proposalService.getAll(req.user.id, {
            leadId: req.query.leadId,
            status: req.query.status
        })
        res.json(proposals)
    } catch (err) {
        logger.error('Proposals list error:', { error: err.message })
        res.status(500).json({ error: 'Failed to list proposals' })
    }
})

// Create proposal
router.post('/', async (req, res) => {
    try {
        const proposal = await proposalService.create(req.user.id, req.body)
        res.status(201).json(proposal)
    } catch (err) {
        logger.error('Proposal create error:', { error: err.message })
        res.status(500).json({ error: err.message })
    }
})

// Get single proposal
router.get('/:id', async (req, res) => {
    try {
        const proposal = await proposalService.getById(req.params.id, req.user.id)
        res.json(proposal)
    } catch (err) {
        logger.error('Proposal fetch error:', { error: err.message })
        res.status(404).json({ error: err.message })
    }
})

// Update proposal
router.put('/:id', async (req, res) => {
    try {
        const proposal = await proposalService.update(req.params.id, req.user.id, req.body)
        res.json(proposal)
    } catch (err) {
        logger.error('Proposal update error:', { error: err.message })
        res.status(500).json({ error: err.message })
    }
})

// Delete proposal
router.delete('/:id', async (req, res) => {
    try {
        await proposalService.delete(req.params.id, req.user.id)
        res.json({ success: true })
    } catch (err) {
        logger.error('Proposal delete error:', { error: err.message })
        res.status(500).json({ error: err.message })
    }
})

// AI-generate proposal draft for a lead
router.post('/generate/:leadId', async (req, res) => {
    try {
        const proposal = await proposalService.generateDraft(req.params.leadId, req.user.id)
        res.status(201).json(proposal)
    } catch (err) {
        logger.error('Proposal generation error:', { error: err.message })
        res.status(500).json({ error: err.message })
    }
})

export default router
