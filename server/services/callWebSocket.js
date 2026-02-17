/**
 * Call WebSocket Server
 *
 * Real-time event broadcasting for agent actions + call status.
 * Frontend subscribes per agentId to receive step changes for React Flow.
 *
 * Events emitted:
 *   agent:step-change  → { agentId, fromStep, toStep, data }
 *   agent:status       → { agentId, status, stats }
 *   call:update        → { callId, status, duration }
 *   agent:log          → { agentId, message, level, timestamp }
 *
 * Reliability features:
 *   - Application-level JSON heartbeat every 30s
 *   - Dead connection cleanup (no pong within 10s)
 *   - Connection state tracking
 *   - noServer mode to avoid HTTP middleware interference
 */

import { WebSocketServer } from 'ws'
import logger from '../config/logger.js'
import prisma from '../config/prisma.js'

let wss = null
const clients = new Map()  // ws → { userId, subscribedAgents: Set }

const HEARTBEAT_INTERVAL = 30_000  // 30 seconds

/**
 * Initialize WebSocket server on a given HTTP server
 * Uses noServer mode + manual upgrade to avoid middleware interference
 */
export function initWebSocket(server) {
    wss = new WebSocketServer({ noServer: true, perMessageDeflate: false })

    // Handle upgrade manually — bypasses all Express middleware
    server.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url, 'http://localhost').pathname
        if (pathname === '/ws/calls') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req)
            })
        }
        // Don't destroy — other WS servers (twilio-media) also listen for upgrade
    })

    wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        ws.isAlive = true
        clients.set(ws, { id: clientId, subscribedAgents: new Set(), userId: null })

        logger.info('WS client connected', { clientId })

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString())
                handleClientMessage(ws, msg)
            } catch (err) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
            }
        })

        ws.on('close', () => {
            logger.info('WS client disconnected', { clientId })
            clients.delete(ws)
        })

        ws.on('error', (err) => {
            logger.error('WS client error', { clientId, error: err.message })
            clients.delete(ws)
        })

        // Send initial handshake
        ws.send(JSON.stringify({ type: 'connected', clientId }))
    })

    // Application-level heartbeat — send JSON ping, expect JSON pong
    const heartbeat = setInterval(() => {
        if (!wss) return
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                const client = clients.get(ws)
                logger.warn('Terminating dead WS connection', { clientId: client?.id })
                clients.delete(ws)
                return ws.terminate()
            }
            ws.isAlive = false
            // Use application-level JSON ping instead of binary ws.ping()
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
            }
        })
    }, HEARTBEAT_INTERVAL)

    wss.on('close', () => {
        clearInterval(heartbeat)
    })

    logger.info('WebSocket server initialized at /ws/calls')
    return wss
}

/**
 * Handle incoming client messages
 */
async function handleClientMessage(ws, msg) {
    const client = clients.get(ws)
    if (!client) return

    switch (msg.type) {
        case 'auth': {
            // Verify userId exists in the DB before trusting it
            if (!msg.userId) {
                ws.send(JSON.stringify({ type: 'auth:error', message: 'userId required' }))
                break
            }
            try {
                const user = await prisma.user.findUnique({
                    where: { id: msg.userId },
                    select: { id: true }
                })
                if (!user) {
                    ws.send(JSON.stringify({ type: 'auth:error', message: 'Invalid userId' }))
                    logger.warn('WS auth rejected — unknown userId', { clientId: client.id, userId: msg.userId })
                    break
                }
                client.userId = user.id
                ws.send(JSON.stringify({ type: 'auth:ok' }))
            } catch (err) {
                ws.send(JSON.stringify({ type: 'auth:error', message: 'Auth verification failed' }))
                logger.error('WS auth error', { clientId: client.id, error: err.message })
            }
            break
        }

        case 'subscribe:agent':
            if (!client.userId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Authenticate first' }))
                break
            }
            client.subscribedAgents.add(msg.agentId)
            ws.send(JSON.stringify({ type: 'subscribed', agentId: msg.agentId }))
            break

        case 'unsubscribe:agent':
            client.subscribedAgents.delete(msg.agentId)
            ws.send(JSON.stringify({ type: 'unsubscribed', agentId: msg.agentId }))
            break

        case 'subscribe:all':
            if (!client.userId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Authenticate first' }))
                break
            }
            client.subscribedAgents.add('*')
            ws.send(JSON.stringify({ type: 'subscribed', agentId: '*' }))
            break

        case 'pong':
            ws.isAlive = true
            break

        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break
    }
}

/**
 * Broadcast an event to subscribed clients, filtered by userId when available
 */
export function broadcast(eventType, data) {
    if (!wss) return

    const payload = JSON.stringify({ type: eventType, ...data, timestamp: Date.now() })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue

        // userId filter: if the event carries a userId, only send to that user's connections
        if (data.userId && client.userId && client.userId !== data.userId) continue

        // Agent subscription filter
        if (data.agentId) {
            if (client.subscribedAgents.has(data.agentId) || client.subscribedAgents.has('*')) {
                ws.send(payload)
            }
        } else {
            ws.send(payload)
        }
    }
}

/**
 * Emit agent step change — drives React Flow animation
 */
export function emitStepChange(agentId, fromStep, toStep, stepData = {}) {
    broadcast('agent:step-change', {
        agentId,
        fromStep,
        toStep,
        data: stepData
    })
}

/**
 * Emit agent status update
 */
export function emitAgentStatus(agentId, status, stats = {}) {
    broadcast('agent:status', { agentId, status, stats })
}

/**
 * Emit call update (userId optional — filters broadcast when provided)
 */
export function emitCallUpdate(callId, update, userId = null) {
    broadcast('call:update', { callId, ...update, ...(userId && { userId }) })
}

/**
 * Emit agent log line — shows in frontend activity feed
 */
export function emitAgentLog(agentId, message, level = 'info') {
    broadcast('agent:log', { agentId, message, level })
}

/**
 * Emit lead created event to a specific user
 */
export function emitLeadCreated(userId, lead) {
    if (!wss) return

    const payload = JSON.stringify({
        type: 'lead:created',
        lead,
        timestamp: Date.now()
    })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue
        if (client.userId === userId) {
            ws.send(payload)
        }
    }
}

/**
 * Emit lead updated event to a specific user
 */
export function emitLeadUpdated(userId, lead) {
    if (!wss) return

    const payload = JSON.stringify({
        type: 'lead:updated',
        lead,
        timestamp: Date.now()
    })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue
        if (client.userId === userId) {
            ws.send(payload)
        }
    }
}

/**
 * Emit lead status changed event to a specific user
 */
export function emitLeadStatusChanged(userId, data) {
    if (!wss) return

    const payload = JSON.stringify({
        type: 'lead:status-changed',
        ...data,
        timestamp: Date.now()
    })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue
        if (client.userId === userId) {
            ws.send(payload)
        }
    }
}

/**
 * Emit notification to a specific user via WebSocket
 */
export function emitNotification(userId, notification) {
    if (!wss) return

    const payload = JSON.stringify({
        type: 'notification:new',
        notification,
        timestamp: Date.now()
    })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue
        if (client.userId === userId) {
            ws.send(payload)
        }
    }
}

/**
 * Get connected client count
 */
export function getClientCount() {
    return clients.size
}

export default {
    initWebSocket,
    broadcast,
    emitStepChange,
    emitAgentStatus,
    emitCallUpdate,
    emitAgentLog,
    emitNotification,
    emitLeadCreated,
    emitLeadUpdated,
    emitLeadStatusChanged,
    getClientCount
}
