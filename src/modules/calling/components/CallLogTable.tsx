import { useState } from 'react'
import { ArrowUpDown, Filter, Phone, Clock, User, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { Call } from '../hooks/useCalls'

interface Props {
    calls: Call[]
    loading: boolean
    total: number
    onRefresh: (filters?: any) => void
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'in-progress': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    ringing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    queued: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
}

const OUTCOME_STYLES: Record<string, { bg: string; text: string }> = {
    booked: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'follow-up': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    'not-interested': { bg: 'bg-red-500/10', text: 'text-red-400' },
    'no-answer': { bg: 'bg-gray-500/10', text: 'text-gray-400' },
}

function formatDuration(seconds?: number): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

export function CallLogTable({ calls, loading, total, onRefresh }: Props) {
    const [statusFilter, setStatusFilter] = useState('')
    const [outcomeFilter, setOutcomeFilter] = useState('')
    const [sortBy, setSortBy] = useState<'createdAt' | 'duration'>('createdAt')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(0)
    const perPage = 10

    const filtered = calls
        .filter(c => !statusFilter || c.status === statusFilter)
        .filter(c => !outcomeFilter || c.outcome === outcomeFilter)

    const sorted = [...filtered].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortBy === 'createdAt') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return dir * ((a.duration || 0) - (b.duration || 0))
    })

    const paginated = sorted.slice(page * perPage, (page + 1) * perPage)
    const totalPages = Math.ceil(sorted.length / perPage)

    const toggleSort = (col: 'createdAt' | 'duration') => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortDir('desc') }
    }

    if (loading && calls.length === 0) {
        return (
            <div className="bg-bg-secondary rounded-xl border border-border p-6">
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 bg-bg-tertiary/50 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                <Filter size={14} className="text-text-muted" />
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                    className="text-xs bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-cyan-500/50"
                >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="failed">Failed</option>
                    <option value="queued">Queued</option>
                </select>
                <select
                    value={outcomeFilter}
                    onChange={e => { setOutcomeFilter(e.target.value); setPage(0) }}
                    className="text-xs bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-cyan-500/50"
                >
                    <option value="">All Outcomes</option>
                    <option value="booked">Booked</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="not-interested">Not Interested</option>
                    <option value="no-answer">No Answer</option>
                </select>
                <span className="text-[10px] text-text-muted ml-auto">{sorted.length} calls</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-bg-tertiary/30">
                            <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Lead</th>
                            <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Status</th>
                            <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Outcome</th>
                            <th
                                className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5 cursor-pointer hover:text-text-primary"
                                onClick={() => toggleSort('duration')}
                            >
                                <span className="flex items-center gap-1">Duration <ArrowUpDown size={10} /></span>
                            </th>
                            <th
                                className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5 cursor-pointer hover:text-text-primary"
                                onClick={() => toggleSort('createdAt')}
                            >
                                <span className="flex items-center gap-1">Date <ArrowUpDown size={10} /></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8">
                                    <Phone size={24} className="mx-auto text-text-muted/30 mb-2" />
                                    <p className="text-xs text-text-muted">No calls found</p>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(call => {
                                const status = STATUS_STYLES[call.status] || STATUS_STYLES.queued
                                const outcome = call.outcome ? OUTCOME_STYLES[call.outcome] : null

                                return (
                                    <tr key={call.id} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors cursor-pointer">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                                    <User size={11} className="text-cyan-400" />
                                                </div>
                                                <span className="text-xs font-medium text-text-primary">
                                                    {call.lead?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text} font-medium`}>
                                                {call.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {outcome ? (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${outcome.bg} ${outcome.text} font-medium`}>
                                                    {call.outcome}
                                                </span>
                                            ) : <span className="text-[10px] text-text-muted">-</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-text-muted flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDuration(call.duration)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] text-text-muted">
                                                {new Date(call.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <span className="text-[10px] text-text-muted">
                        Page {page + 1} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-30 text-text-muted"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-30 text-text-muted"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
