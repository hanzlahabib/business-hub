/**
 * useCallUpdates — Real-time call status updates via WebSocket
 *
 * Wraps useWebSocket to track active calls (in-progress/ringing)
 * and trigger list refreshes on call status changes.
 *
 * Also tracks recently completed/failed calls so the UI can show
 * brief result notifications before auto-dismissing.
 */

import { useState, useCallback, useRef } from 'react'
import { useWebSocket } from '../../../hooks/useWebSocket'
import { toast } from 'sonner'
import type { Call } from './useCalls'

export interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
    outcome?: string
    completedAt?: string
}

interface UseCallUpdatesOptions {
    onCallUpdate?: (call: Partial<Call>) => void
}

/** How long to keep completed/failed calls visible (ms) */
const RESULT_DISPLAY_MS = 10_000

export function useCallUpdates(options: UseCallUpdatesOptions = {}) {
    const { onCallUpdate } = options
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
    const [recentResults, setRecentResults] = useState<ActiveCall[]>([])
    const onCallUpdateRef = useRef(onCallUpdate)
    onCallUpdateRef.current = onCallUpdate
    const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const handleMessage = useCallback((data: any) => {
        if (data.type === 'call_update' || data.type === 'call:update') {
            const call = data.data || data.call || data

            const entry: ActiveCall = {
                id: call.id,
                leadId: call.leadId || call.lead?.id || '',
                leadName: call.lead?.name || call.leadName || 'Unknown',
                status: call.status,
                startedAt: call.startedAt || new Date().toISOString(),
                outcome: call.outcome,
                completedAt: call.completedAt,
            }

            if (['in-progress', 'ringing', 'queued'].includes(call.status)) {
                // Active call — add or update
                setActiveCalls(prev => {
                    const exists = prev.find(c => c.id === call.id)
                    return exists
                        ? prev.map(c => c.id === call.id ? entry : c)
                        : [...prev, entry]
                })
                // Remove from results if somehow there
                setRecentResults(prev => prev.filter(c => c.id !== call.id))
            } else {
                // Call ended — show toast notification
                if (call.status === 'completed') {
                    const outcomeLabels: Record<string, string> = {
                        booked: 'Meeting Booked',
                        'follow-up': 'Follow-up Scheduled',
                        'not-interested': 'Not Interested',
                        'no-answer': 'No Answer',
                        voicemail: 'Left Voicemail',
                    }
                    toast.success(`Call completed: ${entry.leadName}`, {
                        description: outcomeLabels[call.outcome] || 'Call finished',
                    })
                } else if (call.status === 'failed') {
                    toast.error(`Call failed: ${entry.leadName}`)
                }

                // Call ended — move from active to recentResults
                setActiveCalls(prev => prev.filter(c => c.id !== call.id))

                setRecentResults(prev => {
                    const exists = prev.find(c => c.id === call.id)
                    return exists
                        ? prev.map(c => c.id === call.id ? entry : c)
                        : [...prev, entry]
                })

                // Auto-dismiss after RESULT_DISPLAY_MS
                const existing = dismissTimers.current.get(call.id)
                if (existing) clearTimeout(existing)
                dismissTimers.current.set(
                    call.id,
                    setTimeout(() => {
                        setRecentResults(prev => prev.filter(c => c.id !== call.id))
                        dismissTimers.current.delete(call.id)
                    }, RESULT_DISPLAY_MS)
                )
            }

            // Dispatch global event so LeadDetailPanel can listen
            window.dispatchEvent(new CustomEvent('call:status-changed', {
                detail: entry,
            }))

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
        recentResults,
        /** Combined: active + recently finished (for global indicator) */
        allVisibleCalls: [...activeCalls, ...recentResults],
        wsState,
        clearActiveCalls,
    }
}

export default useCallUpdates
