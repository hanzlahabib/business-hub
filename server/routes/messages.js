import express from 'express'

const router = express.Router()

const JSON_SERVER = 'http://localhost:3001'

// Get all messages for a lead
router.get('/lead/:leadId', async (req, res) => {
  const { leadId } = req.params

  try {
    const response = await fetch(`${JSON_SERVER}/messages?leadId=${leadId}`)
    const messages = await response.json()

    // Sort by date descending
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ success: true, messages })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Log a received message (manual entry)
router.post('/received', async (req, res) => {
  const { leadId, channel, subject, body } = req.body

  if (!leadId || !channel) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: leadId, channel'
    })
  }

  try {
    const message = {
      id: crypto.randomUUID(),
      leadId,
      type: 'received',
      channel,
      subject: subject || '',
      body: body || '',
      templateId: null,
      status: 'received',
      createdAt: new Date().toISOString()
    }

    const response = await fetch(`${JSON_SERVER}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    const savedMessage = await response.json()

    // Update lead status to replied if it was contacted
    const leadRes = await fetch(`${JSON_SERVER}/leads/${leadId}`)
    const lead = await leadRes.json()

    if (lead.status === 'contacted') {
      await fetch(`${JSON_SERVER}/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied' })
      })
    }

    res.json({ success: true, message: savedMessage })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Log a call
router.post('/call', async (req, res) => {
  const { leadId, notes, outcome } = req.body

  if (!leadId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: leadId'
    })
  }

  try {
    const message = {
      id: crypto.randomUUID(),
      leadId,
      type: 'sent',
      channel: 'call',
      subject: `Call - ${outcome || 'No outcome'}`,
      body: notes || '',
      templateId: null,
      status: 'sent',
      createdAt: new Date().toISOString()
    }

    const response = await fetch(`${JSON_SERVER}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    const savedMessage = await response.json()

    // Update lead's lastContactedAt
    await fetch(`${JSON_SERVER}/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastContactedAt: new Date().toISOString() })
    })

    res.json({ success: true, message: savedMessage })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get message stats for a lead
router.get('/stats/:leadId', async (req, res) => {
  const { leadId } = req.params

  try {
    const response = await fetch(`${JSON_SERVER}/messages?leadId=${leadId}`)
    const messages = await response.json()

    const stats = {
      total: messages.length,
      sent: messages.filter(m => m.type === 'sent').length,
      received: messages.filter(m => m.type === 'received').length,
      byChannel: {
        email: messages.filter(m => m.channel === 'email').length,
        whatsapp: messages.filter(m => m.channel === 'whatsapp').length,
        linkedin: messages.filter(m => m.channel === 'linkedin').length,
        call: messages.filter(m => m.channel === 'call').length
      },
      lastContact: messages.length > 0
        ? messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : null
    }

    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
