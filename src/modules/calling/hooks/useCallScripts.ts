import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import type { CallScript } from './useCalls'

export function useCallScripts() {
    const { user } = useAuth()
    const [scripts, setScripts] = useState<CallScript[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    }), [user])

    const fetchScripts = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(ENDPOINTS.CALL_SCRIPTS_LIST, { headers: headers() })
            const data = await res.json()
            setScripts(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const createScript = useCallback(async (data: Partial<CallScript>) => {
        if (!user) return null
        setLoading(true)
        try {
            const res = await fetch(ENDPOINTS.CALL_SCRIPTS, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(data)
            })
            const script = await res.json()
            if (res.ok) setScripts(prev => [script, ...prev])
            return script
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [user, headers])

    const updateScript = useCallback(async (id: string, data: Partial<CallScript>) => {
        if (!user) return null
        try {
            const res = await fetch(`${ENDPOINTS.CALL_SCRIPTS}/${id}`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify(data)
            })
            const updated = await res.json()
            setScripts(prev => prev.map(s => s.id === id ? updated : s))
            return updated
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }, [user, headers])

    const deleteScript = useCallback(async (id: string) => {
        if (!user) return false
        try {
            await fetch(`${ENDPOINTS.CALL_SCRIPTS}/${id}`, {
                method: 'DELETE',
                headers: headers()
            })
            setScripts(prev => prev.filter(s => s.id !== id))
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }, [user, headers])

    const generateScript = useCallback(async (params: { purpose: string; industry?: string; rateRange?: any; context?: string }) => {
        if (!user) return null
        setGenerating(true)
        try {
            const res = await fetch(ENDPOINTS.CALL_SCRIPTS_GENERATE, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(params)
            })
            const script = await res.json()
            if (res.ok) setScripts(prev => [script, ...prev])
            return script
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setGenerating(false)
        }
    }, [user, headers])

    useEffect(() => {
        fetchScripts()
    }, [fetchScripts])

    return {
        scripts, loading, generating, error,
        fetchScripts, createScript, updateScript, deleteScript, generateScript
    }
}

export default useCallScripts
