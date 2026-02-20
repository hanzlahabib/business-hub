import express from 'express'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import { settingsRepository, emailSettingsRepository, jobSearchPromptRepository } from '../repositories/extraRepositories.js'
import { loadUserKeys, maskApiKeys } from '../services/apiKeyService.js'
import { validate, createTaskBoardSchema, updateTaskBoardSchema, createTaskSchema, updateTaskSchema, createTemplateSchema, updateTemplateSchema, createTemplateFolderSchema, createEmailTemplateSchema } from '../middleware/validate.js'

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

router.post('/taskboards', validate(createTaskBoardSchema), async (req, res) => {
    try {
        const { name, columns, leadId } = req.body
        const board = await prisma.taskBoard.create({
            data: { name, columns, leadId, userId: req.user.id },
            include: { tasks: true }
        })
        res.status(201).json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/taskboards/:id', validate(updateTaskBoardSchema), async (req, res) => {
    try {
        const existing = await prisma.taskBoard.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task board not found' })
        const { name, columns, leadId } = req.body
        const board = await prisma.taskBoard.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, columns, leadId },
            include: { tasks: true }
        })
        res.json(board)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/taskboards/:id', validate(updateTaskBoardSchema), async (req, res) => {
    try {
        const existing = await prisma.taskBoard.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task board not found' })
        const { name, columns, leadId } = req.body
        const board = await prisma.taskBoard.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, columns, leadId },
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

router.post('/tasks', validate(createTaskSchema), async (req, res) => {
    try {
        const { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId } = req.body
        const task = await prisma.task.create({
            data: { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId, userId: req.user.id }
        })
        res.status(201).json(task)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/tasks/:id', validate(updateTaskSchema), async (req, res) => {
    try {
        const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task not found' })
        const { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId } = req.body
        const task = await prisma.task.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId }
        })
        res.json(task)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/tasks/:id', validate(updateTaskSchema), async (req, res) => {
    try {
        const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Task not found' })
        const { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId } = req.body
        const task = await prisma.task.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { title, description, status, priority, columnId, position, assignee, leadId, subtasks, tags, dueDate, boardId }
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

router.post('/templates', validate(createTemplateSchema), async (req, res) => {
    try {
        const { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId } = req.body
        const template = await prisma.template.create({
            data: { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId, userId: req.user.id }
        })
        res.status(201).json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/templates/:id', validate(updateTemplateSchema), async (req, res) => {
    try {
        const existing = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Template not found' })
        const { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId } = req.body
        const template = await prisma.template.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId }
        })
        res.json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/templates/:id', validate(updateTemplateSchema), async (req, res) => {
    try {
        const existing = await prisma.template.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Template not found' })
        const { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId } = req.body
        const template = await prisma.template.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, category, description, icon, coverImage, content, rawMarkdown, subject, status, tags, variables, isFavorite, isPinned, isLocked, folderId }
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

router.post('/templatefolders', validate(createTemplateFolderSchema), async (req, res) => {
    try {
        const { name, icon, color } = req.body
        const folder = await prisma.templateFolder.create({
            data: { name, icon, color, userId: req.user.id }
        })
        res.status(201).json(folder)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/templatefolders/:id', validate(createTemplateFolderSchema), async (req, res) => {
    try {
        const existing = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Folder not found' })
        const { name, icon, color } = req.body
        const folder = await prisma.templateFolder.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, icon, color }
        })
        res.json(folder)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.put('/templatefolders/:id', validate(createTemplateFolderSchema), async (req, res) => {
    try {
        const existing = await prisma.templateFolder.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Folder not found' })
        const { name, icon, color } = req.body
        const folder = await prisma.templateFolder.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name, icon, color }
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
        const { templateId, action, details, version, content, rawMarkdown, changeSummary, changeType, changedBy } = req.body
        const entry = await prisma.templateHistory.create({
            data: { templateId, action, details, version, content, rawMarkdown, changeSummary, changeType, changedBy, userId: req.user.id }
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
        const { templateId, content, parentId, reactions, mentions } = req.body
        const comment = await prisma.templateComment.create({
            data: { templateId, content, parentId, reactions, mentions, userId: req.user.id },
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
        const { content, parentId, reactions, mentions } = req.body
        const comment = await prisma.templateComment.update({
            where: { id: req.params.id },
            data: { content, parentId, reactions, mentions },
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

router.post('/emailtemplates', validate(createEmailTemplateSchema), async (req, res) => {
    try {
        const { name, subject, body } = req.body
        const template = await prisma.emailTemplate.create({
            data: { name, subject, body, userId: req.user.id }
        })
        res.status(201).json(template)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

router.patch('/emailtemplates/:id', validate(createEmailTemplateSchema), async (req, res) => {
    try {
        const existing = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, userId: req.user.id } })
        if (!existing) return res.status(404).json({ error: 'Email template not found' })
        const { name, subject, body } = req.body
        const template = await prisma.emailTemplate.update({
            where: { id: req.params.id },
            data: { name, subject, body }
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

export default router
