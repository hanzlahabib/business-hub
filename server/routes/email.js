import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendEmail, testConnection } from '../services/emailService.js'
import authMiddleware from '../middleware/auth.js'
import prisma from '../config/prisma.js'
import { emailSettingsRepository } from '../repositories/extraRepositories.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const UPLOADS_DIR = path.join(__dirname, '../uploads')

// All email routes require authentication
router.use(authMiddleware)

// Helper: get this user's email settings from DB
async function getUserEmailSettings(userId) {
  const record = await emailSettingsRepository.findByUserId(userId)
  if (!record || !record.config) return null
  return record.config
}

// Send email with optional CV attachment
router.post('/send', async (req, res) => {
  const { to, subject, body, leadId, templateId, cvId } = req.body

  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, body'
    })
  }

  try {
    // Get email settings for this specific user from DB
    const settings = await getUserEmailSettings(req.user.id)

    if (!settings || !settings.provider) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set up email provider in settings.'
      })
    }

    // Prepare attachments
    const attachments = []

    // If cvId is provided, look up the CV file in uploads
    if (cvId) {
      try {
        // Try to find a file in the uploads directory matching the cvId
        const fs = await import('fs')
        const uploadFiles = await fs.promises.readdir(UPLOADS_DIR).catch(() => [])
        const cvFile = uploadFiles.find(f => f.includes(cvId))
        if (cvFile) {
          attachments.push({
            filename: cvFile,
            path: path.join(UPLOADS_DIR, cvFile)
          })
        }
      } catch (cvError) {
        console.error('Failed to find CV file:', cvError)
        // Continue without attachment
      }
    }

    // Send the email
    const result = await sendEmail(settings, { to, subject, body, attachments })

    // Log to messages if leadId provided
    if (leadId) {
      try {
        await prisma.message.create({
          data: {
            leadId,
            type: 'sent',
            channel: 'email',
            subject,
            body,
            status: result.success ? 'sent' : 'failed',
            userId: req.user.id
          }
        })

        // Update lead's lastContactedAt
        await prisma.lead.update({
          where: { id: leadId, userId: req.user.id },
          data: {
            lastContactedAt: new Date(),
            status: 'contacted'
          }
        })
      } catch (logError) {
        console.error('Failed to log message/update lead:', logError)
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Email send error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Test email connection
router.post('/test', async (req, res) => {
  try {
    const settings = await getUserEmailSettings(req.user.id)

    if (!settings || !settings.provider) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set up email provider in settings.'
      })
    }

    const result = await testConnection(settings)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Send using template
router.post('/send-template', async (req, res) => {
  const { leadId, templateId } = req.body

  if (!leadId || !templateId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: leadId, templateId'
    })
  }

  try {
    // Get lead data from DB (user-scoped)
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: req.user.id }
    })

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' })
    }

    // Get template from DB (user-scoped)
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId: req.user.id }
    })

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' })
    }

    // Replace variables in template
    let subject = template.subject || template.title || ''
    let body = template.body || template.content || ''

    // Replace common variables
    const variables = {
      company: lead.name,
      contactPerson: lead.contactPerson,
      email: lead.email,
      industry: lead.industry,
      website: lead.website
    }

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value || '')
      body = body.replace(regex, value || '')
    }

    // Get user's email settings
    const settings = await getUserEmailSettings(req.user.id)

    if (!settings || !settings.provider) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set up email provider in settings.'
      })
    }

    // Send the email
    const result = await sendEmail(settings, {
      to: lead.email,
      subject,
      body,
      attachments: []
    })

    // Log message
    if (result.success) {
      try {
        await prisma.message.create({
          data: {
            leadId,
            type: 'sent',
            channel: 'email',
            subject,
            body,
            status: 'sent',
            userId: req.user.id
          }
        })

        await prisma.lead.update({
          where: { id: leadId, userId: req.user.id },
          data: {
            lastContactedAt: new Date(),
            status: 'contacted'
          }
        })
      } catch (logError) {
        console.error('Failed to log message/update lead:', logError)
      }
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
