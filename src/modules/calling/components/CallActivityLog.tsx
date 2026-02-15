import { useState, useEffect, useCallback } from 'react'
import { Activity, Phone, AlertTriangle, ArrowRight, Webhook, Clock, Loader2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

interface CallLogEntry {
    id: string
    callId: string
    event: string
    message: string
    details: any
    level: string
    createdAt: string
    call?: {
        id: string
        status: string
        lead?: { id: string; name: string; company?: string }
    }
}

const EVENT_CONFIG: Record<string, { icon: typeof Phone; color: string }> = {
    'initiated': { icon: Phone, color: 'text-cyan-400' },
    'status-change': { icon: ArrowRight, color: 'text-blue-400' },
    'webhook-received': { icon: Webhook, color: 'text-violet-400' },
    'error': { icon: AlertTriangle, color: 'text-red-400' },
    'timeout': { icon: Clock, color: 'text-amber-400' },
}

const LEVEL_STYLES: Record<string, string> = {
    info: 'border-l-blue-500/30',
    warn: 'border-l-amber-500/50',
    error: 'border-l-red-500/50',
}

interface Props {
    onCallSelect?: (callId: string) => void
}

export function CallActivityLog({ onCallSelect }: Props) {
    const { user } = useAuth()
    const [logs, setLogs] = useState<CallLogEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const res = await fetch(ENDPOINTS.CALL_ACTIVITY, {
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            const data = await res.json()
            setLogs(Array.isArray(data) ? data : [])
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [user])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    Call Activity Log
                </h2>
                <button
                    onClick={fetchLogs}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {logs.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl border border-border p-8 text-center">
                    <Activity size={24} className="mx-auto text-text-muted/30 mb-2" />
                    <p className="text-xs text-text-muted">No activity yet</p>
                    <p className="text-[10px] text-text-muted/60 mt-1">Call events will appear here as they happen</p>
                </div>
            ) : (
                <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                    <div className="divide-y divide-border/50">
                        {logs.map(log => {
                            const eventCfg = EVENT_CONFIG[log.event] || EVENT_CONFIG['status-change']
                            const Icon = eventCfg.icon
                            const levelStyle = LEVEL_STYLES[log.level] || LEVEL_STYLES.info

                            return (
                                <div
                                    key={log.id}
                                    className={`flex items-start gap-3 px-4 py-3 border-l-2 ${levelStyle} hover:bg-bg-tertiary/30 transition-colors ${onCallSelect ? 'cursor-pointer' : ''}`}
                                    onClick={() => onCallSelect?.(log.callId)}
                                >
                                    <div className={`mt-0.5 ${eventCfg.color}`}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-text-primary">{log.message}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {log.call?.lead && (
                                                <span className="text-[10px] text-text-muted">
                                                    {log.call.lead.name}
                                                    {log.call.lead.company ? ` (${log.call.lead.company})` : ''}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted font-mono">
                                                {log.event}
                                            </span>
                                            {log.level === 'error' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                                                    ERROR
                                                </span>
                                            )}
                                            {log.level === 'warn' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                                                    WARN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-text-muted/60 flex-shrink-0 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CallActivityLog
