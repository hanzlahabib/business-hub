import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { fetchGet, fetchMutation } from '../../../utils/authHeaders'
import { toast } from 'sonner'

export interface DNCEntry {
    id: string
    name: string
    phone: string
    reason: string
    date: string
}

export function useDNC() {
    const { user } = useAuth()
    const [dncList, setDncList] = useState<DNCEntry[]>([])
    const [loading, setLoading] = useState(false)

    const fetchDNCList = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await fetchGet(ENDPOINTS.DNC_LIST)
            setDncList(Array.isArray(data) ? data : [])
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch DNC list')
        } finally {
            setLoading(false)
        }
    }, [user])

    const addToDNC = useCallback(async (phone: string, reason: string) => {
        if (!user) return false
        try {
            await fetchMutation(ENDPOINTS.DNC_ADD, 'POST', { phone, reason })
            toast.success('Number added to DNC list')
            await fetchDNCList()
            return true
        } catch (err: any) {
            toast.error(err.message || 'Failed to add to DNC list')
            return false
        }
    }, [user, fetchDNCList])

    const removeFromDNC = useCallback(async (phone: string) => {
        if (!user) return false
        try {
            await fetchMutation(ENDPOINTS.DNC_REMOVE, 'DELETE', { phone })
            toast.success('Number removed from DNC list')
            await fetchDNCList()
            return true
        } catch (err: any) {
            toast.error(err.message || 'Failed to remove from DNC list')
            return false
        }
    }, [user, fetchDNCList])

    useEffect(() => {
        fetchDNCList()
    }, [fetchDNCList])

    return { dncList, loading, fetchDNCList, addToDNC, removeFromDNC }
}
