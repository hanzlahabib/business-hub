import { Phone, PhoneOff, PhoneForwarded, Clock, User } from 'lucide-react'
import type { Call } from '../hooks/useCalls'

interface Props {
    calls: Call[]
    loading: boolean
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    'in-progress': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'In Progress' },
    ringing: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Ringing' },
    queued: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Queued' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed' },
}

const OUTCOME_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    booked: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '✅ Booked', icon: '✅' },
    'follow-up': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '📅 Follow-up', icon: '📅' },
    'not-interested': { bg: 'bg-red-500/10', text: 'text-red-400', label: '❌ Not Interested', icon: '❌' },
    'no-answer': { bg: 'bg-gray-500/10', text: 'text-gray-400', label: '📵 No Answer', icon: '📵' },
    voicemail: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: '📩 Voicemail', icon: '📩' },
}

function formatDuration(seconds?: number): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function RecentCallsList({ calls, loading }: Props) {
    if (loading) {
        return (
            <div className="bg-bg-secondary rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Calls</h3>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-bg-tertiary" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-bg-tertiary rounded" />
                                <div className="h-2 w-16 bg-bg-tertiary rounded" />
                            </div>
                            <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-bg-secondary rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Phone size={14} className="text-cyan-500" />
                Recent Calls
            </h3>

            {calls.length === 0 ? (
                <div className="text-center py-8">
                    <PhoneForwarded size={32} className="mx-auto text-text-muted/30 mb-3" />
                    <p className="text-xs text-text-muted">No calls yet — start your first call</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {calls.map(call => {
                        const status = STATUS_STYLES[call.status] || STATUS_STYLES.queued
                        const outcome = call.outcome ? OUTCOME_STYLES[call.outcome] : null

                        return (
                            <div
                                key={call.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-tertiary/50 transition-colors cursor-pointer group"
                            >
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/10">
                                    <User size={14} className="text-cyan-400" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-text-primary truncate">
                                        {call.lead?.name || 'Unknown Lead'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.bg} ${status.text} font-medium`}>
                                            {status.label}
                                        </span>
                                        {call.duration && (
                                            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                                <Clock size={9} />
                                                {formatDuration(call.duration)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Outcome */}
                                {outcome && (
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${outcome.bg} ${outcome.text} font-medium whitespace-nowrap`}>
                                        {outcome.label}
                                    </span>
                                )}

                                {/* Time */}
                                <span className="text-[10px] text-text-muted whitespace-nowrap">
                                    {timeAgo(call.createdAt)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
