import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

export interface Agent {
    id: string
    name: string
    status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
    currentStep: string
    currentLeadId?: string | null
    currentLeadName?: string | null
    scriptId?: string | null
    leadQueue: string[]
    completedLeads: Array<{ leadId: string; outcome: string; rate?: number; at: string }>
    config: Record<string, any>
    stats: { totalCalls: number; booked: number; skipped: number; avgDuration?: number }
    startedAt?: string | null
    completedAt?: string | null
    createdAt: string
    calls?: any[]
    flowGraph?: { nodes: any[]; edges: any[] }
}

export interface FlowConfig {
    steps: Record<string, { label: string; next: string[] }>
    colors: Record<string, string>
    defaultGraph: { nodes: any[]; edges: any[] }
    wsClients: number
}

export function useAgents() {
    const { user } = useAuth()
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [flowConfig, setFlowConfig] = useState<FlowConfig | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    }), [user])

    const fetchAgents = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(ENDPOINTS.AGENTS, { headers: headers() })
            const data = await res.json()
            setAgents(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const fetchAgent = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.AGENTS}/${id}`, { headers: headers() })
            const data = await res.json()
            setSelectedAgent(data)
            return data
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    const fetchFlowConfig = useCallback(async () => {
        if (!user) return null
        try {
            const res = await fetch(ENDPOINTS.AGENTS_FLOW_CONFIG, { headers: headers() })
            const data = await res.json()
            setFlowConfig(data)
            return data
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    const spawnAgent = useCallback(async (params: { name?: string; scriptId?: string; leadIds: string[]; config?: any }) => {
        if (!user) return null
        setLoading(true)
        try {
            const res = await fetch(ENDPOINTS.AGENTS, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(params)
            })
            const agent = await res.json()
            if (res.ok) setAgents(prev => [agent, ...prev])
            return agent
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const startAgent = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.AGENTS}/${id}/start`, { method: 'POST', headers: headers() })
            const result = await res.json()
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'running' as const } : a))
            return result
        } catch (err: any) { setError(err.message); return null }
    }, [user, headers])

    const pauseAgent = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.AGENTS}/${id}/pause`, { method: 'POST', headers: headers() })
            const result = await res.json()
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' as const } : a))
            return result
        } catch (err: any) { setError(err.message); return null }
    }, [user, headers])

    const resumeAgent = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.AGENTS}/${id}/resume`, { method: 'POST', headers: headers() })
            const result = await res.json()
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'running' as const } : a))
            return result
        } catch (err: any) { setError(err.message); return null }
    }, [user, headers])

    const stopAgent = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.AGENTS}/${id}/stop`, { method: 'POST', headers: headers() })
            const result = await res.json()
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' as const } : a))
            return result
        } catch (err: any) { setError(err.message); return null }
    }, [user, headers])

    const deleteAgent = useCallback(async (id: string) => {
        if (!user) return false
        try {
            await fetch(`${ENDPOINTS.AGENTS}/${id}`, { method: 'DELETE', headers: headers() })
            setAgents(prev => prev.filter(a => a.id !== id))
            if (selectedAgent?.id === id) setSelectedAgent(null)
            return true
        } catch (err: any) { setError(err.message); return false }
    }, [user, headers, selectedAgent])

    useEffect(() => {
        fetchAgents()
        fetchFlowConfig()
    }, [fetchAgents, fetchFlowConfig])

    return {
        agents, selectedAgent, flowConfig, loading, error,
        setSelectedAgent,
        fetchAgents, fetchAgent, fetchFlowConfig,
        spawnAgent, startAgent, pauseAgent, resumeAgent, stopAgent, deleteAgent
    }
}

export default useAgents
