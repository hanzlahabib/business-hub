import { useState, useEffect } from 'react'
import { Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
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

export function GlobalCallIndicator({ activeCalls, onViewCall }: Props) {
    const navigate = useNavigate()

    if (activeCalls.length === 0) return null

    const primaryCall = activeCalls[0]
    const extraCount = activeCalls.length - 1

    const handleClick = () => {
        navigate('/calling')
        onViewCall?.(primaryCall.id)
    }

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors animate-in fade-in"
        >
            {/* Pulsing dot */}
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <Phone size={12} className="text-emerald-400" />

            <span className="text-[11px] font-medium text-emerald-400 hidden sm:inline max-w-[120px] truncate">
                {primaryCall.leadName}
            </span>

            <span className="text-[11px] text-emerald-300">
                <LiveTimer startedAt={primaryCall.startedAt} />
            </span>

            {extraCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    +{extraCount}
                </span>
            )}
        </button>
    )
}

export default GlobalCallIndicator
