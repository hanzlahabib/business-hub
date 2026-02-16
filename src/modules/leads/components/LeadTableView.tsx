// @ts-nocheck
import { useState, useMemo } from 'react'
import { Search, Filter, Plus, ChevronDown, MoreHorizontal, X, Building2 } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'

const statusStyles = {
    new: { label: 'New', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    contacted: { label: 'Contacted', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    replied: { label: 'Replied', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    qualified: { label: 'Qualified', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    meeting: { label: 'Meeting', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    negotiation: { label: 'Negotiation', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    won: { label: 'Won', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    lost: { label: 'Lost', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function getTimeSince(dateStr: string) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    return `${weeks}w ago`
}

function getDealHeat(lead: any): number {
    const statusScores = { new: 20, contacted: 35, replied: 50, qualified: 70, meeting: 80, negotiation: 90, won: 100, lost: 0 }
    return statusScores[lead.status] || 20
}

interface LeadTableViewProps {
    onLeadClick: (lead: any) => void
    onAddClick: () => void
    onImportClick: () => void
    selectedLeadId?: string | null
}

export function LeadTableView({ onLeadClick, onAddClick, onImportClick, selectedLeadId }: LeadTableViewProps) {
    const { leads, loading } = useLeads()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [industryFilter, setIndustryFilter] = useState('')
    const [sourceFilter, setSourceFilter] = useState('')
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<'lastActive' | 'name'>('lastActive')

    const filteredLeads = useMemo(() => {
        let result = [...leads]
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(l =>
                l.name?.toLowerCase().includes(q) ||
                l.company?.toLowerCase().includes(q) ||
                l.email?.toLowerCase().includes(q)
            )
        }
        if (statusFilter) {
            result = result.filter(l => l.status === statusFilter)
        }
        if (industryFilter) {
            result = result.filter(l => l.industry?.toLowerCase() === industryFilter.toLowerCase())
        }
        if (sourceFilter) {
            result = result.filter(l => l.source?.toLowerCase() === sourceFilter.toLowerCase())
        }
        if (sortBy === 'name') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        } else {
            result.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        }
        return result
    }, [leads, search, statusFilter, industryFilter, sourceFilter, sortBy])

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    }

    const toggleAll = () => {
        if (selectedRows.length === filteredLeads.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredLeads.map(l => l.id))
        }
    }

    const clearFilters = () => {
        setStatusFilter('')
        setIndustryFilter('')
        setSourceFilter('')
        setSearch('')
    }

    const hasFilters = statusFilter || industryFilter || sourceFilter

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Action Toolbar — Stitch grid layout */}
            <div className="p-4 grid grid-cols-12 gap-4 items-center">
                {/* Search */}
                <div className="col-span-4 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search leads, companies..."
                        className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                    />
                </div>

                {/* Filters — Status, Industry, Source (matching Stitch reference) */}
                <div className="col-span-6 flex items-center gap-2">
                    <button
                        onClick={() => setStatusFilter(statusFilter ? '' : 'new')}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${statusFilter ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary hover:border-border-hover'
                            }`}
                    >
                        <Filter className="w-4 h-4 text-text-muted" />
                        Status
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <button
                        onClick={() => setIndustryFilter(industryFilter ? '' : 'tech')}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${industryFilter ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary hover:border-border-hover'
                            }`}
                    >
                        <Building2 className="w-4 h-4 text-text-muted" />
                        Industry
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <button
                        onClick={() => setSourceFilter(sourceFilter ? '' : 'linkedin')}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${sourceFilter ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary hover:border-border-hover'
                            }`}
                    >
                        <Filter className="w-4 h-4 text-text-muted" />
                        Source
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <div className="h-6 w-px bg-border mx-1" />
                    <button
                        onClick={clearFilters}
                        className={`text-text-muted hover:text-accent-primary text-sm font-medium transition-colors ${hasFilters ? 'text-accent-primary' : ''}`}
                    >
                        Clear All
                    </button>
                </div>

                {/* Add Lead */}
                <div className="col-span-2 flex justify-end">
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 bg-accent-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-accent-primary/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border-t border-border">
                <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.length === filteredLeads.length && filteredLeads.length > 0}
                                    onChange={toggleAll}
                                    className="rounded border-border bg-bg-secondary text-accent-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                                />
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary cursor-pointer hover:text-text-primary group"
                                onClick={() => setSortBy(sortBy === 'name' ? 'lastActive' : 'name')}
                            >
                                <div className="flex items-center gap-1">
                                    Name
                                    <ChevronDown className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${sortBy === 'name' ? '!opacity-100' : ''}`} />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary">Source</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary w-32">Deal Heat</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary">Last Contact</th>
                            <th className="px-4 py-3 border-b border-border bg-bg-secondary w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map(lead => {
                            const isSelected = selectedLeadId === lead.id
                            const heat = getDealHeat(lead)
                            const style = statusStyles[lead.status] || statusStyles.new

                            return (
                                <tr
                                    key={lead.id}
                                    onClick={() => onLeadClick(lead)}
                                    className={`group cursor-pointer transition-colors ${isSelected
                                        ? 'bg-accent-primary/5 border-l-2 border-l-accent-primary'
                                        : lead.status === 'lost'
                                            ? 'opacity-60 hover:bg-bg-secondary border-l-2 border-l-transparent'
                                            : 'hover:bg-bg-secondary border-l-2 border-l-transparent'
                                        }`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm border-b border-border/50" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(lead.id)}
                                            onChange={() => toggleRow(lead.id)}
                                            className="rounded border-border bg-bg-secondary text-accent-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                                        />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm border-b border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'border border-accent-primary/30 bg-accent-primary/10 text-accent-primary' : 'bg-bg-tertiary text-text-muted'
                                                }`}>
                                                {getInitials(lead.name)}
                                            </div>
                                            <div>
                                                <div className={`font-medium ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{lead.name}</div>
                                                <div className="text-xs text-text-muted">{lead.title || lead.role || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            {lead.company && (
                                                <div className="w-5 h-5 rounded bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-muted">
                                                    {lead.company?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            {lead.company || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm border-b border-border/50">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                                            {style.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted border-b border-border/50">
                                        {lead.source || '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${heat >= 70 ? 'bg-gradient-to-r from-blue-400 to-accent-primary' : 'bg-blue-400'}`}
                                                    style={{ width: `${heat}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium ${heat >= 70 ? 'text-accent-primary' : 'text-text-muted'}`}>
                                                {heat}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-text-muted border-b border-border/50">
                                        {getTimeSince(lead.updatedAt || lead.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right border-b border-border/50">
                                        <button className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}

                        {filteredLeads.length === 0 && !loading && (
                            <tr>
                                <td colSpan={8} className="text-center py-16 text-text-muted">
                                    <p className="text-sm">No leads found</p>
                                    <button onClick={onAddClick} className="mt-2 text-xs text-accent-primary hover:underline">
                                        Add your first lead
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LeadTableView
