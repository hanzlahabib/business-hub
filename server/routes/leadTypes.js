import express from 'express'
import prisma from '../config/prisma.js'
import logger from '../config/logger.js'

const router = express.Router()

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/lead-types — list all for user
router.get('/', async (req, res) => {
  try {
    const types = await prisma.leadType.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { leads: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(types)
  } catch (error) {
    logger.error('Failed to fetch lead types', { error: error.message })
    res.status(500).json({ error: error.message })
  }
})

// POST /api/lead-types — create
router.post('/', async (req, res) => {
  try {
    const { name, description, boardId, defaultColumns, agentConfig, webhookSecret, autoCallEnabled, autoCallDelay, emailFollowUp } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const slug = slugify(name)

    // Check slug uniqueness for this user
    const existing = await prisma.leadType.findUnique({
      where: { userId_slug: { userId: req.user.id, slug } }
    })
    if (existing) return res.status(409).json({ error: `Lead type with slug "${slug}" already exists` })

    const type = await prisma.leadType.create({
      data: {
        name,
        slug,
        description: description || null,
        boardId: boardId || null,
        defaultColumns: defaultColumns || null,
        agentConfig: agentConfig || null,
        webhookSecret: webhookSecret || null,
        autoCallEnabled: autoCallEnabled !== undefined ? autoCallEnabled : true,
        autoCallDelay: autoCallDelay || 30000,
        emailFollowUp: emailFollowUp !== undefined ? emailFollowUp : true,
        userId: req.user.id
      }
    })

    logger.info('Lead type created', { typeId: type.id, slug: type.slug })
    res.status(201).json(type)
  } catch (error) {
    logger.error('Failed to create lead type', { error: error.message })
    res.status(400).json({ error: error.message })
  }
})

// PATCH /api/lead-types/:id — update
router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.leadType.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })
    if (!existing) return res.status(404).json({ error: 'Lead type not found' })

    const data = { ...req.body }

    // Re-slug if name changed
    if (data.name && data.name !== existing.name) {
      data.slug = slugify(data.name)
      const duplicate = await prisma.leadType.findUnique({
        where: { userId_slug: { userId: req.user.id, slug: data.slug } }
      })
      if (duplicate && duplicate.id !== existing.id) {
        return res.status(409).json({ error: `Slug "${data.slug}" already in use` })
      }
    }

    // Remove fields that shouldn't be updated directly
    delete data.id
    delete data.userId
    delete data.createdAt

    const updated = await prisma.leadType.update({
      where: { id: req.params.id },
      data
    })

    res.json(updated)
  } catch (error) {
    logger.error('Failed to update lead type', { error: error.message })
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/lead-types/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.leadType.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })
    if (!existing) return res.status(404).json({ error: 'Lead type not found' })

    // Unlink leads before deleting
    await prisma.lead.updateMany({
      where: { typeId: req.params.id },
      data: { typeId: null }
    })

    await prisma.leadType.delete({ where: { id: req.params.id } })

    res.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete lead type', { error: error.message })
    res.status(400).json({ error: error.message })
  }
})

// GET /api/lead-types/:id/webhook-url — returns the webhook URL for this type
router.get('/:id/webhook-url', async (req, res) => {
  try {
    const type = await prisma.leadType.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })
    if (!type) return res.status(404).json({ error: 'Lead type not found' })

    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
    const webhookUrl = `${baseUrl}/api/webhooks/leads/${type.slug}`

    res.json({
      webhookUrl,
      slug: type.slug,
      secret: type.webhookSecret || process.env.WEBHOOK_SECRET || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
