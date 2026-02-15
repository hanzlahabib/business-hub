import { useState, useEffect } from 'react'
import { Phone, Eye } from 'lucide-react'

interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
}

interface Props {
    activeCalls: ActiveCall[]
    onViewCall: (callId: string) => void
}

function LiveDuration({ startedAt }: { startedAt: string }) {
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
    return <span className="font-mono text-xs">{m}:{String(s).padStart(2, '0')}</span>
}

export function LiveCallBanner({ activeCalls, onViewCall }: Props) {
    if (activeCalls.length === 0) return null

    return (
        <div className="space-y-2">
            {activeCalls.map(call => (
                <div
                    key={call.id}
                    className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                    {/* Pulsing dot */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>

                    <span className="text-xs font-semibold text-emerald-400">Live Call</span>

                    <span className="text-xs text-text-primary font-medium">{call.leadName}</span>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        call.status === 'ringing'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-amber-500/10 text-amber-400'
                    }`}>
                        {call.status}
                    </span>

                    <span className="text-emerald-300">
                        <LiveDuration startedAt={call.startedAt} />
                    </span>

                    <button
                        onClick={() => onViewCall(call.id)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                        <Eye size={12} />
                        View Details
                    </button>
                </div>
            ))}
        </div>
    )
}

export default LiveCallBanner
