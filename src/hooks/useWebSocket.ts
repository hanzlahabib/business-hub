/**
 * useWebSocket — Shared WebSocket hook with reliability features
 *
 * Features:
 *   - Auto-reconnect with exponential backoff (1s → 2s → 4s → max 30s)
 *   - Connection state tracking (connecting, connected, disconnected, reconnecting)
 *   - Heartbeat pong response
 *   - Auto-cleanup on unmount
 *
 * Usage:
 *   const { send, state, lastMessage } = useWebSocket('/ws/calls', {
 *     onMessage: (msg) => handleMessage(msg),
 *     autoConnect: true,
 *   })
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { API_SERVER } from '../config/api'

export type WSState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface UseWebSocketOptions {
    onMessage?: (data: any) => void
    onConnect?: () => void
    onDisconnect?: () => void
    autoConnect?: boolean
    maxRetries?: number
}

interface UseWebSocketReturn {
    send: (data: any) => void
    state: WSState
    lastMessage: any | null
    connect: () => void
    disconnect: () => void
}

const MIN_BACKOFF = 1000      // 1 second
const MAX_BACKOFF = 30_000    // 30 seconds
const BACKOFF_MULTIPLIER = 2

export function useWebSocket(
    path: string = '/ws/calls',
    options: UseWebSocketOptions = {}
): UseWebSocketReturn {
    const {
        onMessage,
        onConnect,
        onDisconnect,
        autoConnect = true,
        maxRetries = Infinity,
    } = options

    const [state, setState] = useState<WSState>('disconnected')
    const [lastMessage, setLastMessage] = useState<any>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const retriesRef = useRef(0)
    const backoffRef = useRef(MIN_BACKOFF)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const unmountedRef = useRef(false)

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
    }, [])

    const connect = useCallback(() => {
        if (unmountedRef.current) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        clearReconnectTimer()
        setState(retriesRef.current > 0 ? 'reconnecting' : 'connecting')

        const wsUrl = API_SERVER.replace('http', 'ws') + path
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            if (unmountedRef.current) { ws.close(); return }
            setState('connected')
            retriesRef.current = 0
            backoffRef.current = MIN_BACKOFF
            onConnect?.()
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                // Respond to server pings
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }))
                    return
                }

                setLastMessage(data)
                onMessage?.(data)
            } catch { /* ignore parse errors */ }
        }

        ws.onclose = () => {
            if (unmountedRef.current) return
            setState('disconnected')
            onDisconnect?.()

            // Schedule reconnect with exponential backoff
            if (retriesRef.current < maxRetries) {
                retriesRef.current++
                const delay = Math.min(backoffRef.current, MAX_BACKOFF)
                backoffRef.current = delay * BACKOFF_MULTIPLIER

                reconnectTimerRef.current = setTimeout(() => {
                    connect()
                }, delay)
            }
        }

        ws.onerror = () => {
            ws.close()
        }
    }, [path, onMessage, onConnect, onDisconnect, maxRetries, clearReconnectTimer])

    const disconnect = useCallback(() => {
        clearReconnectTimer()
        retriesRef.current = maxRetries  // Prevent auto-reconnect
        wsRef.current?.close()
        setState('disconnected')
    }, [clearReconnectTimer, maxRetries])

    const send = useCallback((data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data))
        }
    }, [])

    useEffect(() => {
        unmountedRef.current = false
        if (autoConnect) connect()

        return () => {
            unmountedRef.current = true
            clearReconnectTimer()
            wsRef.current?.close()
        }
    }, []) // Only connect on mount

    return { send, state, lastMessage, connect, disconnect }
}

export default useWebSocket
