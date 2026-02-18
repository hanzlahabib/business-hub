import { useState, useCallback, useEffect, useRef } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getJsonAuthHeaders, fetchGet, fetchMutation } from '../../../utils/authHeaders'

export interface Call {
    id: string
    leadId: string
    direction: string
    status: string
    outcome?: string
    sentiment?: string
    duration?: number
    summary?: string
    transcription?: string
    recordingUrl?: string
    errorReason?: string
    failedAt?: string
    providerCallId?: string
    scriptId?: string
    agentInstanceId?: string
    startedAt?: string
    endedAt?: string
    scheduledAt?: string
    createdAt: string
    lead?: {
        id: string
        name: string
        company?: string
        phone?: string
        email?: string
    }
    script?: CallScript | null
    meetingNotes?: any[]
    negotiations?: any[]
}

export interface AssistantConfig {
    // Business context
    businessName?: string
    businessWebsite?: string
    businessLocation?: string
    // Agent persona
    agentName?: string
    agentRole?: string
    conversationStyle?: string
    // Voice settings
    voiceId?: string            // ElevenLabs preset name ("adam","rachel") or raw ID
    voiceStability?: number     // 0-1
    voiceSimilarity?: number    // 0-1
    // LLM settings
    llmModel?: string           // gpt-4o-mini, gpt-4o, etc.
    llmProvider?: string        // openai
    temperature?: number        // 0-1
    // Call settings
    maxDuration?: number        // seconds
    silenceTimeout?: number     // seconds
    endCallPhrases?: string[]
    endCallMessage?: string
    // Custom prompt (overrides auto-generated)
    customSystemPrompt?: string
}

export interface CallScript {
    id: string
    name: string
    purpose?: string
    industry?: string
    openingLine?: string
    talkingPoints?: Array<{ topic: string; script: string }>
    objectionHandlers?: Array<{ objection: string; response: string }>
    closingStrategy?: string
    rateRange?: { min: number; max: number; target: number; currency?: string }
    assistantConfig?: AssistantConfig
    usageCount: number
    createdAt: string
    updatedAt: string
}

export interface CallStats {
    total: number
    today: number
    booked: number
    followUp: number
    notInterested: number
    noAnswer: number
    avgDuration: number
    conversionRate: number
}

