import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs/promises'
import http from 'http'
import { fileURLToPath } from 'url'

// Legacy Routes
import emailRoutes from './routes/email.js'
import messagesRoutes from './routes/messages.js'
import uploadRoutes from './routes/upload.js'

// New Prisma Routes
import authRoutes from './routes/auth.js'
import leadRoutes from './routes/leads.js'
import jobRoutes from './routes/jobs.js'
import contentRoutes from './routes/contents.js'
import extraRoutes from './routes/extra.js'
import skillMasteryRoutes from './routes/skillMastery.js'
import scraperRoutes from './routes/scraper.js'
import outreachRoutes from './routes/outreach.js'
import callRoutes from './routes/calls.js'
import agentRoutes from './routes/agents.js'
import authMiddleware from './middleware/auth.js'
import prisma from './config/prisma.js'
import { initWebSocket } from './services/callWebSocket.js'
import agentCallingService from './services/agentCallingService.js'
import callService from './services/callService.js'

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

// Health check — MUST be before route registration
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'prisma/postgresql',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/contents', contentRoutes)
app.use('/api/resources', extraRoutes)
app.use('/api/skillmastery', skillMasteryRoutes)
app.use('/api/scraper', scraperRoutes)
app.use('/api/outreach', outreachRoutes)
app.use('/api/calls', authMiddleware, callRoutes)
app.use('/api/agents', authMiddleware, agentRoutes)

// Legacy / Support Routes
app.use('/api/email', emailRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api', uploadRoutes)

// Read file content endpoint - for markdown viewer
app.get('/api/file/read', async (req, res) => {
  const { path: filePath } = req.query

  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Path is required' })
  }

  // Security: Only allow reading .md files from specific directories
  const allowedPaths = [
    '/home/hanzla/development/business/_bmad-output',
    '/home/hanzla/development/business/docs',
    '/home/hanzla/development/teaching'
  ]

  const isAllowed = allowedPaths.some(allowed => filePath.startsWith(allowed))
  if (!isAllowed) {
    return res.status(403).json({ success: false, error: 'Access denied to this path' })
  }

  if (!filePath.endsWith('.md')) {
    return res.status(400).json({ success: false, error: 'Only .md files are allowed' })
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    res.json({ success: true, content, path: filePath })
  } catch (error) {
    res.status(404).json({ success: false, error: `File not found: ${error.message}` })
  }
})

// Search MD file contents endpoint
app.post('/api/file/search', async (req, res) => {
  const { paths, query } = req.body

  if (!query || !paths || !Array.isArray(paths)) {
    return res.status(400).json({ success: false, error: 'Query and paths array required' })
  }

  const allowedPaths = [
    '/home/hanzla/development/business/_bmad-output',
    '/home/hanzla/development/business/docs',
    '/home/hanzla/development/teaching'
  ]

  const results = []
  const searchQuery = query.toLowerCase()

  for (const filePath of paths) {
    // Skip non-md files and clipboard paths
    if (!filePath || !filePath.endsWith('.md') || filePath.startsWith('clipboard://')) {
      continue
    }

    // Security check
    const isAllowed = allowedPaths.some(allowed => filePath.startsWith(allowed))
    if (!isAllowed) continue

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const contentLower = content.toLowerCase()

      if (contentLower.includes(searchQuery)) {
        // Find matching lines with context
        const lines = content.split('\n')
        const matches = []

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchQuery)) {
            matches.push({
              lineNumber: index + 1,
              text: line.trim().substring(0, 200),
              context: lines.slice(Math.max(0, index - 1), index + 2).join('\n').substring(0, 300)
            })
          }
        })

        results.push({
          path: filePath,
          fileName: filePath.split('/').pop(),
          matchCount: matches.length,
          matches: matches.slice(0, 5) // Limit to first 5 matches per file
        })
      }
    } catch (error) {
      // Skip files that can't be read
      continue
    }
  }

  res.json({ success: true, results, query })
})

// AI Agent endpoint - for automation

app.post('/api/agent/execute', authMiddleware, async (req, res) => {
  const { action, params } = req.body
  const userId = req.user.id

  try {
    switch (action) {
      case 'send_email':
        const emailRes = await fetch(`http://localhost:${PORT}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify(params)
        })
        const emailData = await emailRes.json()
        res.json({ success: true, action, result: emailData })
        break

      case 'get_leads':
        const leads = await prisma.lead.findMany({ where: { userId } })
        res.json({ success: true, action, result: leads })
        break

      case 'update_lead_status':
        const { leadId, status } = params
        const updated = await prisma.lead.update({
          where: { id: leadId, userId },
          data: { status, lastContactedAt: new Date() }
        })
        res.json({ success: true, action, result: updated })
        break

      case 'get_leads_by_status':
        const filtered = await prisma.lead.findMany({
          where: { userId, status: params.status }
        })
        res.json({ success: true, action, result: filtered })
        break

      case 'send_bulk_emails':
        const results = []
        for (const lead of params.leads) {
          try {
            await fetch(`http://localhost:${PORT}/api/email/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
              },
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

      // ===== AI Calling Actions =====
      case 'initiate_call': {
        const call = await callService.initiateCall(userId, params)
        res.json({ success: true, action, result: call })
        break
      }

      case 'get_call_history': {
        const callHistory = await callService.getAll(userId, params)
        res.json({ success: true, action, result: callHistory })
        break
      }

      case 'get_call_stats': {
        const callStats = await callService.getStats(userId)
        res.json({ success: true, action, result: callStats })
        break
      }

      case 'spawn_agent': {
        const agent = await agentCallingService.spawn(userId, params)
        res.json({ success: true, action, result: agent })
        break
      }

      case 'start_agent': {
        const startResult = await agentCallingService.start(params.agentId, userId)
        res.json({ success: true, action, result: startResult })
        break
      }

      case 'get_agent_status': {
        const agentStatus = await agentCallingService.getById(params.agentId, userId)
        res.json({ success: true, action, result: agentStatus })
        break
      }

      default:
        res.status(400).json({ success: false, error: `Unknown action: ${action}` })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Create HTTP server for WebSocket support
const server = http.createServer(app)

// Initialize WebSocket
initWebSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Business Hub API running on http://localhost:${PORT}`)
  console.log(`📧 Email endpoint: POST /api/email/send`)
  console.log(`🤖 AI Agent endpoint: POST /api/agent/execute`)
  console.log(`📞 AI Calling API: /api/calls`)
  console.log(`🤖 Agent API: /api/agents`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/calls`)
})
