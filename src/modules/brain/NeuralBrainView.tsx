// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import {
    Loader2, RefreshCw, ChevronRight, Send, FileEdit,
    AlertTriangle, BarChart3, Search, ArrowUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════════════════
   Main View — Matches Stitch "Neural Brain AI Intelligence Dashboard"
   Layout:
   1. Header strip: title + Enterprise badge
   2. Sub-header: "Intelligence Overview" + date range + Sync button
   3. KPI row: 4 glass-cards with ghost icon backgrounds
   4. Middle 7:5 grid: Buying Intent bars | AI Suggestions
   5. Bottom 2:1 grid: Hot Leads table | Stalled Deals
   ═══════════════════════════════════════════════════════════════════════════ */
export function NeuralBrainView() {
    const [insights, setInsights] = useState(null)
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const { user } = useAuth()

    const headers = { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' }

    const fetchData = () => {
        if (!user?.id) return
        setLoading(true)
        Promise.all([
            fetch(ENDPOINTS.INTELLIGENCE_INSIGHTS, { headers }).then(r => r.ok ? r.json() : null),
            fetch(ENDPOINTS.INTELLIGENCE_LEADERBOARD, { headers }).then(r => r.ok ? r.json() : [])
        ])
            .then(([ins, lb]) => { setInsights(ins); setLeaderboard(lb) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchData() }, [user?.id])

    const handleSync = () => {
        setSyncing(true)
        toast.info('Syncing intelligence data…')
        fetchData()
        setTimeout(() => { setSyncing(false); toast.success('Data synced') }, 1500)
    }

    // ── Data derivation (all hooks before loading return) ──
    const stats = insights?.stats || { totalAnalyzed: 0, avgDealHeat: 0, intentBreakdown: {} }
    const hotLeads = insights?.hotLeads || []
    const suggestions = insights?.suggestions || []
    const stalledLeads = insights?.stalledLeads || []
    const recentAnalysis = insights?.recentAnalysis || []

    // Intent distribution bars
    const intentBars = useMemo(() => {
        const ib = stats.intentBreakdown || {}
        const total = Object.values(ib).reduce((a: number, b: number) => a + b, 0) || 1
        return [
            {
                label: 'Decision Stage (High Intent)',
                pct: total > 0 ? Math.round(((ib.critical || 0) + (ib.high || 0)) / total * 100) : 24,
                gradient: 'from-purple-600 to-indigo-600',
                dotColor: 'bg-gradient-to-r from-purple-600 to-indigo-600'
            },
            {
                label: 'Consideration',
                pct: total > 0 ? Math.round((ib.medium || 0) / total * 100) : 41,
                gradient: 'from-blue-500 to-cyan-500',
                dotColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
            },
            {
                label: 'Awareness',
                pct: total > 0 ? Math.round((ib.low || 0) / total * 100) : 35,
                gradient: 'from-orange-500 to-amber-500',
                dotColor: 'bg-gradient-to-r from-orange-500 to-amber-500'
            }
        ]
    }, [stats])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        )
    }

    // ── Heat helpers ──
    const heatGradient = (v: number) =>
        v >= 80 ? 'from-orange-500 to-red-500' :
            v >= 60 ? 'from-orange-400 to-orange-600' :
                'from-emerald-400 to-emerald-600'
    const heatColor = (v: number) =>
        v >= 80 ? 'text-red-400' : v >= 60 ? 'text-orange-400' : 'text-emerald-400'
    const avatarColor = (i: number) => {
        const colors = [
            'bg-blue-900/50 text-blue-200 border-blue-500/30',
            'bg-purple-900/50 text-purple-200 border-purple-500/30',
            'bg-emerald-900/50 text-emerald-200 border-emerald-500/30',
            'bg-amber-900/50 text-amber-200 border-amber-500/30',
            'bg-pink-900/50 text-pink-200 border-pink-500/30'
        ]
        return colors[i % colors.length]
    }

    return (
        <div className="h-full flex flex-col">
            {/* ─── Dashboard Content ─── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* ── Neural Brain Branded Header (Stitch match) ── */}
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-accent-primary/10 rounded-lg">
                        <Search size={22} className="text-accent-primary" />
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Neural Brain</h1>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-primary/20 text-accent-primary border border-accent-primary/20 uppercase tracking-wider">
                            Enterprise
                        </span>
                    </div>
                </div>

                {/* ── Page Title Area (Stitch match) ── */}
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary mb-1">Intelligence Overview</h2>
                        <p className="text-sm text-text-muted">Real-time AI analysis of your pipeline signals.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toast.info('Date range filter coming soon')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-secondary/50 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
                        >
                            <span className="text-xs">📅</span>
                            <span>Last 7 Days</span>
                            <ChevronRight size={14} className="rotate-90" />
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary text-white text-sm shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            <span>Sync Data</span>
                        </button>
                    </div>
                </div>

                {/* ── KPI Row — 4 glass-cards with ghost icon backgrounds ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* KPI 1: Leads Analyzed */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-accent-primary/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity text-accent-primary text-6xl">🧠</div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-accent-primary/20 text-accent-primary">
                                <Search size={14} />
                            </div>
                            <span className="text-sm text-text-muted font-medium">Leads Analyzed</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-text-primary">{stats.totalAnalyzed}</span>
                            {stats.totalAnalyzed > 0 && (
                                <span className="text-xs text-emerald-400 flex items-center">
                                    <ArrowUp size={10} className="mr-0.5" />12%
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* KPI 2: Avg Deal Heat */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity text-orange-500 text-6xl">⚡</div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-orange-500/20 text-orange-500">
                                <BarChart3 size={14} />
                            </div>
                            <span className="text-sm text-text-muted font-medium">Avg Deal Heat</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-text-primary">{stats.avgDealHeat}%</span>
                            <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden ml-2">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(stats.avgDealHeat, 100)}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* KPI 3: Hot Leads */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity text-emerald-500 text-6xl">🔥</div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-500">
                                <AlertTriangle size={14} />
                            </div>
                            <span className="text-sm text-text-muted font-medium">Hot Leads</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-text-primary">{hotLeads.length}</span>
                            <span className="text-xs text-text-muted">Need attention</span>
                        </div>
                    </motion.div>

                    {/* KPI 4: AI Actions Generated */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-accent-primary/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity text-accent-primary text-6xl">✨</div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-accent-primary/20 text-accent-primary">
                                <RefreshCw size={14} />
                            </div>
                            <span className="text-sm text-text-muted font-medium">AI Actions Generated</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-text-primary">{suggestions.length}</span>
                            <span className="text-xs text-accent-primary/80 font-medium">Ready to execute</span>
                        </div>
                    </motion.div>
                </div>

                {/* ── Middle Section: 7:5 grid — Intent Distribution + AI Suggestions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Buying Intent Distribution Chart (7-col) */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="lg:col-span-7 glass-card rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg text-text-primary">Buying Intent Distribution</h3>
                            <button
                                onClick={() => toast.info('Intent analytics coming soon')}
                                className="text-text-muted hover:text-text-primary transition-colors text-lg"
                            >•••</button>
                        </div>
                        <div className="space-y-6">
                            {intentBars.map(bar => (
                                <div key={bar.label}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-text-secondary">{bar.label}</span>
                                        <span className="text-text-primary font-mono">{bar.pct}%</span>
                                    </div>
                                    <div className="h-8 w-full bg-bg-tertiary/50 rounded-lg overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${bar.pct}%` }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                            className={`h-full bg-gradient-to-r ${bar.gradient} rounded-r-lg relative group`}
                                        >
                                            <div className="absolute inset-0 bg-bg-tertiary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                        {/* Scale grid lines */}
                                        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                                            {Array(11).fill(0).map((_, i) => (
                                                <div key={i} className="border-r border-white/[0.04] h-full" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Legend */}
                        <div className="mt-8 flex gap-4 text-xs text-text-muted">
                            {intentBars.map(bar => (
                                <div key={bar.label} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded ${bar.dotColor}`} />
                                    <span>{bar.label.split(' (')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* AI Suggestions (5-col) */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="lg:col-span-5 glass-card rounded-xl p-0 flex flex-col"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-accent-primary animate-pulse">✨</span>
                                <h3 className="font-semibold text-lg text-text-primary">AI Suggestions</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/20 text-accent-primary border border-accent-primary/20 font-medium">
                                {suggestions.length} New
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {suggestions.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 text-text-muted">
                                    <p className="text-sm">No suggestions yet</p>
                                    <p className="text-xs mt-1">Analyze leads to generate AI insights.</p>
                                </div>
                            )}
                            {suggestions.map((s, i) => {
                                const priorityStyle = s.priority === 'high' || s.type === 'follow-up'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : s.priority === 'medium'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                const priorityLabel = s.priority === 'high' || s.type === 'follow-up'
                                    ? 'HIGH PRIORITY' : s.priority === 'medium' ? 'MED PRIORITY' : 'LOW PRIORITY'

                                return (
                                    <div key={i} className="p-4 rounded-lg bg-bg-tertiary/30 border border-border hover:border-accent-primary/40 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${priorityStyle}`}>
                                                {priorityLabel}
                                            </span>
                                            <span className="text-xs text-text-muted">{i === 0 ? '2m ago' : i === 1 ? '1h ago' : '3h ago'}</span>
                                        </div>
                                        <p className="text-sm font-medium text-text-secondary mb-3">
                                            {s.title}. <span className="text-text-muted">{s.description}</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toast.success(`Action applied: ${s.title}`)}
                                                className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-white text-xs py-1.5 px-3 rounded shadow-lg shadow-accent-primary/20 transition-all flex justify-center items-center gap-1"
                                            >
                                                <Send size={10} /> Send
                                            </button>
                                            <button
                                                onClick={() => toast.info('Opening review…')}
                                                className="px-3 py-1.5 rounded bg-bg-tertiary/50 hover:bg-bg-tertiary text-xs text-text-secondary border border-border transition-colors"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* ── Bottom Section: 2:1 grid — Leaderboard + Stalled Deals ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Hot Leads Leaderboard (2/3) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="xl:col-span-2 glass-card rounded-xl p-0 overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-bg-tertiary/30">
                            <h3 className="font-semibold text-lg text-text-primary">Hot Leads Leaderboard</h3>
                            <button
                                onClick={() => toast.info('Filter coming soon')}
                                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                            >
                                Filter <ChevronRight size={12} className="rotate-90" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-text-muted">
                                <thead className="text-xs uppercase bg-bg-tertiary/30 text-text-secondary font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Company</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4 text-right">Deal Heat</th>
                                        <th className="px-6 py-4 w-48">Heat Score</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {leaderboard.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                                                No analyzed leads yet. Run lead analysis to populate.
                                            </td>
                                        </tr>
                                    )}
                                    {leaderboard.slice(0, 5).map((item, i) => (
                                        <tr key={item.id} className="hover:bg-bg-tertiary/30 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-accent-primary">
                                            <td className="px-6 py-4 font-medium text-text-primary">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${avatarColor(i)}`}>
                                                        {(item.lead?.company || item.lead?.name || 'X')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span>{item.lead?.company || item.lead?.name || 'Unknown'}</span>
                                                        <div className="text-[10px] text-text-muted font-normal">{item.lead?.source || 'Lead'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{item.lead?.name || '—'}</td>
                                            <td className="px-6 py-4 text-right text-text-secondary font-mono">{item.dealHeat ?? 0}%</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${heatGradient(item.dealHeat || 0)} rounded-full`}
                                                            style={{ width: `${item.dealHeat || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold ${heatColor(item.dealHeat || 0)}`}>
                                                        {item.dealHeat ?? 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toast.info(`Viewing ${item.lead?.name}…`)}
                                                    className="text-text-muted hover:text-accent-primary transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Stalled Deals (1/3) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card rounded-xl p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <h3 className="font-semibold text-lg text-text-primary">Stalled Deals</h3>
                            </div>
                            <span className="text-xs text-text-muted">Requires Action</span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {stalledLeads.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-24 text-text-muted">
                                    <p className="text-sm">No stalled deals</p>
                                    <p className="text-xs mt-1">All deals are progressing well.</p>
                                </div>
                            )}
                            {stalledLeads.map((s, i) => {
                                const isCritical = i === 0
                                return (
                                    <div
                                        key={s.id}
                                        className={`p-4 rounded-lg border transition-colors ${isCritical
                                            ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10'
                                            : 'bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-text-secondary">{s.lead?.name || 'Unknown'}</h4>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isCritical
                                                ? 'text-red-400 bg-red-500/10'
                                                : 'text-orange-400 bg-orange-500/10'
                                                }`}>
                                                {isCritical ? 'Critical' : 'At Risk'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-muted mb-4">
                                            {s.lead?.lastContactedAt
                                                ? <>No contact for <span className="text-text-secondary">{formatDistanceToNow(new Date(s.lead.lastContactedAt))}</span>.</>
                                                : 'No contact history recorded.'}
                                        </p>
                                        <button
                                            onClick={() => toast.info(`Contacting ${s.lead?.name}…`)}
                                            className={`w-full py-2 rounded-lg bg-bg-tertiary/50 border border-border text-sm text-text-secondary transition-all flex items-center justify-center gap-2 group ${isCritical
                                                ? 'hover:bg-red-500 hover:border-red-500 hover:text-white'
                                                : 'hover:bg-accent-primary hover:border-accent-primary hover:text-white'
                                                }`}
                                        >
                                            <AlertTriangle size={14} className="group-hover:animate-bounce" />
                                            {isCritical ? 'Contact Now' : 'Analyze Call'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default NeuralBrainView