export function useCalls() {
    const { user } = useAuth()
    const [calls, setCalls] = useState<Call[]>([])
    const [stats, setStats] = useState<CallStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [total, setTotal] = useState(0)

    const headers = useCallback(() => getJsonAuthHeaders(), [])

    const fetchCalls = useCallback(async (filters?: { leadId?: string; status?: string; outcome?: string; limit?: number; offset?: number; silent?: boolean }) => {
        if (!user) return
        if (!filters?.silent) {
            setLoading(true)
            setError(null)
        }
        try {
            const params = new URLSearchParams()
            if (filters?.leadId) params.set('leadId', filters.leadId)
            if (filters?.status) params.set('status', filters.status)
            if (filters?.outcome) params.set('outcome', filters.outcome)
            if (filters?.limit) params.set('limit', String(filters.limit))
            if (filters?.offset) params.set('offset', String(filters.offset))

            const url = `${ENDPOINTS.CALLS}?${params.toString()}`
            const data = await fetchGet(url)
            setCalls(data.calls || [])
            setTotal(data.total || 0)
            return data
        } catch (err: any) {
            if (!filters?.silent) setError(err.message)
        } finally {
            if (!filters?.silent) setLoading(false)
        }
    }, [user, headers])

    const fetchCallById = useCallback(async (id: string) => {
        if (!user) return null
        try {
            return await fetchGet(`${ENDPOINTS.CALLS}/${id}`)
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    const fetchStats = useCallback(async (options?: { silent?: boolean }) => {
        if (!user) return null
        try {
            const data = await fetchGet(ENDPOINTS.CALL_STATS)
            setStats(data)
            return data
        } catch (err: any) {
            if (!options?.silent) setError(err.message)
            return null
        }
    }, [user, headers])

    const initiateCall = useCallback(async (data: { leadId: string; scriptId?: string; assistantConfig?: any }) => {
        if (!user) return null
        setLoading(true)
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/initiate`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(data)
            })
            const call = await res.json()
            if (res.ok) {
                await fetchCalls()
                await fetchStats()
                return call
            }
            // Return error object so caller can display specific message
            return { error: call.error || 'Failed to initiate call' }
        } catch (err: any) {
            setError(err.message)
            return { error: err.message }
        } finally {
            setLoading(false)
        }
    }, [user, headers, fetchCalls, fetchStats])

    const updateCall = useCallback(async (id: string, data: Partial<Call>) => {
        if (!user) return null
        try {
            const updated = await fetchMutation(`${ENDPOINTS.CALLS}/${id}`, 'PATCH', data)
            setCalls(prev => prev.map(c => c.id === id ? updated : c))
            return updated
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    // Transcribe a call
    const transcribeCall = useCallback(async (callId: string) => {
        if (!user) return null
        try {
            return await fetchMutation(`${ENDPOINTS.CALLS}/${callId}/transcribe`, 'POST')
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    // Cancel a queued/ringing/scheduled call
    const cancelCall = useCallback(async (callId: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/${callId}/cancel`, {
                method: 'POST',
                headers: headers()
            })
            const result = await res.json()
            if (!res.ok) return { error: result.error || 'Failed to cancel call' }
            await fetchCalls({ silent: true })
            await fetchStats({ silent: true })
            return result
        } catch (err: any) {
            setError(err.message)
            return { error: err.message }
        }
    }, [user, headers, fetchCalls, fetchStats])

    // Force-terminate a live in-progress call
    const hangupCall = useCallback(async (callId: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/${callId}/hangup`, {
                method: 'POST',
                headers: headers()
            })
            const result = await res.json()
            if (!res.ok) return { error: result.error || 'Failed to hangup call' }
            await fetchCalls({ silent: true })
            await fetchStats({ silent: true })
            return result
        } catch (err: any) {
            setError(err.message)
            return { error: err.message }
        }
    }, [user, headers, fetchCalls, fetchStats])

    // Schedule a call for a future date/time
    const scheduleCall = useCallback(async (data: { leadId: string; scriptId?: string; scheduledAt: string; assistantConfig?: any }) => {
        if (!user) return null
        setLoading(true)
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/schedule`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(data)
            })
            const call = await res.json()
            if (res.ok) {
                await fetchCalls()
                await fetchStats()
                return call
            }
            return { error: call.error || 'Failed to schedule call' }
        } catch (err: any) {
            setError(err.message)
            return { error: err.message }
        } finally {
            setLoading(false)
        }
    }, [user, headers, fetchCalls, fetchStats])

    useEffect(() => {
        fetchCalls()
        fetchStats()
    }, [fetchCalls, fetchStats])

    // Track active calls in a ref to avoid re-creating the polling interval
    const hasActiveCallsRef = useRef(false)
    useEffect(() => {
        hasActiveCallsRef.current = calls.some(c =>
            c.status === 'queued' || c.status === 'ringing' || c.status === 'in-progress' || c.status === 'scheduled'
        )
    }, [calls])

    // Poll for updates when there are active calls — silent to avoid UI flicker
    useEffect(() => {
        const interval = setInterval(() => {
            if (!hasActiveCallsRef.current) return
            fetchCalls({ silent: true })
            fetchStats({ silent: true })
        }, 10000) // Poll every 10s while calls are active

        return () => clearInterval(interval)
    }, [fetchCalls, fetchStats])

    return {
        calls, stats, loading, error, total,
        fetchCalls, fetchCallById, initiateCall, updateCall, fetchStats, transcribeCall,
        cancelCall, hangupCall, scheduleCall
    }
}

export default useCalls
