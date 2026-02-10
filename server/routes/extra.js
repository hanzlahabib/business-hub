import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import { settingsRepository, emailSettingsRepository, jobSearchPromptRepository } from '../repositories/extraRepositories.js'

const router = express.Router()
router.use(authMiddleware)

// ============ TASK BOARDS ============

router.get('/taskboards', async (req, res) => {
    const data = await prisma.taskBoard.findMany({ where: { userId: req.user.id }, include: { tasks: true } })
    res.json(data)
})

router.post('/taskboards', async (req, res) => {
    try {
        const board = await prisma.taskBoard.create({
            data: { ...req.body, userId: req.user.id },
            include: { tasks: true }
        })
        res.status(201).json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/taskboards/:id', async (req, res) => {
    try {
        const board = await prisma.taskBoard.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body,
            include: { tasks: true }
        })
        res.json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/taskboards/:id', async (req, res) => {
    try {
        const board = await prisma.taskBoard.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body,
            include: { tasks: true }
        })
        res.json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/taskboards/:id', async (req, res) => {
    try {
        await prisma.taskBoard.delete({ where: { id: req.params.id, userId: req.user.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TASKS ============

router.get('/tasks', async (req, res) => {
    const where = { userId: req.user.id }
    if (req.query.boardId) where.boardId = req.query.boardId
    const data = await prisma.task.findMany({ where, orderBy: { position: 'asc' } })
    res.json(data)
})

router.post('/tasks', async (req, res) => {
    try {
        const task = await prisma.task.create({
            data: { ...req.body, userId: req.user.id }
        })
        res.status(201).json(task)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/tasks/:id', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(task)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/tasks/:id', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(task)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/tasks/:id', async (req, res) => {
    try {
        await prisma.task.delete({ where: { id: req.params.id, userId: req.user.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TEMPLATES ============

router.get('/templates', async (req, res) => {
    const data = await prisma.template.findMany({ where: { userId: req.user.id } })
    res.json(data)
})

router.get('/templates/:id', async (req, res) => {
    const data = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
    if (!data) return res.status(404).json({ error: 'Template not found' })
    res.json(data)
})

router.post('/templates', async (req, res) => {
    try {
        const template = await prisma.template.create({
            data: { ...req.body, userId: req.user.id }
        })
        res.status(201).json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/templates/:id', async (req, res) => {
    try {
        const template = await prisma.template.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/templates/:id', async (req, res) => {
    try {
        const template = await prisma.template.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/templates/:id', async (req, res) => {
    try {
        await prisma.template.delete({ where: { id: req.params.id, userId: req.user.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TEMPLATE FOLDERS ============

router.get('/templatefolders', async (req, res) => {
    const data = await prisma.templateFolder.findMany({ where: { userId: req.user.id } })
    res.json(data)
})

router.get('/templatefolders/:id', async (req, res) => {
    const data = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
    if (!data) return res.status(404).json({ error: 'Folder not found' })
    res.json(data)
})

router.post('/templatefolders', async (req, res) => {
    try {
        const folder = await prisma.templateFolder.create({
            data: { ...req.body, userId: req.user.id }
        })
        res.status(201).json(folder)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/templatefolders/:id', async (req, res) => {
    try {
        const folder = await prisma.templateFolder.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(folder)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/templatefolders/:id', async (req, res) => {
    try {
        const folder = await prisma.templateFolder.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        })
        res.json(folder)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/templatefolders/:id', async (req, res) => {
    try {
        await prisma.templateFolder.delete({ where: { id: req.params.id, userId: req.user.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TEMPLATE HISTORY ============

router.get('/templatehistory', async (req, res) => {
    try {
        // Template history is stored in JSON - for now return empty array
        // TODO: implement templateHistory model
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/templatehistory', async (req, res) => {
    // TODO: implement
    res.status(201).json(req.body)
})

// ============ TEMPLATE COMMENTS ============

router.get('/templatecomments', async (req, res) => {
    try {
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/templatecomments', async (req, res) => {
    res.status(201).json(req.body)
})

// ============ EMAIL TEMPLATES ============

router.get('/emailtemplates', async (req, res) => {
    try {
        // Email templates are separate from the template module
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// ============ SETTINGS ============

router.get('/settings', async (req, res) => {
    const settings = await settingsRepository.findByUserId(req.user.id)
    res.json(settings ? settings.config : {})
})

router.patch('/settings', async (req, res) => {
    const updated = await settingsRepository.upsert(req.user.id, req.body)
    res.json(updated.config)
})

// ============ EMAIL SETTINGS ============

router.get('/emailsettings', async (req, res) => {
    const settings = await emailSettingsRepository.findByUserId(req.user.id)
    res.json(settings ? settings.config : {})
})

router.put('/emailsettings', async (req, res) => {
    const updated = await emailSettingsRepository.upsert(req.user.id, req.body)
    res.json(updated.config)
})

// ============ JOB SEARCH PROMPTS ============

router.get('/jobsearchprompts', async (req, res) => {
    const data = await jobSearchPromptRepository.findAllByUserId(req.user.id)
    res.json(data)
})

// ============ JOB OUTREACH HISTORY ============

router.get('/joboutreachhistory', async (req, res) => {
    try {
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/joboutreachhistory', async (req, res) => {
    res.status(201).json(req.body)
})

// ============ JOB TEMPLATES ============

router.get('/jobtemplates', async (req, res) => {
    try {
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// ============ CV FILES ============

router.get('/cvfiles', async (req, res) => {
    try {
        res.json([])
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// ============ USER PROFILE ============

router.get('/userprofile', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } })
        res.json(user || {})
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.put('/userprofile', async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: req.body
        })
        res.json(user)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router
