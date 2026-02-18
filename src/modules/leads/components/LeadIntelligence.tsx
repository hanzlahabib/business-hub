
import { useState, useEffect, useCallback } from 'react'
import {
    Brain, RefreshCw, FileText, TrendingUp, AlertTriangle,
    Lightbulb, Target, DollarSign, Clock, User, Loader2, Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { fetchGet, fetchMutation } from '../../../utils/authHeaders'
import { toast } from 'sonner'

interface Intelligence {
    id: string
    dealHeat: number | null
    buyingIntent: string | null
    budget: string | null
    timeline: string | null
    decisionMaker: string | null
    painPoints: string[]
    keyInsights: string[]
    risks: string[]
    nextBestAction: string | null
    summary: string | null
    lastAnalyzedAt: string
}

const intentColors: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
}

function HeatGauge({ value }: { value: number }) {
    const color = value >= 80 ? 'text-red-400' : value >= 60 ? 'text-orange-400' : value >= 40 ? 'text-amber-400' : 'text-gray-400'
    const bgColor = value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-500' : value >= 40 ? 'bg-amber-500' : 'bg-gray-500'

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Deal Heat</span>
                    <span className={`text-lg font-bold ${color}`}>{value}%</span>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${bgColor}`}
                    />
                </div>
            </div>
        </div>
    )
}

export function LeadIntelligence({ leadId }: { leadId: string }) {
    const [intel, setIntel] = useState<Intelligence | null>(null)
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [generating, setGenerating] = useState(false)
    const { user } = useAuth()

    const fetchIntel = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const data = await fetchGet(ENDPOINTS.INTELLIGENCE_LEAD(leadId))
            setIntel(data)
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [leadId, user?.id])

    useEffect(() => { fetchIntel() }, [fetchIntel])

    const handleAnalyze = async () => {
        setAnalyzing(true)
        try {
            const data = await fetchMutation(ENDPOINTS.INTELLIGENCE_ANALYZE(leadId), 'POST')
            setIntel(data)
            toast.success('Lead analyzed successfully')
        } catch { toast.error('Analysis failed') }
        finally { setAnalyzing(false) }
    }

    const handleGenerateProposal = async () => {
        setGenerating(true)
        try {
            await fetchMutation(ENDPOINTS.PROPOSAL_GENERATE(leadId), 'POST')
            toast.success('Proposal draft generated')
        } catch { toast.error('Proposal generation failed') }
        finally { setGenerating(false) }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
        )
    }

    if (!intel) {
        return (
            <div className="text-center py-8">
                <Brain className="w-8 h-8 mx-auto mb-3 text-text-muted opacity-40" />
                <p className="text-sm text-text-muted mb-3">No intelligence data yet</p>
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                    {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                    {analyzing ? 'Analyzing...' : 'Analyze Lead'}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex-1 py-2 rounded-lg bg-bg-tertiary border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Re-analyze
                </button>
                <button
                    onClick={handleGenerateProposal}
                    disabled={generating}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                    Generate Proposal
                </button>
            </div>

            {/* Deal Heat */}
            <div className="p-3 rounded-xl bg-bg-tertiary border border-border">
                <HeatGauge value={intel.dealHeat || 0} />
                {intel.buyingIntent && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">Intent:</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${intentColors[intel.buyingIntent] || intentColors.low}`}>
                            {intel.buyingIntent.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {/* AI Summary */}
            {intel.summary && (
                <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Brain size={12} className="text-violet-400" />
                        <span className="text-[10px] font-semibold text-violet-400">AI Summary</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{intel.summary}</p>
                </div>
            )}

            {/* Extracted Fields */}
            <div className="grid grid-cols-3 gap-2">
                {intel.budget && (
                    <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border">
                        <DollarSign size={12} className="text-green-400 mb-1" />
                        <p className="text-[10px] text-text-muted">Budget</p>
                        <p className="text-xs font-medium text-text-primary">{intel.budget}</p>
                    </div>
                )}
                {intel.timeline && (
                    <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border">
                        <Clock size={12} className="text-blue-400 mb-1" />
                        <p className="text-[10px] text-text-muted">Timeline</p>
                        <p className="text-xs font-medium text-text-primary">{intel.timeline}</p>
                    </div>
                )}
                {intel.decisionMaker && (
                    <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border">
                        <User size={12} className="text-amber-400 mb-1" />
                        <p className="text-[10px] text-text-muted">Decision Maker</p>
                        <p className="text-xs font-medium text-text-primary">{intel.decisionMaker}</p>
                    </div>
                )}
            </div>

            {/* Key Insights */}
            {intel.keyInsights?.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb size={12} className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-text-secondary">Key Insights</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {intel.keyInsights.map((insight, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {insight}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pain Points */}
            {intel.painPoints?.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target size={12} className="text-red-400" />
                        <span className="text-[10px] font-semibold text-text-secondary">Pain Points</span>
                    </div>
                    <ul className="space-y-1">
                        {intel.painPoints.map((point, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Risks */}
            {intel.risks?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={12} className="text-red-400" />
                        <span className="text-[10px] font-semibold text-red-400">Risks</span>
                    </div>
                    <ul className="space-y-1">
                        {intel.risks.map((risk, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                <span className="text-red-400 mt-0.5">⚠</span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Next Best Action */}
            {intel.nextBestAction && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap size={12} className="text-accent-primary" />
                        <span className="text-[10px] font-semibold text-accent-primary">Next Best Action</span>
                    </div>
                    <p className="text-xs font-medium text-text-primary">{intel.nextBestAction}</p>
                </div>
            )}

            {/* Last analyzed */}
            <p className="text-[9px] text-text-muted/50 text-right">
                Last analyzed: {new Date(intel.lastAnalyzedAt).toLocaleString()}
            </p>
        </div>
    )
}
