/**
 * useCallUpdates — Real-time call status updates via WebSocket
 *
 * Wraps useWebSocket to track active calls (in-progress/ringing)
 * and trigger list refreshes on call status changes.
 */

import { useState, useCallback, useRef } from 'react'
import { useWebSocket } from '../../../hooks/useWebSocket'
import type { Call } from './useCalls'

interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
}

interface UseCallUpdatesOptions {
    onCallUpdate?: (call: Partial<Call>) => void
}

export function useCallUpdates(options: UseCallUpdatesOptions = {}) {
    const { onCallUpdate } = options
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
    const onCallUpdateRef = useRef(onCallUpdate)
    onCallUpdateRef.current = onCallUpdate

    const handleMessage = useCallback((data: any) => {
        if (data.type === 'call_update' || data.type === 'call:update') {
            const call = data.data || data.call || data

            // Update active calls list
            if (call.status === 'in-progress' || call.status === 'ringing') {
                setActiveCalls(prev => {
                    const exists = prev.find(c => c.id === call.id)
                    const entry: ActiveCall = {
                        id: call.id,
                        leadId: call.leadId || call.lead?.id || '',
                        leadName: call.lead?.name || call.leadName || 'Unknown',
                        status: call.status,
                        startedAt: call.startedAt || new Date().toISOString(),
                    }
                    return exists
                        ? prev.map(c => c.id === call.id ? entry : c)
                        : [...prev, entry]
                })
            } else {
                // Call ended — remove from active
                setActiveCalls(prev => prev.filter(c => c.id !== call.id))
            }

            // Notify parent to refresh call list
            onCallUpdateRef.current?.(call)
        }
    }, [])

    const { state: wsState } = useWebSocket('/ws/calls', {
        onMessage: handleMessage,
        autoConnect: true,
        maxRetries: 5,
    })

    const clearActiveCalls = useCallback(() => {
        setActiveCalls([])
    }, [])

    return {
        activeCalls,
        wsState,
        clearActiveCalls,
    }
}

export default useCallUpdates
