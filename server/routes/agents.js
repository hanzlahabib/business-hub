/**
 * Agent API Routes
 * 
 * CRUD + lifecycle management for AI calling agents.
 * Includes flow graph endpoint for React Flow visualization.
 */

import express from 'express'
import agentCallingService from '../services/agentCallingService.js'
import { generateFlowGraph, AGENT_STEPS, STEP_COLORS } from '../services/agentStepMachine.js'
import { getClientCount } from '../services/callWebSocket.js'

const router = express.Router()

// GET /api/agents — List all agents
router.get('/', async (req, res) => {
    try {
        const agents = await agentCallingService.getAll(req.user.id)
        res.json(agents)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/agents/flow-config — Get step definitions + colors for React Flow setup
router.get('/flow-config', (req, res) => {
    res.json({
        steps: AGENT_STEPS,
        colors: STEP_COLORS,
        defaultGraph: generateFlowGraph('idle'),
        wsClients: getClientCount()
    })
})

// GET /api/agents/:id — Get single agent + flow graph
router.get('/:id', async (req, res) => {
    try {
        const agent = await agentCallingService.getById(req.params.id, req.user.id)
        res.json(agent)
    } catch (err) {
        res.status(404).json({ error: err.message })
    }
})

// GET /api/agents/:id/flow — Get live flow graph only
router.get('/:id/flow', async (req, res) => {
    try {
        const graph = await agentCallingService.getFlowGraph(req.params.id, req.user.id)
        res.json(graph)
    } catch (err) {
        res.status(404).json({ error: err.message })
    }
})

// POST /api/agents — Spawn a new agent
router.post('/', async (req, res) => {
    try {
        const { name, scriptId, leadIds, config } = req.body
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds array is required' })
        }
        const agent = await agentCallingService.spawn(req.user.id, { name, scriptId, leadIds, config })
        res.status(201).json(agent)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/agents/:id/start — Start agent
router.post('/:id/start', async (req, res) => {
    try {
        const result = await agentCallingService.start(req.params.id, req.user.id)
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/agents/:id/pause — Pause agent
router.post('/:id/pause', async (req, res) => {
    try {
        const result = await agentCallingService.pause(req.params.id, req.user.id)
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/agents/:id/resume — Resume paused agent
router.post('/:id/resume', async (req, res) => {
    try {
        const result = await agentCallingService.resume(req.params.id, req.user.id)
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// POST /api/agents/:id/stop — Stop agent
router.post('/:id/stop', async (req, res) => {
    try {
        const result = await agentCallingService.stop(req.params.id, req.user.id)
        res.json(result)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// DELETE /api/agents/:id — Delete agent
router.delete('/:id', async (req, res) => {
    try {
        await agentCallingService.remove(req.params.id, req.user.id)
        res.json({ success: true })
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

export default router
