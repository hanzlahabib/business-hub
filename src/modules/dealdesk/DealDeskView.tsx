// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Handshake, Target, FileText, DollarSign, Brain,
    Loader2, ChevronRight, TrendingUp, Briefcase, Trophy, Clock, MoreHorizontal, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ProposalEditor } from './components/ProposalEditor'

const statusBadge = {
    draft: 'bg-gray-500/15 text-gray-400',
    sent: 'bg-blue-500/15 text-blue-400',
    accepted: 'bg-green-500/15 text-green-400',
    rejected: 'bg-red-500/15 text-red-400'
}

const intentOrder = ['critical', 'high', 'medium', 'low']

const intentConfig = {
    critical: { label: 'Critical Intent', color: 'bg-rose-500', borderColor: 'border-l-rose-500', badgeBg: 'bg-rose-500/10', badgeText: 'text-rose-500', badgeBorder: 'border-rose-500/20', heatLabel: 'Hot', shadow: 'shadow-[0_0_8px_rgba(244,63,94,0.6)]' },
    high: { label: 'High Intent', color: 'bg-amber-500', borderColor: 'border-l-amber-500', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-500', badgeBorder: 'border-amber-500/20', heatLabel: 'Warm', shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]' },
    medium: { label: 'Medium Intent', color: 'bg-yellow-400', borderColor: 'border-l-yellow-400', badgeBg: 'bg-yellow-500/10', badgeText: 'text-yellow-500', badgeBorder: 'border-yellow-500/20', heatLabel: 'Mid', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    low: { label: 'Low Intent', color: 'bg-gray-400', borderColor: 'border-l-gray-400', badgeBg: 'bg-gray-500/10', badgeText: 'text-gray-500', badgeBorder: 'border-gray-500/20', heatLabel: 'Cold', shadow: 'shadow-[0_0_8px_rgba(156,163,175,0.6)]' },
}

export function DealDeskView() {
    const [tab, setTab] = useState('pipeline')
    const [pipeline, setPipeline] = useState([])
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProposal, setSelectedProposal] = useState(null)
    const { user } = useAuth()
    const navigate = useNavigate()

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    }), [user?.id])

    const fetchData = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const [leadersRes, proposalsRes] = await Promise.all([
                fetch(ENDPOINTS.INTELLIGENCE_LEADERBOARD, { headers: headers() }),
                fetch(ENDPOINTS.PROPOSALS, { headers: headers() })
            ])
            if (leadersRes.ok) setPipeline(await leadersRes.json())
            if (proposalsRes.ok) setProposals(await proposalsRes.json())
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [user?.id, headers])

    useEffect(() => { fetchData() }, [fetchData])

    const handleAnalyze = async (leadId) => {
        try {
            await fetch(ENDPOINTS.INTELLIGENCE_ANALYZE(leadId), { method: 'POST', headers: headers() })
            toast.success('Lead re-analyzed')
            fetchData()
        } catch { toast.error('Analysis failed') }
    }

    const handleCreateProposal = async (leadId) => {
        try {
            const res = await fetch(ENDPOINTS.PROPOSAL_GENERATE(leadId), { method: 'POST', headers: headers() })
            if (res.ok) { toast.success('Proposal draft generated'); fetchData() }
        } catch { toast.error('Generation failed') }
    }

    // Group pipeline by buyingIntent
    const grouped = useMemo(() => {
        const g = {}
        intentOrder.forEach(intent => { g[intent] = [] })
        pipeline.forEach(item => {
            const intent = item.buyingIntent || 'low'
            if (!g[intent]) g[intent] = []
            g[intent].push(item)
        })
        return g
    }, [pipeline])

    // Stats
    const stats = useMemo(() => {
        const totalValue = pipeline.reduce((sum, p) => sum + (p.dealValue || p.estimatedDealValue || 0), 0)
        const wonCount = proposals.filter(p => p.status === 'accepted').length
        const totalProposals = proposals.length || 1
        return {
            totalValue: totalValue >= 1000000 ? `$${(totalValue / 1000000).toFixed(1)}M` : `$${(totalValue / 1000).toFixed(0)}k`,
            dealsInProgress: pipeline.length,
            winRate: Math.round((wonCount / totalProposals) * 100),
            avgCloseTime: 21
        }
    }, [pipeline, proposals])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Stitch-style toolbar + stats */}
            <div className="px-8 pt-6 pb-2 shrink-0">
                <div className="flex flex-col gap-5">
                    {/* Title + View Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Handshake className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Deal Desk</h1>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center border-b border-border">
                        {[
                            { id: 'pipeline', label: 'Pipeline' },
                            { id: 'proposals', label: 'Proposals' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                                    ? 'text-emerald-500 border-emerald-500'
                                    : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Stats Summary Strip */}
                    {tab === 'pipeline' && (
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Total Pipeline Value</p>
                                    <p className="text-2xl font-bold text-text-primary font-mono">{stats.totalValue}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Deals in Progress</p>
                                    <p className="text-2xl font-bold text-text-primary font-mono">{stats.dealsInProgress}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Win Rate</p>
                                    <p className="text-2xl font-bold text-text-primary font-mono">{stats.winRate}%</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            <div className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Avg Close Time</p>
                                    <p className="text-2xl font-bold text-text-primary font-mono">{stats.avgCloseTime} <span className="text-sm text-text-muted font-sans font-normal">days</span></p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline Tab — Kanban */}
            {tab === 'pipeline' && (
                <div className="flex-1 overflow-x-auto px-8 pb-8">
                    <div className="flex gap-6 h-full min-w-[1200px]">
                        {intentOrder.map(intent => {
                            const config = intentConfig[intent]
                            const leads = grouped[intent] || []
                            const colValue = leads.reduce((s, p) => s + (p.dealValue || p.estimatedDealValue || 0), 0)

                            return (
                                <div key={intent} className="flex-1 flex flex-col min-w-[280px] h-full">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${config.color} ${config.shadow}`} />
                                            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{config.label}</h3>
                                            <span className="text-xs font-medium text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">{leads.length}</span>
                                        </div>
                                        <span className="text-xs font-mono text-text-muted">
                                            ${colValue >= 1000 ? `${(colValue / 1000).toFixed(0)}k` : colValue}
                                        </span>
                                    </div>
                                    {/* Column Content */}
                                    <div className="flex-1 bg-bg-secondary/50 rounded-xl p-2 flex flex-col gap-3 overflow-y-auto border border-border/50">
                                        {leads.map(item => (
                                            <div
                                                key={item.id}
                                                className={`group bg-bg-secondary border-l-4 ${config.borderColor} border-y border-r border-border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-border-hover transition-all cursor-pointer`}
                                                onClick={() => navigate(`/leads`)}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-md bg-bg-tertiary flex items-center justify-center border border-border text-xs font-bold text-text-muted">
                                                            {(item.lead?.name || '?')[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-text-primary leading-tight">{item.lead?.name || 'Unknown'}</h4>
                                                            <p className="text-xs text-text-muted">{item.lead?.company || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <MoreHorizontal className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="mb-4 space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-text-muted">Deal Value</span>
                                                        <span className="text-sm font-bold text-text-primary font-mono">
                                                            ${((item.dealValue || item.estimatedDealValue || 0)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {item.lead?.title && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-text-muted">Contact</span>
                                                            <span className="text-xs text-text-secondary">{item.lead.name} ({item.lead.title})</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}>
                                                            {item.daysSinceLastContact || '?'} Days
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                                                            <span className="text-[10px] text-text-muted">{config.heatLabel}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCreateProposal(item.lead?.id) }}
                                                        className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 opacity-60 group-hover:opacity-100"
                                                    >
                                                        Proposal
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {leads.length === 0 && (
                                            <div className="text-center py-8 text-text-muted">
                                                <p className="text-xs">No deals</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Proposals Tab */}
            {tab === 'proposals' && (
                <div className="flex-1 overflow-auto px-8 pb-8 space-y-3">
                    {proposals.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No proposals yet</p>
                            <p className="text-xs mt-1">Generate proposals from the Pipeline tab or Lead Intelligence</p>
                        </div>
                    ) : (
                        proposals.map(p => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-accent-primary/30 transition-all cursor-pointer"
                                onClick={() => setSelectedProposal(p)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium text-text-primary truncate">{p.title}</p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status] || statusBadge.draft}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-muted">{p.lead?.name} • {p.lead?.company}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {p.totalValue && (
                                            <p className="text-sm font-bold text-text-primary">${p.totalValue.toLocaleString()}</p>
                                        )}
                                        <p className="text-[9px] text-text-muted">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Proposal Editor Modal */}
            <AnimatePresence>
                {selectedProposal && (
                    <ProposalEditor
                        proposal={selectedProposal}
                        onClose={() => setSelectedProposal(null)}
                        onUpdate={(updated) => {
                            setProposals(prev => prev.map(p => p.id === updated.id ? updated : p))
                            setSelectedProposal(null)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default DealDeskView
