import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import emailRoutes from './routes/email.js'
import messagesRoutes from './routes/messages.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/email', emailRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// AI Agent endpoint - for Claude/AI automation
app.post('/api/agent/execute', async (req, res) => {
  const { action, params } = req.body

  try {
    switch (action) {
      case 'send_email':
        // Forward to email route
        const emailRes = await fetch(`http://localhost:${PORT}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        })
        const emailData = await emailRes.json()
        res.json({ success: true, action, result: emailData })
        break

      case 'get_leads':
        const leadsRes = await fetch('http://localhost:3001/leads')
        const leads = await leadsRes.json()
        res.json({ success: true, action, result: leads })
        break

      case 'update_lead_status':
        const { leadId, status } = params
        const updateRes = await fetch(`http://localhost:3001/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, lastContactedAt: new Date().toISOString() })
        })
        const updated = await updateRes.json()
        res.json({ success: true, action, result: updated })
        break

      case 'get_leads_by_status':
        const allLeads = await fetch('http://localhost:3001/leads').then(r => r.json())
        const filtered = allLeads.filter(l => l.status === params.status)
        res.json({ success: true, action, result: filtered })
        break

      case 'send_bulk_emails':
        // Send to multiple leads
        const results = []
        for (const lead of params.leads) {
          try {
            const sendRes = await fetch(`http://localhost:${PORT}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: lead.id,
                to: lead.email,
                subject: params.subject,
                body: params.body,
                templateId: params.templateId
              })
            })
            results.push({ leadId: lead.id, success: true })
          } catch (err) {
            results.push({ leadId: lead.id, success: false, error: err.message })
          }
        }
        res.json({ success: true, action, result: results })
        break

      default:
        res.status(400).json({ success: false, error: `Unknown action: ${action}` })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Business Hub API running on http://localhost:${PORT}`)
  console.log(`📧 Email endpoint: POST /api/email/send`)
  console.log(`🤖 AI Agent endpoint: POST /api/agent/execute`)
})
