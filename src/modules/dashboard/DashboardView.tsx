
import { useState, useEffect, useMemo } from 'react'
import {
    LayoutDashboard, Users, Phone, TrendingUp, TrendingDown, Minus,
    ChevronRight, Loader2, Sparkles, Filter, MoreHorizontal
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { getAuthHeaders } from '../../utils/authHeaders'
import { formatDistanceToNow } from 'date-fns'

interface DashboardData {
    stats: {
        leads: { total: number; today: number; byStatus: Array<{ status: string; _count: number }>; conversionRate: number }
        calls: { total: number; today: number; byOutcome: Array<{ outcome: string; _count: number }>; bookingRate: number }
        tasks: { total: number; completed: number }
        agents: { active: number }
    }
    recentActivity: Array<{
        type: string; title: string; subtitle: string; timestamp: string; actionUrl?: string
    }>
    unreadNotifications: number
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sparkline generator — converts a data array into an SVG path
   ═══════════════════════════════════════════════════════════════════════════ */
function generateSparklinePath(data: number[], width = 100, height = 28): string {
    if (!data || data.length < 2) return `M0,${height} L${width},${height}`
    const max = Math.max(...data, 1)
    const stepX = width / (data.length - 1)
    return data.map((v, i) => {
        const x = i * stepX
        const y = height - (v / max) * (height - 2)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Card — Matches Stitch design: uppercase label, shine effect, sparkline
   ═══════════════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, delta, deltaType, sparkType, sparkColor, delay, trendData }: {
    label: string; value: string | number
    delta?: string; deltaType?: 'up' | 'down' | 'flat'
    sparkType?: 'line' | 'bars'; sparkColor?: string; delay: number
    trendData?: number[]
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="glass-card card-shine rounded-xl p-5"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-text-primary mt-1">{value}</h3>
                </div>
                {delta && (
                    <span className={
                        deltaType === 'up' ? 'stat-delta-up' :
                            deltaType === 'down' ? 'stat-delta-down' : 'stat-delta-flat'
                    }>
                        {deltaType === 'up' ? <TrendingUp size={14} /> :
                            deltaType === 'down' ? <TrendingDown size={14} /> :
                                <Minus size={14} />}
                        {delta}
                    </span>
                )}
            </div>

            {/* Sparkline area — real data or fallback */}
            <div className="h-10 w-full mt-2 relative">
                {sparkType === 'line' && (() => {
                    const d = trendData && trendData.length >= 2 ? trendData : [0, 0, 0, 0, 0, 0, 0]
                    const path = generateSparklinePath(d)
                    const fillPath = `${path} V30 H0 Z`
                    return (
                        <svg className="w-full h-full opacity-80" preserveAspectRatio="none" viewBox="0 0 100 28">
                            <path d={path} fill="none" stroke={sparkColor || '#3c83f6'} strokeWidth="2" />
                            <path d={fillPath} fill={sparkColor || '#3c83f6'} opacity="0.2" stroke="none" />
                        </svg>
                    )
                })()}
                {sparkType === 'bars' && (() => {
                    const d = trendData && trendData.length >= 2 ? trendData : [0, 0, 0, 0, 0, 0, 0]
                    const max = Math.max(...d, 1)
                    return (
                        <div className="flex items-end gap-1 px-1 h-full">
                            {d.map((v, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-sm"
                                    style={{
                                        height: `${Math.max((v / max) * 100, 4)}%`,
                                        background: sparkColor || '#3c83f6',
                                        opacity: 0.3 + (i / d.length) * 0.7
                                    }}
                                />
                            ))}
                        </div>
                    )
                })()}
            </div>
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Timeline Activity Item — Matches Stitch design: circle nodes + vertical line
   ═══════════════════════════════════════════════════════════════════════════ */
const timelineNodeColors: Record<string, string> = {
    call: 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
    lead: 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    task: 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    campaign: 'border-purple-500',
    system: 'border-slate-600'
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Dashboard — Matches Stitch 3-row structure:
   Row 1: KPI cards (4-col)
   Row 2: Pipeline Velocity chart (8-col) + Activity Feed timeline (4-col)
   Row 3: Hot Leads table (2/3) + AI Suggestions (1/3)
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardView() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [trends, setTrends] = useState<{ leads: number[]; calls: number[]; conversions: number[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user?.id) return
        setLoading(true)
        Promise.all([
            fetch(ENDPOINTS.DASHBOARD, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
            fetch(ENDPOINTS.DASHBOARD_TRENDS, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null).catch(() => null)
        ])
            .then(([d, t]) => { setData(d); setTrends(t) })
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [user?.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-text-muted">
                <LayoutDashboard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Unable to load dashboard data</p>
            </div>
        )
    }

    const { stats, recentActivity, unreadNotifications } = data

    /* Pipeline data for the velocity chart area */
    const pipelineTotal = stats.leads.byStatus.reduce((s, v) => s + v._count, 0)
    const statusLabels: Record<string, string> = {
        new: 'New', contacted: 'Contacted', replied: 'Replied',
        qualified: 'Qualified', booked: 'Booked', won: 'Won',
        lost: 'Lost', 'not-interested': 'Not Interested', 'follow-up': 'Follow-up'
    }

    const pipelineColors: Record<string, string> = {
        new: '#3b82f6', contacted: '#06b6d4', replied: '#0ea5e9',
        qualified: '#a855f7', booked: '#6366f1', won: '#10b981',
        lost: '#ef4444', 'not-interested': '#6b7280', 'follow-up': '#f59e0b'
    }

    /* Outcome data */
    const outcomeColors: Record<string, string> = {
        booked: 'bg-emerald-500', interested: 'bg-blue-500',
        'not-interested': 'bg-red-500', voicemail: 'bg-amber-500',
        callback: 'bg-purple-500', 'follow-up': 'bg-cyan-500',
        'no-answer': 'bg-gray-500'
    }

    /* Build hot leads from top pipeline statuses */
    const hotLeads = stats.leads.byStatus
        .filter(s => ['qualified', 'booked', 'replied', 'contacted', 'follow-up'].includes(s.status))
        .sort((a, b) => b._count - a._count)
        .slice(0, 5)

    const leadColors = ['bg-indigo-500', 'bg-purple-500', 'bg-teal-600', 'bg-rose-500', 'bg-amber-500']

    return (
        <div className="bg-grid-pattern min-h-full">
            <div className="max-w-[1600px] mx-auto space-y-6 p-1">

                {/* ─── Row 1: KPI Cards ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Total Leads" value={stats.leads.total}
                        delta={`+${stats.leads.today} today`}
                        deltaType={stats.leads.today > 0 ? 'up' : 'flat'}
                        sparkType="line" sparkColor="#3c83f6" delay={0}
                        trendData={trends?.leads}
                    />
                    <KpiCard
                        label="Conv. Rate" value={`${stats.leads.conversionRate}%`}
                        delta={stats.leads.conversionRate > 0 ? `${stats.leads.conversionRate}%` : '0%'}
                        deltaType={stats.leads.conversionRate > 0 ? 'up' : 'flat'}
                        sparkType="line" sparkColor="#3c83f6" delay={0.05}
                        trendData={trends?.conversions}
                    />
                    <KpiCard
                        label="Active Calls" value={stats.calls.total}
                        delta={`+${stats.calls.today} today`}
                        deltaType={stats.calls.today > 0 ? 'up' : 'flat'}
                        sparkType="bars" sparkColor="#3c83f6" delay={0.1}
                        trendData={trends?.calls}
                    />
                    <KpiCard
                        label="Booking Rate" value={`${stats.calls.bookingRate}%`}
                        delta={stats.calls.bookingRate > 0 ? `${stats.calls.bookingRate}%` : '0%'}
                        deltaType={stats.calls.bookingRate > 0 ? 'up' : 'flat'}
                        sparkType="line" sparkColor="#10b981" delay={0.15}
                        trendData={trends?.conversions}
                    />
                </div>

                {/* ─── Row 2: Pipeline Velocity (8-col) + Activity Timeline (4-col) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ minHeight: 400 }}>

                    {/* Pipeline Velocity — from Stitch */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="glass-card rounded-xl p-6 lg:col-span-8 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-semibold text-text-primary">Pipeline Velocity</h2>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs font-medium text-white bg-accent-primary rounded hover:bg-accent-hover transition">Week</button>
                                <button className="px-3 py-1 text-xs font-medium text-text-muted hover:text-text-primary transition">Month</button>
                                <button className="px-3 py-1 text-xs font-medium text-text-muted hover:text-text-primary transition">Quarter</button>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            {/* Background grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-full h-px bg-border/80" />
                                ))}
                            </div>

                            {/* Pipeline bars — visual representation of lead stages */}
                            <div className="absolute inset-0 pt-2 pb-8 px-2 flex items-end gap-2">
                                {stats.leads.byStatus.map((s, i) => {
                                    const pct = pipelineTotal > 0 ? (s._count / pipelineTotal) * 100 : 0
                                    // Use log scale to prevent dominant status from overflowing
                                    const maxCount = Math.max(...stats.leads.byStatus.map(v => v._count))
                                    const normalizedHeight = maxCount > 0 ? Math.max((s._count / maxCount) * 85, 6) : 6
                                    const barColor = pipelineColors[s.status] || '#6b7280'
                                    return (
                                        <motion.div
                                            key={s.status}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${normalizedHeight}%` }}
                                            transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                            className="flex-1 rounded-t-md relative group cursor-pointer"
                                            style={{
                                                background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}40 100%)`,
                                                boxShadow: `0 0 10px ${barColor}30`
                                            }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border z-10">
                                                {statusLabels[s.status] || s.status}: {s._count}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* X axis labels */}
                            <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-text-muted font-mono px-2">
                                {stats.leads.byStatus.map(s => (
                                    <span key={s.status} className="flex-1 text-center truncate">
                                        {(statusLabels[s.status] || s.status).substring(0, 4)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Activity — Timeline from Stitch */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="glass-card rounded-xl p-6 lg:col-span-4 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
                            <button className="text-xs text-accent-primary hover:text-accent-secondary transition-colors">View All</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 relative">
                            {/* Timeline vertical line */}
                            <div className="timeline-line" />

                            <div className="space-y-6">
                                {recentActivity.slice(0, 8).map((event, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-4 relative ${event.actionUrl ? 'cursor-pointer hover:bg-bg-tertiary/50 rounded-lg p-1 -m-1 transition-colors' : ''}`}
                                        onClick={() => event.actionUrl && navigate(event.actionUrl)}
                                    >
                                        <div className={`timeline-node mt-1.5 ${timelineNodeColors[event.type] || timelineNodeColors.system}`} />
                                        <div>
                                            <p className={`text-sm text-text-secondary ${event.actionUrl ? 'hover:text-text-primary' : ''}`}>{event.title}</p>
                                            <p className="text-xs text-text-muted mt-1">
                                                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                                {event.subtitle ? ` \u2022 ${event.subtitle}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <p className="text-xs text-text-muted text-center py-6">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ─── Row 3: Hot Leads Table (2/3) + AI Suggestions (1/3) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">

                    {/* Hot Leads Table — from Stitch */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="glass-card rounded-xl p-0 overflow-hidden lg:col-span-2 flex flex-col"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-base font-semibold text-text-primary">Hot Leads</h2>
                            <div className="flex gap-2 text-text-muted">
                                <Filter size={14} className="cursor-pointer hover:text-text-primary transition" />
                                <MoreHorizontal size={14} className="cursor-pointer hover:text-text-primary transition" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-text-muted uppercase bg-bg-tertiary/50 border-b border-border">
                                        <th className="px-6 py-3 font-medium">Stage</th>
                                        <th className="px-6 py-3 font-medium">Count</th>
                                        <th className="px-6 py-3 font-medium">% of Pipeline</th>
                                        <th className="px-6 py-3 font-medium">Heat</th>
                                        <th className="px-6 py-3 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {hotLeads.map((lead, idx) => {
                                        const pct = pipelineTotal > 0 ? Math.round((lead._count / pipelineTotal) * 100) : 0
                                        const heat = Math.min(Math.round(pct * 3 + 20), 100)
                                        const heatColor = heat > 70 ? 'from-orange-500 to-red-500' :
                                            heat > 40 ? 'from-yellow-500 to-orange-500' :
                                                'from-blue-500 to-cyan-500'
                                        const heatText = heat > 70 ? 'text-red-400' : heat > 40 ? 'text-orange-400' : 'text-blue-400'

                                        return (
                                            <tr
                                                key={lead.status}
                                                className="group hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/leads?status=${lead.status}`)}
                                            >
                                                <td className="px-6 py-4 text-text-primary font-medium flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${leadColors[idx] || 'bg-slate-500'} flex items-center justify-center text-xs text-white font-bold`}>
                                                        {(statusLabels[lead.status] || lead.status || '??').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {statusLabels[lead.status] || lead.status}
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary font-mono">{lead._count}</td>
                                                <td className="px-6 py-4 text-text-secondary">{pct}%</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="heat-bar">
                                                            <div className={`bg-gradient-to-r ${heatColor}`} style={{ width: `${heat}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${heatText}`}>{heat}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button className="text-accent-primary hover:text-text-primary hover:bg-accent-primary/20 px-2 py-1 rounded transition text-xs">
                                                        Contact
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {hotLeads.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-xs">
                                                No hot leads in pipeline
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* AI Suggestions — from Stitch */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="glass-card rounded-xl p-6 lg:col-span-1 bg-gradient-to-b from-[rgba(30,41,59,0.4)] to-[rgba(60,131,246,0.05)] border-t border-accent-primary/20"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles size={18} className="text-accent-primary animate-pulse" />
                            <h2 className="text-base font-semibold text-text-primary">AI Suggestions</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Suggestion 1 — new leads today */}
                            {stats.leads.today > 0 && (
                                <div
                                    className="bg-bg-tertiary/50 hover:bg-bg-tertiary p-3 rounded-lg border border-border transition-colors group cursor-pointer"
                                    onClick={() => navigate('/leads')}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">High Priority</span>
                                        <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                                    </div>
                                    <p className="text-sm text-text-secondary mb-2">
                                        {stats.leads.today} new lead{stats.leads.today > 1 ? 's' : ''} today. Review and assign to agents before end of day.
                                    </p>
                                    <button className="text-[10px] bg-accent-primary/20 hover:bg-accent-primary/40 text-accent-primary px-2 py-1 rounded border border-accent-primary/20 transition">
                                        Review Leads
                                    </button>
                                </div>
                            )}

                            {/* Suggestion 2 — uncontacted leads */}
                            {(() => {
                                const newCount = stats.leads.byStatus.find(s => s.status === 'new')?._count || 0
                                return newCount > 0 ? (
                                    <div
                                        className="bg-bg-tertiary/50 hover:bg-bg-tertiary p-3 rounded-lg border border-border transition-colors group cursor-pointer"
                                        onClick={() => navigate('/leads')}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Follow Up</span>
                                            <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                                        </div>
                                        <p className="text-sm text-text-secondary mb-2">
                                            {newCount} uncontacted lead{newCount > 1 ? 's' : ''} waiting for outreach. Reach out to increase conversion.
                                        </p>
                                        <button className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 px-2 py-1 rounded border border-amber-500/20 transition">
                                            Contact Now
                                        </button>
                                    </div>
                                ) : null
                            })()}

                            {/* Suggestion 3 — conversion insight */}
                            <div className="bg-bg-tertiary/50 hover:bg-bg-tertiary p-3 rounded-lg border border-border transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Insight</span>
                                    <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                                </div>
                                <p className="text-sm text-text-secondary mb-2">
                                    Conversion rate is at {stats.leads.conversionRate}%. {stats.leads.conversionRate < 20
                                        ? 'Consider refining qualification criteria or increasing follow-up cadence.'
                                        : 'Strong performance. Maintain current outreach cadence.'}
                                </p>
                            </div>

                            {/* Suggestion 4 — pending tasks */}
                            {stats.tasks.total - stats.tasks.completed > 0 && (
                                <div className="bg-bg-tertiary/50 hover:bg-bg-tertiary p-3 rounded-lg border border-border transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Routine</span>
                                        <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                                    </div>
                                    <p className="text-sm text-text-secondary mb-2">
                                        {stats.tasks.total - stats.tasks.completed} task{stats.tasks.total - stats.tasks.completed > 1 ? 's' : ''} pending completion.
                                        {stats.agents.active > 0 ? ` ${stats.agents.active} agent${stats.agents.active > 1 ? 's' : ''} active.` : ''}
                                    </p>
                                </div>
                            )}

                            {/* Suggestion 5 — unread notifications */}
                            {unreadNotifications > 0 && (
                                <div className="bg-bg-tertiary/50 hover:bg-bg-tertiary p-3 rounded-lg border border-border transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Attention</span>
                                        <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                                    </div>
                                    <p className="text-sm text-text-secondary">
                                        {unreadNotifications} unread notification{unreadNotifications > 1 ? 's' : ''} require your attention.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
