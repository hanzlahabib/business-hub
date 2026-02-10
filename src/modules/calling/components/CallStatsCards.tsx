import { Phone, CalendarDays, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import type { CallStats } from '../hooks/useCalls'

interface Props {
    stats: CallStats | null
    loading: boolean
}

const statCards = [
    { key: 'total', label: 'Total Calls', icon: Phone, color: 'from-cyan-500 to-blue-500', getValue: (s: CallStats) => s.total },
    { key: 'today', label: "Today's Calls", icon: CalendarDays, color: 'from-emerald-500 to-teal-500', getValue: (s: CallStats) => s.today },
    { key: 'booked', label: 'Booked', icon: CheckCircle2, color: 'from-violet-500 to-purple-500', getValue: (s: CallStats) => s.booked, suffix: (s: CallStats) => s.total > 0 ? ` (${Math.round((s.booked / s.total) * 100)}%)` : '' },
    { key: 'avgDuration', label: 'Avg Duration', icon: Clock, color: 'from-amber-500 to-orange-500', getValue: (s: CallStats) => formatDuration(s.avgDuration) },
    { key: 'conversion', label: 'Conversion Rate', icon: TrendingUp, color: 'from-rose-500 to-pink-500', getValue: (s: CallStats) => `${s.conversionRate || 0}%` },
]

function formatDuration(seconds: number): string {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

export function CallStatsCards({ stats, loading }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map(card => {
                const Icon = card.icon
                return (
                    <div
                        key={card.key}
                        className="bg-bg-secondary rounded-xl border border-border p-4 hover:border-border/80 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shadow-${card.color.split(' ')[0]}/20`}>
                                <Icon size={14} className="text-white" />
                            </div>
                        </div>
                        <div>
                            {loading || !stats ? (
                                <div className="space-y-2">
                                    <div className="h-6 w-16 bg-bg-tertiary rounded animate-pulse" />
                                    <div className="h-3 w-20 bg-bg-tertiary rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-lg font-bold text-text-primary">
                                        {card.getValue(stats)}
                                        {card.suffix && (
                                            <span className="text-xs font-normal text-text-muted ml-1">
                                                {card.suffix(stats)}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide mt-0.5">
                                        {card.label}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
