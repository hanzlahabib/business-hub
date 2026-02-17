import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import { settingsRepository, emailSettingsRepository, jobSearchPromptRepository } from '../repositories/extraRepositories.js'
import { loadUserKeys, maskApiKeys } from '../services/apiKeyService.js'

const router = express.Router()
router.use(authMiddleware)

// ============ TASK BOARDS ============

router.get('/taskboards', async (req, res) => {
    const data = await prisma.taskBoard.findMany({ where: { userId: req.user.id }, include: { tasks: true } })
    res.json(data)
})

router.get('/taskboards/:id', async (req, res) => {
    try {
        const board = await prisma.taskBoard.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: { tasks: true }
        })
        if (!board) return res.status(404).json({ error: 'Task board not found' })
        res.json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
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
        const existing = await prisma.taskBoard.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task board not found' })
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
        const existing = await prisma.taskBoard.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task board not found' })
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
        const existing = await prisma.taskBoard.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task board not found' })
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
        const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task not found' })
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
        const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task not found' })
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
        const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task not found' })
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
        const existing = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Template not found' })
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
        const existing = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Template not found' })
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
        const existing = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Template not found' })
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
        const existing = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Folder not found' })
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
        const existing = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Folder not found' })
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
        const existing = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Folder not found' })
        await prisma.templateFolder.delete({ where: { id: req.params.id, userId: req.user.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TEMPLATE HISTORY ============

router.get('/templatehistory', async (req, res) => {
    try {
        const where = { userId: req.user.id }
        if (req.query.templateId) where.templateId = req.query.templateId
        const data = await prisma.templateHistory.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.get('/templatehistory/:id', async (req, res) => {
    try {
        const data = await prisma.templateHistory.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        })
        if (!data) return res.status(404).json({ error: 'History entry not found' })
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/templatehistory', async (req, res) => {
    try {
        const entry = await prisma.templateHistory.create({
            data: { ...req.body, userId: req.user.id }
        })
        res.status(201).json(entry)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/templatehistory/:id', async (req, res) => {
    try {
        const existing = await prisma.templateHistory.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'History entry not found' })
        await prisma.templateHistory.delete({ where: { id: req.params.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ TEMPLATE COMMENTS ============

router.get('/templatecomments', async (req, res) => {
    try {
        const where = { userId: req.user.id }
        if (req.query.templateId) where.templateId = req.query.templateId
        const data = await prisma.templateComment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } }
        })
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/templatecomments', async (req, res) => {
    try {
        const comment = await prisma.templateComment.create({
            data: { ...req.body, userId: req.user.id },
            include: { user: { select: { id: true, name: true, email: true } } }
        })
        res.status(201).json(comment)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/templatecomments/:id', async (req, res) => {
    try {
        const existing = await prisma.templateComment.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Comment not found' })
        const comment = await prisma.templateComment.update({
            where: { id: req.params.id },
            data: req.body,
            include: { user: { select: { id: true, name: true, email: true } } }
        })
        res.json(comment)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/templatecomments/:id', async (req, res) => {
    try {
        const existing = await prisma.templateComment.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Comment not found' })
        await prisma.templateComment.delete({ where: { id: req.params.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ EMAIL TEMPLATES ============

router.get('/emailtemplates', async (req, res) => {
    try {
        const data = await prisma.emailTemplate.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        })
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.post('/emailtemplates', async (req, res) => {
    try {
        const template = await prisma.emailTemplate.create({
            data: { ...req.body, userId: req.user.id }
        })
        res.status(201).json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/emailtemplates/:id', async (req, res) => {
    try {
        const existing = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Email template not found' })
        const template = await prisma.emailTemplate.update({
            where: { id: req.params.id },
            data: req.body
        })
        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.delete('/emailtemplates/:id', async (req, res) => {
    try {
        const existing = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Email template not found' })
        await prisma.emailTemplate.delete({ where: { id: req.params.id } })
        res.status(204).send()
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

// ============ SETTINGS ============

router.get('/settings', async (req, res) => {
    const settings = await settingsRepository.findByUserId(req.user.id)
    const config = settings ? { ...settings.config } : {}
    // Mask API keys before sending to client
    if (config.apiKeys) {
        config.apiKeys = maskApiKeys(config.apiKeys)
    }
    res.json(config)
})

router.patch('/settings', async (req, res) => {
    const data = { ...req.body }
    // If client sends masked keys (containing ****), drop them so we don't overwrite real keys
    if (data.apiKeys) {
        const hasRealKeys = Object.values(data.apiKeys).some(v => typeof v === 'string' && !v.includes('****'))
        if (!hasRealKeys) {
            delete data.apiKeys
        }
    }
    const updated = await settingsRepository.upsert(req.user.id, data)
    // Reload this user's keys into per-user cache (invalidates their adapter instances)
    if (data.apiKeys) {
        await loadUserKeys(req.user.id)
    }
    // Mask keys in the response too
    const responseConfig = { ...updated.config }
    if (responseConfig.apiKeys) {
        responseConfig.apiKeys = maskApiKeys(responseConfig.apiKeys)
    }
    res.json(responseConfig)
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
