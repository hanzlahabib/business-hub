/**
 * Call & Script REST API Routes
 * 
 * All routes require authentication (authMiddleware).
 * Uses callService, callScriptService, meetingNoteService, rateNegotiationService.
 */

import express from 'express'
import { callService } from '../services/callService.js'
import { callScriptService } from '../services/callScriptService.js'
import { meetingNoteService } from '../services/meetingNoteService.js'
import { rateNegotiationService } from '../services/rateNegotiationService.js'
import { getAdapterInfo } from '../adapters/index.js'

const router = express.Router()

// ============================================
// CALLS
// ============================================

// GET /api/calls — List calls with filters
router.get('/', async (req, res) => {
    try {
        const { leadId, status, outcome, limit, offset } = req.query
        const result = await callService.getAll(req.user.id, {
            leadId, status, outcome,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        })
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/calls/stats — Call analytics
router.get('/stats', async (req, res) => {
    try {
        const stats = await callService.getStats(req.user.id)
        res.json(stats)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/calls/providers — Active provider info
router.get('/providers', async (req, res) => {
    try {
        res.json(getAdapterInfo())
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/calls/:id — Single call details
router.get('/:id', async (req, res) => {
    try {
        const call = await callService.getById(req.params.id, req.user.id)
        res.json(call)
    } catch (err) {
        res.status(404).json({ error: err.message })
    }
})

// POST /api/calls/initiate — Start outbound call
router.post('/initiate', async (req, res) => {
    try {
        const { leadId, scriptId, assistantConfig } = req.body
        const call = await callService.initiateCall(req.user.id, { leadId, scriptId, assistantConfig })
        res.status(201).json(call)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// PATCH /api/calls/:id — Update call outcome/status
router.patch('/:id', async (req, res) => {
    try {
        const call = await callService.update(req.params.id, req.user.id, req.body)
        res.json(call)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/calls/webhook — Provider webhook (no auth)
router.post('/webhook', async (req, res) => {
    try {
        const result = await callService.handleWebhook(req.body)
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ============================================
// MEETING NOTES
// ============================================

// GET /api/calls/:id/notes — Get notes for a call
router.get('/:id/notes', async (req, res) => {
    try {
        const notes = await meetingNoteService.getByCall(req.params.id, req.user.id)
        res.json(notes)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/calls/:id/notes — Add notes to a call
router.post('/:id/notes', async (req, res) => {
    try {
        const note = await meetingNoteService.create(req.user.id, req.params.id, req.body)
        res.status(201).json(note)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/calls/:id/transcribe — Transcribe + summarize a call
router.post('/:id/transcribe', async (req, res) => {
    try {
        const result = await meetingNoteService.transcribeAndSummarize(req.user.id, req.params.id)
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// ============================================
// RATE NEGOTIATION
// ============================================

// GET /api/calls/:id/negotiate — Get negotiations for a call
router.get('/:id/negotiate', async (req, res) => {
    try {
        const negotiations = await rateNegotiationService.getByCall(req.params.id, req.user.id)
        res.json(negotiations)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/calls/:id/negotiate — AI strategy for negotiation
router.post('/:id/negotiate', async (req, res) => {
    try {
        const { currentRate, targetRate, marketContext } = req.body
        const result = await rateNegotiationService.suggestStrategy(
            req.user.id, req.params.id,
            { currentRate, targetRate, marketContext }
        )
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// PATCH /api/calls/negotiate/:id — Finalize a negotiation
router.patch('/negotiate/:id', async (req, res) => {
    try {
        const { finalRate, status } = req.body
        const result = await rateNegotiationService.finalize(req.params.id, req.user.id, { finalRate, status })
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// ============================================
// CALL SCRIPTS
// ============================================

// GET /api/calls/scripts — List scripts
router.get('/scripts/list', async (req, res) => {
    try {
        const scripts = await callScriptService.getAll(req.user.id)
        res.json(scripts)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/calls/scripts — Create script
router.post('/scripts', async (req, res) => {
    try {
        const script = await callScriptService.create(req.user.id, req.body)
        res.status(201).json(script)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/calls/scripts/generate — AI-generate script
router.post('/scripts/generate', async (req, res) => {
    try {
        const { purpose, industry, rateRange, context } = req.body
        const script = await callScriptService.generate(req.user.id, { purpose, industry, rateRange, context })
        res.status(201).json(script)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// PATCH /api/calls/scripts/:id — Update script
router.patch('/scripts/:id', async (req, res) => {
    try {
        const script = await callScriptService.update(req.params.id, req.user.id, req.body)
        res.json(script)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// DELETE /api/calls/scripts/:id — Delete script
router.delete('/scripts/:id', async (req, res) => {
    try {
        await callScriptService.delete(req.params.id, req.user.id)
        res.json({ success: true })
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

export default router
