import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendEmail, testConnection } from '../services/emailService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const UPLOADS_DIR = path.join(__dirname, '../uploads')

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
    // Get email settings from JSON Server
    const settingsRes = await fetch('http://localhost:3001/emailSettings')
    const settings = await settingsRes.json()

    if (!settings.provider) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set up email provider in settings.'
      })
    }

    // Prepare attachments
    const attachments = []

    // If cvId is provided, attach the CV
    if (cvId) {
      try {
        const cvRes = await fetch(`http://localhost:3001/cvFiles/${cvId}`)
        const cv = await cvRes.json()

        if (cv.type === 'uploaded' && cv.filename) {
          // Attach local file
          attachments.push({
            filename: cv.name || cv.originalName || 'cv.pdf',
            path: path.join(UPLOADS_DIR, cv.filename)
          })
        }
        // Note: Cloud URLs are included in email body, not as attachments
      } catch (cvError) {
        console.error('Failed to fetch CV:', cvError)
        // Continue without attachment
      }
    }

    // Send the email
    const result = await sendEmail(settings, { to, subject, body, attachments })

    // Log to messages if leadId provided
    if (leadId) {
      const message = {
        id: crypto.randomUUID(),
        leadId,
        type: 'sent',
        channel: 'email',
        subject,
        body,
        templateId: templateId || null,
        status: result.success ? 'sent' : 'failed',
        createdAt: new Date().toISOString()
      }

      await fetch('http://localhost:3001/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

      // Update lead's lastContactedAt
      await fetch(`http://localhost:3001/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastContactedAt: new Date().toISOString(),
          status: 'contacted'
        })
      })
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Test email connection
router.post('/test', async (req, res) => {
  try {
    const settingsRes = await fetch('http://localhost:3001/emailSettings')
    const settings = await settingsRes.json()

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
    // Get lead data
    const leadRes = await fetch(`http://localhost:3001/leads/${leadId}`)
    const lead = await leadRes.json()

    // Get template
    const templateRes = await fetch(`http://localhost:3001/emailTemplates/${templateId}`)
    const template = await templateRes.json()

    // Replace variables in template
    let subject = template.subject
    let body = template.body

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

    // Send the email
    const sendRes = await fetch('http://localhost:3002/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: lead.email,
        subject,
        body,
        leadId,
        templateId
      })
    })

    const result = await sendRes.json()
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
