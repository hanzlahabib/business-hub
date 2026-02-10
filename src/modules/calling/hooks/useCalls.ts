import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

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
    providerCallId?: string
    scriptId?: string
    agentInstanceId?: string
    startedAt?: string
    endedAt?: string
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

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    }), [user])

    const fetchCalls = useCallback(async (filters?: { leadId?: string; status?: string; outcome?: string; limit?: number; offset?: number }) => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (filters?.leadId) params.set('leadId', filters.leadId)
            if (filters?.status) params.set('status', filters.status)
            if (filters?.outcome) params.set('outcome', filters.outcome)
            if (filters?.limit) params.set('limit', String(filters.limit))
            if (filters?.offset) params.set('offset', String(filters.offset))

            const url = `${ENDPOINTS.CALLS}?${params.toString()}`
            const res = await fetch(url, { headers: headers() })
            const data = await res.json()
            setCalls(data.calls || [])
            setTotal(data.total || 0)
            return data
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const fetchCallById = useCallback(async (id: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/${id}`, { headers: headers() })
            return await res.json()
        } catch (err: any) {
            setError(err.message)
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
            if (res.ok) setCalls(prev => [call, ...prev])
            return call
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const updateCall = useCallback(async (id: string, data: Partial<Call>) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/${id}`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify(data)
            })
            const updated = await res.json()
            setCalls(prev => prev.map(c => c.id === id ? updated : c))
            return updated
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    const fetchStats = useCallback(async () => {
        if (!user) return null
        try {
            const res = await fetch(ENDPOINTS.CALL_STATS, { headers: headers() })
            const data = await res.json()
            setStats(data)
            return data
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    // Transcribe a call
    const transcribeCall = useCallback(async (callId: string) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALLS}/${callId}/transcribe`, {
                method: 'POST',
                headers: headers()
            })
            return await res.json()
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    useEffect(() => {
        fetchCalls()
        fetchStats()
    }, [fetchCalls, fetchStats])

    return {
        calls, stats, loading, error, total,
        fetchCalls, fetchCallById, initiateCall, updateCall, fetchStats, transcribeCall
    }
}

export default useCalls
