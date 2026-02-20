import { useState } from 'react'
import { PhoneOff, Plus, Search, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDNC } from '../hooks/useDNC'
import { EmptyState } from '../../../components/ui/empty-state'

const REASON_OPTIONS = [
    { value: 'manual', label: 'Manual Entry' },
    { value: 'sms-stop', label: 'SMS Stop Request' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'customer-request', label: 'Customer Request' },
]

const REASON_STYLES: Record<string, { bg: string; text: string }> = {
    manual: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    'sms-stop': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    complaint: { bg: 'bg-red-500/10', text: 'text-red-400' },
    'customer-request': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
}

export function DNCListManager() {
    const { dncList, loading, addToDNC, removeFromDNC } = useDNC()
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [addPhone, setAddPhone] = useState('')
    const [addReason, setAddReason] = useState('manual')
    const [adding, setAdding] = useState(false)
    const [removingPhone, setRemovingPhone] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const perPage = 10

    const filtered = dncList.filter(entry =>
        entry.name?.toLowerCase().includes(search.toLowerCase()) ||
        entry.phone?.includes(search)
    )

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

    const handleAdd = async () => {
        if (!addPhone.trim()) return
        setAdding(true)
        const ok = await addToDNC(addPhone.trim(), addReason)
        setAdding(false)
        if (ok) {
            setAddPhone('')
            setAddReason('manual')
            setShowAddModal(false)
        }
    }

    const handleRemove = async (phone: string) => {
        setRemovingPhone(phone)
        await removeFromDNC(phone)
        setRemovingPhone(null)
    }

    if (loading && dncList.length === 0) {
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">Do Not Call Registry</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                        Manage phone numbers that should never be called. {filtered.length} number{filtered.length !== 1 ? 's' : ''} registered.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
                >
                    <Plus size={14} />
                    Add Number
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0) }}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50"
                />
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl border border-border">
                    <EmptyState
                        icon={PhoneOff}
                        title={search ? 'No matches found' : 'No numbers on DNC list'}
                        description={search ? 'Try a different search term.' : 'Numbers added here will be excluded from all outbound calls.'}
                        action={!search ? { label: 'Add Number', onClick: () => setShowAddModal(true) } : undefined}
                    />
                </div>
            ) : (
                <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-bg-tertiary/30">
                                    <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Name</th>
                                    <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Phone</th>
                                    <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Reason</th>
                                    <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Date Added</th>
                                    <th className="text-right text-[10px] font-semibold text-text-muted uppercase tracking-wide px-4 py-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(entry => {
                                    const style = REASON_STYLES[entry.reason] || REASON_STYLES.manual
                                    return (
                                        <tr key={entry.id} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-text-primary">{entry.name || 'Unknown'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-text-secondary font-mono">{entry.phone}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-medium`}>
                                                    {REASON_OPTIONS.find(r => r.value === entry.reason)?.label || entry.reason}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] text-text-muted">
                                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleRemove(entry.phone)}
                                                    disabled={removingPhone === entry.phone}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-30"
                                                    title="Remove from DNC list"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <span className="text-[10px] text-text-muted">Page {page + 1} of {totalPages}</span>
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
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-text-primary">Add to Do Not Call List</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-bg-tertiary text-text-muted">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={addPhone}
                                    onChange={e => setAddPhone(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full px-3 py-2 text-xs bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">Reason</label>
                                <select
                                    value={addReason}
                                    onChange={e => setAddReason(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cyan-500/50"
                                >
                                    {REASON_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-5">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg border border-border text-text-muted hover:bg-bg-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={adding || !addPhone.trim()}
                                className="flex-1 px-3 py-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors disabled:opacity-30"
                            >
                                {adding ? 'Adding...' : 'Add to DNC'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
