import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
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
import twilioWebhookRoutes from './routes/twilioWebhooks.js'
import vapiWebhookRoutes from './routes/vapiWebhooks.js'
import campaignRoutes from './routes/campaignRoutes.js'
import webhookRoutes from './routes/webhooks.js'
import leadTypeRoutes from './routes/leadTypes.js'
import notificationRoutes from './routes/notifications.js'
import dashboardRoutes from './routes/dashboard.js'
import authMiddleware from './middleware/auth.js'
import { validateTwilioRequest } from './middleware/twilioValidation.js'
import prisma from './config/prisma.js'
import { initWebSocket, getClientCount, emitLeadCreated, emitLeadUpdated, emitLeadStatusChanged, emitNotification } from './services/callWebSocket.js'
import { initMediaStreamWebSocket } from './services/twilioMediaStream.js'
import agentCallingService from './services/agentCallingService.js'
import callService from './services/callService.js'
import callSchedulerService from './services/callSchedulerService.js'
import { loadAllUserKeys } from './services/apiKeyService.js'
import { globalErrorHandler } from './middleware/errorHandler.js'
import { rateLimiter, authLimiter } from './middleware/rateLimiter.js'
import { sanitizeInput } from './middleware/sanitize.js'
import { requestLogger } from './middleware/requestLogger.js'
import logger from './config/logger.js'
import automationService from './services/automationService.js'
import intelligenceService from './services/intelligenceService.js'
import intelligenceRoutes from './routes/intelligence.js'
import proposalRoutes from './routes/proposals.js'
import automationRoutes from './routes/automation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Validate environment variables before proceeding
import { validateEnv } from './config/validateEnv.js'
validateEnv()

const app = express()
const PORT = process.env.PORT || 3002

// Security Middleware
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5175']

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://ui-avatars.com'],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
    }
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}))
app.use(express.json())
app.use(sanitizeInput())
app.use(requestLogger())
app.use('/api', rateLimiter())

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Swagger UI — serve OpenAPI docs
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import YAML from 'yaml'
const openapiSpec = YAML.parse(readFileSync(path.join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf8'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Business Hub API Docs',
}))

// Health check — enhanced with diagnostics
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown'
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch {
    dbStatus = 'disconnected'
  }

  const mem = process.memoryUsage()
  res.json({
    status: 'ok',
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heap: `${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    },
    wsClients: typeof getClientCount === 'function' ? getClientCount() : 0,
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authLimiter(), authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/contents', contentRoutes)
app.use('/api/resources', extraRoutes)
app.use('/api/skillmastery', skillMasteryRoutes)
app.use('/api/scraper', scraperRoutes)
app.use('/api/outreach', outreachRoutes)
app.use('/api/calls/twilio', validateTwilioRequest(), twilioWebhookRoutes)  // Twilio webhooks (validation optional via env)
app.use('/api/calls/vapi', vapiWebhookRoutes)  // Vapi webhooks (no auth — Vapi can't send our headers)
app.use('/api/webhooks', webhookRoutes)  // External webhooks (no auth — server-to-server)
app.use('/api/lead-types', authMiddleware, leadTypeRoutes)
app.use('/api/calls', authMiddleware, callRoutes)
app.use('/api/agents', authMiddleware, agentRoutes)
app.use('/api/campaigns', authMiddleware, campaignRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/automation', automationRoutes)
app.use('/api/intelligence', intelligenceRoutes)
app.use('/api/proposals', proposalRoutes)

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
import authService from './services/authService.js'

app.post('/api/agent/execute', authMiddleware, async (req, res) => {
  const { action, params } = req.body
  const userId = req.user.id
  // Generate internal JWT for server-to-server calls
  const internalToken = authService.generateToken(userId)
  const internalHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${internalToken}` }

  try {
    switch (action) {
      case 'send_email':
        const emailRes = await fetch(`http://localhost:${PORT}/api/email/send`, {
          method: 'POST',
          headers: internalHeaders,
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
              headers: internalHeaders,
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

// Initialize WebSocket servers
initWebSocket(server)
initMediaStreamWebSocket(server)

// Load all users' API keys from DB into per-user cache (no process.env mutation)
loadAllUserKeys().catch(err => logger.error('API key loading failed', { error: err.message }))

// Initialize automation engine — listens on event bus
automationService.init()
intelligenceService.init()

// Wire EventBus → WebSocket for real-time lead updates
import eventBus from './services/eventBus.js'

eventBus.on('lead:created', (event) => {
  const { userId, data } = event
  if (userId && data?.lead) {
    emitLeadCreated(userId, data.lead)
  }
})

eventBus.on('lead:updated', (event) => {
  const { userId, data } = event
  if (userId && data?.lead) {
    emitLeadUpdated(userId, data.lead)
  }
})

eventBus.on('lead:status-changed', (event) => {
  const { userId, data } = event
  if (userId) {
    emitLeadStatusChanged(userId, data)
  }
})

// Reset zombie agents from previous server run
agentCallingService.init().catch(err => logger.error('Agent init failed', { error: err.message }))
callSchedulerService.init()

// Global error handler — catches all unhandled errors from routes
app.use(globalErrorHandler)

server.listen(PORT, () => {
  logger.info(`🚀 Business Hub API running on http://localhost:${PORT}`)
  logger.info('Routes: /api/auth, /api/leads, /api/jobs, /api/calls, /api/agents, /api/campaigns')
  logger.info(`WebSocket: ws://localhost:${PORT}/ws/calls | ws://localhost:${PORT}/ws/twilio-media`)
})
