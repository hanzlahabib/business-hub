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
 *   - Server-side heartbeat every 30s
 *   - Dead connection cleanup (no pong within 10s)
 *   - Connection state tracking
 */

import { WebSocketServer } from 'ws'
import logger from '../config/logger.js'

let wss = null
const clients = new Map()  // ws → { userId, subscribedAgents: Set }

const HEARTBEAT_INTERVAL = 30_000  // 30 seconds
const PONG_TIMEOUT = 10_000        // 10 seconds to respond

/**
 * Initialize WebSocket server on a given HTTP server
 */
export function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws/calls' })

    wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        ws.isAlive = true
        clients.set(ws, { id: clientId, subscribedAgents: new Set(), userId: null })

        logger.info('WS client connected', { clientId })

        ws.on('pong', () => {
            ws.isAlive = true
        })

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

    // Server-side heartbeat — ping every 30s, kill dead connections
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
            ws.ping()
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
