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
 */

import { WebSocketServer } from 'ws'

let wss = null
const clients = new Map()  // ws → { userId, subscribedAgents: Set }

/**
 * Initialize WebSocket server on a given HTTP server
 */
export function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws/calls' })

    wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        clients.set(ws, { id: clientId, subscribedAgents: new Set(), userId: null })

        console.log(`🔌 WS client connected: ${clientId}`)

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString())
                handleClientMessage(ws, msg)
            } catch (err) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
            }
        })

        ws.on('close', () => {
            console.log(`🔌 WS client disconnected: ${clientId}`)
            clients.delete(ws)
        })

        // Send initial handshake
        ws.send(JSON.stringify({ type: 'connected', clientId }))
    })

    console.log('🔌 WebSocket server initialized at /ws/calls')
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
            // Client sends userId for filtering
            client.userId = msg.userId
            ws.send(JSON.stringify({ type: 'auth:ok' }))
            break

        case 'subscribe:agent':
            // Subscribe to a specific agent's events
            client.subscribedAgents.add(msg.agentId)
            ws.send(JSON.stringify({ type: 'subscribed', agentId: msg.agentId }))
            break

        case 'unsubscribe:agent':
            client.subscribedAgents.delete(msg.agentId)
            ws.send(JSON.stringify({ type: 'unsubscribed', agentId: msg.agentId }))
            break

        case 'subscribe:all':
            // Subscribe to all agents
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
            // Non-agent events go to everyone
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
        data: stepData  // { leadName, callTimer, scriptLine, proposedRate, ... }
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
