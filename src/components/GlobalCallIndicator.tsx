import { useState, useEffect } from 'react'
import { Phone, PhoneOff, PhoneIncoming, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
    outcome?: string
}

interface Props {
    activeCalls: ActiveCall[]
    onViewCall?: (callId: string) => void
}

function LiveTimer({ startedAt }: { startedAt: string }) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const start = new Date(startedAt).getTime()
        const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [startedAt])

    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    return <span className="font-mono">{m}:{String(s).padStart(2, '0')}</span>
}

const STATUS_CONFIG: Record<string, {
    bg: string; border: string; text: string; dot: string; icon: typeof Phone; label: string
}> = {
    queued: {
        bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400',
        dot: 'bg-blue-400', icon: Phone, label: 'Queued',
    },
    ringing: {
        bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400',
        dot: 'bg-amber-400', icon: PhoneIncoming, label: 'Ringing',
    },
    'in-progress': {
        bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400',
        dot: 'bg-emerald-400', icon: Phone, label: 'In Progress',
    },
    completed: {
        bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400',
        dot: 'bg-emerald-500', icon: Check, label: 'Completed',
    },
    failed: {
        bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400',
        dot: 'bg-red-500', icon: X, label: 'Failed',
    },
}

const OUTCOME_LABELS: Record<string, string> = {
    booked: '✅ Booked',
    'follow-up': '📅 Follow-up',
    'not-interested': '❌ Not Interested',
    'no-answer': '📵 No Answer',
    voicemail: '📩 Voicemail',
}

function getConfig(status: string) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.queued
}

export function GlobalCallIndicator({ activeCalls, onViewCall }: Props) {
    const navigate = useNavigate()

    if (activeCalls.length === 0) return null

    const primaryCall = activeCalls[0]
    const extraCount = activeCalls.length - 1
    const config = getConfig(primaryCall.status)
    const Icon = config.icon
    const isActive = ['queued', 'ringing', 'in-progress'].includes(primaryCall.status)
    const isFinished = ['completed', 'failed'].includes(primaryCall.status)

    const handleClick = () => {
        navigate('/calling')
        onViewCall?.(primaryCall.id)
    }

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.bg} border ${config.border} hover:brightness-110 transition-all animate-in fade-in ${isFinished ? 'opacity-90' : ''}`}
        >
            {/* Pulsing dot for active, solid for finished */}
            <span className="relative flex h-2 w-2">
                {isActive && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
            </span>

            <Icon size={12} className={config.text} />

            <span className={`text-[11px] font-medium ${config.text} hidden sm:inline max-w-[120px] truncate`}>
                {primaryCall.leadName}
            </span>

            {/* Status badge */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
                {isFinished && primaryCall.outcome
                    ? (OUTCOME_LABELS[primaryCall.outcome] || config.label)
                    : config.label
                }
            </span>

            {/* Live timer for active calls */}
            {isActive && (
                <span className={`text-[11px] ${config.text}`}>
                    <LiveTimer startedAt={primaryCall.startedAt} />
                </span>
            )}

            {extraCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.text} font-medium`}>
                    +{extraCount}
                </span>
            )}
        </button>
    )
}

export default GlobalCallIndicator
