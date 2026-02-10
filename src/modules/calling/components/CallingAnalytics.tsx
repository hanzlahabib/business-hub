import { useState, useEffect, useCallback } from 'react'
import {
    BarChart3, PieChart, Calendar, TrendingUp, Users, Clock,
    Phone, CheckCircle, XCircle, ChevronDown, Loader2
} from 'lucide-react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

interface AnalyticsData {
    totalCalls: number
    todayCalls: number
    bookedCount: number
    avgDuration: number
    conversionRate: number
    outcomeBreakdown: Record<string, number>
    dailyVolume: { date: string; count: number; booked: number }[]
    agentPerformance: { name: string; calls: number; bookRate: number; avgDuration: number; status: string }[]
}

const DATE_RANGES = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All Time', value: 'all' },
]

const OUTCOME_COLORS: Record<string, string> = {
    booked: 'bg-emerald-500',
    'follow-up': 'bg-amber-500',
    'not-interested': 'bg-red-500',
    'no-answer': 'bg-gray-500',
    voicemail: 'bg-purple-500',
    failed: 'bg-rose-600',
}

const OUTCOME_LABELS: Record<string, string> = {
    booked: '✅ Booked',
    'follow-up': '📅 Follow-up',
    'not-interested': '❌ Not Interested',
    'no-answer': '📵 No Answer',
    voicemail: '📩 Voicemail',
    failed: '🔴 Failed',
}

export function CallingAnalytics() {
    const { user } = useAuth()
    const [dateRange, setDateRange] = useState('7d')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData | null>(null)

    const fetchAnalytics = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const res = await fetch(`${ENDPOINTS.CALL_STATS}?range=${dateRange}`, {
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            const json = await res.json()
            setData(json)
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [user, dateRange])

    useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

    // Compute max for bar chart scaling
    const maxDailyCount = data?.dailyVolume?.reduce((max, d) => Math.max(max, d.count), 0) || 1
    const totalOutcomes = data?.outcomeBreakdown
        ? Object.values(data.outcomeBreakdown).reduce((a, b) => a + b, 0)
        : 0

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Call Analytics
                </h2>
                <div className="flex gap-1 bg-bg-secondary rounded-lg p-0.5 border border-border">
                    {DATE_RANGES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setDateRange(r.value)}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${dateRange === r.value
                                    ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                                    : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-bg-secondary rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Phone} label="Total Calls" value={data.totalCalls} color="text-cyan-400" />
                        <StatCard icon={Calendar} label="Today" value={data.todayCalls} color="text-blue-400" />
                        <StatCard icon={CheckCircle} label="Booked" value={data.bookedCount} color="text-emerald-400"
                            sub={data.totalCalls > 0 ? `${((data.bookedCount / data.totalCalls) * 100).toFixed(1)}%` : '0%'} />
                        <StatCard icon={Clock} label="Avg Duration" value={formatDuration(data.avgDuration)} color="text-amber-400" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Outcome Breakdown */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                                Outcome Breakdown
                            </h3>
                            {totalOutcomes === 0 ? (
                                <p className="text-text-muted text-sm text-center py-4">No call outcomes yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(data.outcomeBreakdown || {}).sort((a, b) => b[1] - a[1]).map(([outcome, count]) => {
                                        const pct = totalOutcomes > 0 ? (count / totalOutcomes) * 100 : 0
                                        return (
                                            <div key={outcome} className="flex items-center gap-3">
                                                <span className="text-xs w-28 text-text-muted truncate">
                                                    {OUTCOME_LABELS[outcome] || outcome}
                                                </span>
                                                <div className="flex-1 bg-bg-tertiary rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${OUTCOME_COLORS[outcome] || 'bg-gray-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-text-primary font-medium w-10 text-right">{count}</span>
                                                <span className="text-[10px] text-text-muted w-10 text-right">{pct.toFixed(0)}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Daily Volume Chart */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                                Daily Call Volume
                            </h3>
                            {!data.dailyVolume || data.dailyVolume.length === 0 ? (
                                <p className="text-text-muted text-sm text-center py-4">No volume data</p>
                            ) : (
                                <div className="flex items-end gap-1 h-32">
                                    {data.dailyVolume.map((day, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            <div className="w-full flex flex-col justify-end h-28">
                                                <div
                                                    className="w-full bg-cyan-500/40 rounded-t transition-all group-hover:bg-cyan-500/60"
                                                    style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                                                />
                                            </div>
                                            <span className="text-[8px] text-text-muted truncate w-full text-center">
                                                {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                            </span>
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-bg-primary border border-border rounded px-2 py-1 text-[10px] text-text-primary whitespace-nowrap shadow-lg z-10">
                                                {day.count} calls • {day.booked} booked
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Agent Performance */}
                    {data.agentPerformance && data.agentPerformance.length > 0 && (
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                                Agent Performance
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-text-muted border-b border-border">
                                            <th className="pb-2 font-medium">Agent</th>
                                            <th className="pb-2 font-medium text-right">Calls</th>
                                            <th className="pb-2 font-medium text-right">Book Rate</th>
                                            <th className="pb-2 font-medium text-right">Avg Duration</th>
                                            <th className="pb-2 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.agentPerformance.map((agent, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-bg-tertiary transition-colors">
                                                <td className="py-2 text-text-primary font-medium">{agent.name}</td>
                                                <td className="py-2 text-text-primary text-right">{agent.calls}</td>
                                                <td className="py-2 text-right">
                                                    <span className={agent.bookRate > 20 ? 'text-emerald-400' : 'text-text-muted'}>
                                                        {agent.bookRate.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-2 text-text-muted text-right">{formatDuration(agent.avgDuration)}</td>
                                                <td className="py-2 text-right">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${agent.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            agent.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                                                'bg-gray-500/10 text-gray-400'
                                                        }`}>
                                                        {agent.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 text-text-muted text-sm">
                    Failed to load analytics. Try refreshing.
                </div>
            )}
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color, sub }: {
    icon: any; label: string; value: string | number; color: string; sub?: string
}) {
    return (
        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-text-muted">{label}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">{value}</div>
            {sub && <span className="text-xs text-text-muted">{sub}</span>}
        </div>
    )
}

function formatDuration(seconds: number): string {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(Math.floor(s)).padStart(2, '0')}`
}

export default CallingAnalytics
