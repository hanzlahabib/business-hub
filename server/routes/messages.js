import express from 'express'
import messageService from '../services/messageService.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Apply authentication to all message routes
router.use(authMiddleware)

// Get all messages for a lead
router.get('/lead/:leadId', async (req, res) => {
  const { leadId } = req.params
  const userId = req.user.id

  try {
    const messages = await messageService.getMessagesByLead(userId, leadId)
    res.json({ success: true, messages })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Log a received message (manual entry)
router.post('/received', async (req, res) => {
  const { leadId, channel, subject, body } = req.body
  const userId = req.user.id

  if (!leadId || !channel) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: leadId, channel'
    })
  }

  try {
    const message = await messageService.logReceivedMessage(userId, { leadId, channel, subject, body })
    res.json({ success: true, message })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Log a call
router.post('/call', async (req, res) => {
  const { leadId, notes, outcome } = req.body
  const userId = req.user.id

  if (!leadId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: leadId'
    })
  }

  try {
    const message = await messageService.logCall(userId, { leadId, notes, outcome })
    res.json({ success: true, message })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get message stats for a lead
router.get('/stats/:leadId', async (req, res) => {
  const { leadId } = req.params
  const userId = req.user.id

  try {
    const stats = await messageService.getStats(userId, leadId)
    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
