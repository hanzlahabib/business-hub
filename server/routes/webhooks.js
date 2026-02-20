import express from 'express'
import leadService from '../services/leadService.js'
import prisma from '../config/prisma.js'
import logger from '../config/logger.js'

const router = express.Router()

const DEFAULT_WEBHOOK_OWNER_ID = process.env.DEFAULT_WEBHOOK_OWNER_ID
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

/**
 * POST /api/webhooks/leads/:slug
 * Type-routed webhook — looks up LeadType by slug, routes to correct user/board
 */
router.post('/leads/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    // Look up LeadType by slug
    const leadType = await prisma.leadType.findFirst({
      where: { slug }
    })

    if (!leadType) {
      logger.warn('Webhook rejected: unknown slug', { slug, ip: req.ip })
      return res.status(404).json({ error: 'Unknown lead type' })
    }

    // Validate secret — per-type secret or global fallback
    const expectedSecret = leadType.webhookSecret || WEBHOOK_SECRET
    const secret = req.headers['x-webhook-secret']
    if (expectedSecret && secret !== expectedSecret) {
      logger.warn('Webhook rejected: invalid secret', { slug, ip: req.ip })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, email, phone, service, message, source, siteSlug } = req.body

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' })
    }

    // Build lead data with type info
    const leadData = {
      name,
      email: email || null,
      phone,
      source: siteSlug ? `form:${siteSlug}` : (source || `form:${slug}`),
      status: 'new',
      typeId: leadType.id,
      linkedBoardId: leadType.boardId || null,
      notes: [
        service ? `Service: ${service}` : null,
        message ? `Message: ${message}` : null,
        siteSlug ? `Site: ${siteSlug}` : null,
        `Lead Type: ${leadType.name}`,
      ].filter(Boolean).join('\n'),
    }

    // If type has boardId, set it. If no boardId but defaultColumns, auto-create board
    if (!leadType.boardId && leadType.defaultColumns) {
      const board = await prisma.taskBoard.create({
        data: {
          name: `${leadType.name} — ${name}`,
          columns: leadType.defaultColumns,
          leadId: null,
          userId: leadType.userId
        }
      })
      leadData.linkedBoardId = board.id
    }

    const lead = await leadService.create(leadType.userId, leadData)

    logger.info('Webhook lead created (typed)', { leadId: lead.id, name, slug, typeId: leadType.id })

    res.status(201).json({ success: true, leadId: lead.id })
  } catch (error) {
    logger.error('Webhook lead creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

/**
 * POST /api/webhooks/leads
 * Legacy endpoint — backward compatible, uses hardcoded owner ID
 */
router.post('/leads', async (req, res) => {
  try {
    // Validate shared secret
    const secret = req.headers['x-webhook-secret']
    if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
      logger.warn('Webhook rejected: invalid secret', { ip: req.ip })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, email, phone, service, message, source, siteSlug } = req.body

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' })
    }

    if (!DEFAULT_WEBHOOK_OWNER_ID) {
      logger.error('DEFAULT_WEBHOOK_OWNER_ID not configured — cannot process legacy webhook')
      return res.status(500).json({ error: 'Webhook owner not configured' })
    }

    const lead = await leadService.create(DEFAULT_WEBHOOK_OWNER_ID, {
      name,
      email: email || null,
      phone,
      source: siteSlug ? `form:${siteSlug}` : (source || 'form'),
      status: 'new',
      notes: [
        service ? `Service: ${service}` : null,
        message ? `Message: ${message}` : null,
        siteSlug ? `Site: ${siteSlug}` : null,
      ].filter(Boolean).join('\n'),
    })

    logger.info('Webhook lead created', { leadId: lead.id, name, siteSlug })

    res.status(201).json({ success: true, leadId: lead.id })
  } catch (error) {
    logger.error('Webhook lead creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

export default router
