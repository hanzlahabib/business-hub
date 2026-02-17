import express from 'express'
import leadService from '../services/leadService.js'
import logger from '../config/logger.js'

const router = express.Router()

const HENDERSON_OWNER_ID = 'cmlfn3x2z0000rfu4i9vn205w'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

/**
 * POST /api/webhooks/leads
 * Receives leads from external sites (e.g. Henderson rank-and-rent)
 * Protected by shared secret in x-webhook-secret header
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

    const lead = await leadService.create(HENDERSON_OWNER_ID, {
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

    // Event emission is handled by leadService.create() — no duplicate needed

    res.status(201).json({ success: true, leadId: lead.id })
  } catch (error) {
    logger.error('Webhook lead creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

export default router
