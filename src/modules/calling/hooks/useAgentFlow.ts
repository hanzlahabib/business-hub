import { useState, useEffect, useRef, useCallback } from 'react'
import { API_SERVER } from '../../../config/api'

interface AgentLog {
    timestamp: number
    message: string
    level: 'info' | 'warn' | 'error'
    agentId: string
}

interface AgentFlowState {
    nodes: any[]
    edges: any[]
    logs: AgentLog[]
    agentStatus: string | null
    currentLeadName: string | null
    stats: Record<string, number>
    connected: boolean
}

export function useAgentFlow(agentId: string | null, userId: string | null) {
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
    const [state, setState] = useState<AgentFlowState>({
        nodes: [],
        edges: [],
        logs: [],
        agentStatus: null,
        currentLeadName: null,
        stats: {},
        connected: false
    })

    const connect = useCallback(() => {
        if (!userId) return

        // Build WS URL from API server
        const wsUrl = API_SERVER.replace('http', 'ws') + '/ws/calls'
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            setState(prev => ({ ...prev, connected: true }))
            // Authenticate
            ws.send(JSON.stringify({ type: 'auth', userId }))
            // Subscribe to agent if specified
            if (agentId) {
                ws.send(JSON.stringify({ type: 'subscribe:agent', agentId }))
            }
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                handleMessage(msg)
            } catch { /* ignore parse errors */ }
        }

        ws.onclose = () => {
            setState(prev => ({ ...prev, connected: false }))
            // Auto-reconnect after 3s
            reconnectTimeout.current = setTimeout(() => {
                connect()
            }, 3000)
        }

        ws.onerror = () => {
            ws.close()
        }
    }, [userId, agentId])

    const handleMessage = useCallback((msg: any) => {
        switch (msg.type) {
            case 'agent:step-change':
                setState(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(node => ({
                        ...node,
                        data: {
                            ...node.data,
                            isCurrent: node.id === msg.toStep,
                            isActive: node.id === msg.toStep
                        }
                    })),
                    edges: prev.edges.map(edge => ({
                        ...edge,
                        animated: edge.source === msg.toStep,
                        style: {
                            ...edge.style,
                            stroke: edge.source === msg.toStep ? '#60a5fa' : '#475569',
                            strokeWidth: edge.source === msg.toStep ? 3 : 1
                        }
                    }))
                }))
                break

            case 'agent:status':
                setState(prev => ({
                    ...prev,
                    agentStatus: msg.status,
                    stats: msg.stats || prev.stats
                }))
                break

            case 'agent:log':
                setState(prev => ({
                    ...prev,
                    logs: [...prev.logs.slice(-99), {
                        timestamp: msg.timestamp || Date.now(),
                        message: msg.message,
                        level: msg.level || 'info',
                        agentId: msg.agentId
                    }]
                }))
                break

            case 'call:update':
                // Could update call list here if needed
                break
        }
    }, [])

    // Initialize flow graph when agent data is loaded
    const setFlowGraph = useCallback((graph: { nodes: any[]; edges: any[] }) => {
        setState(prev => ({
            ...prev,
            nodes: graph.nodes || [],
            edges: graph.edges || []
        }))
    }, [])

    // Subscribe to a different agent
    const subscribeToAgent = useCallback((newAgentId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'subscribe:agent', agentId: newAgentId }))
        }
    }, [])

    useEffect(() => {
        connect()
        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
            wsRef.current?.close()
        }
    }, [connect])

    return {
        ...state,
        setFlowGraph,
        subscribeToAgent
    }
}

export default useAgentFlow
