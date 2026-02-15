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
function handleClientMessage(ws, msg) {
    const client = clients.get(ws)
    if (!client) return

    switch (msg.type) {
        case 'auth':
            client.userId = msg.userId
            ws.send(JSON.stringify({ type: 'auth:ok' }))
            break

        case 'subscribe:agent':
            client.subscribedAgents.add(msg.agentId)
            ws.send(JSON.stringify({ type: 'subscribed', agentId: msg.agentId }))
            break

        case 'unsubscribe:agent':
            client.subscribedAgents.delete(msg.agentId)
            ws.send(JSON.stringify({ type: 'unsubscribed', agentId: msg.agentId }))
            break

        case 'subscribe:all':
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
 * Broadcast an event to all subscribed clients
 */
export function broadcast(eventType, data) {
    if (!wss) return

    const payload = JSON.stringify({ type: eventType, ...data, timestamp: Date.now() })

    for (const [ws, client] of clients) {
        if (ws.readyState !== ws.OPEN) continue

        // Filter: only send agent events to subscribed clients
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
 * Emit call update
 */
export function emitCallUpdate(callId, update) {
    broadcast('call:update', { callId, ...update })
}

/**
 * Emit agent log line — shows in frontend activity feed
 */
export function emitAgentLog(agentId, message, level = 'info') {
    broadcast('agent:log', { agentId, message, level })
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
    getClientCount
}
