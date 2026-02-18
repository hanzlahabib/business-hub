// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react'
import { ENDPOINTS, WS_SERVER } from '../config/api'
import { useAuth } from './useAuth'
import { getJsonAuthHeaders } from '../utils/authHeaders'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    actionUrl?: string
    metadata?: Record<string, unknown>
    createdAt: string
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
    const wsRef = useRef<WebSocket | null>(null)

    const headers = useCallback(() => getJsonAuthHeaders(), [])

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const res = await fetch(`${ENDPOINTS.NOTIFICATIONS}?limit=20`, { headers: headers() })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (e) { console.warn('[Notifications] Fetch failed:', e) }
        finally { setLoading(false) }
    }, [user?.id, headers])

    const fetchUnreadCount = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await fetch(ENDPOINTS.NOTIFICATIONS_COUNT, { headers: headers() })
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.unread)
            }
        } catch (e) { console.warn('[Notifications] Count fetch failed:', e) }
    }, [user?.id, headers])

    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetch(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`, {
                method: 'PATCH',
                headers: headers()
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (e) { console.warn('[Notifications] Mark read failed:', e) }
    }, [headers])

    const markAllRead = useCallback(async () => {
        try {
            await fetch(ENDPOINTS.NOTIFICATIONS_READ_ALL, {
                method: 'POST',
                headers: headers()
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (e) { console.warn('[Notifications] Mark all read failed:', e) }
    }, [headers])

    // Listen for real-time notifications via WebSocket
    useEffect(() => {
        if (!user?.id) return

        const ws = new WebSocket(`${WS_SERVER}/ws/calls`)
        wsRef.current = ws

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'auth', userId: user.id }))
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === 'notification:new' && msg.notification) {
                    setNotifications(prev => [msg.notification, ...prev].slice(0, 30))
                    setUnreadCount(prev => prev + 1)
                }
            } catch (e) { console.warn('[Notifications] WS message parse failed:', e) }
        }

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [user?.id])

    // Initial fetch
    useEffect(() => {
        fetchNotifications()
        fetchUnreadCount()
    }, [fetchNotifications, fetchUnreadCount])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllRead,
        refetch: fetchNotifications
    }
}
