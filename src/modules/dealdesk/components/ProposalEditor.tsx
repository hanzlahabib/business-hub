// @ts-nocheck
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    X, Save, Eye, Edit, Send, CheckCircle, XCircle, DollarSign, Loader2
} from 'lucide-react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getJsonAuthHeaders } from '../../../utils/authHeaders'
import { toast } from 'sonner'

interface ProposalSection {
    title: string
    body: string
}

interface PricingItem {
    item: string
    amount: number
    description: string
}

interface Proposal {
    id: string
    title: string
    status: string
    content: { sections: ProposalSection[]; pricing: PricingItem[] } | null
    totalValue: number | null
    lead: { id: string; name: string; company: string }
    createdAt: string
}

const statusActions = {
    draft: [{ label: 'Mark as Sent', status: 'sent', icon: Send, color: 'bg-blue-500' }],
    sent: [
        { label: 'Mark as Accepted', status: 'accepted', icon: CheckCircle, color: 'bg-green-500' },
        { label: 'Mark as Rejected', status: 'rejected', icon: XCircle, color: 'bg-red-500' }
    ],
    accepted: [],
    rejected: []
}

export function ProposalEditor({ proposal, onClose, onUpdate }: {
    proposal: Proposal; onClose: () => void; onUpdate: (p: Proposal) => void
}) {
    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [title, setTitle] = useState(proposal.title)
    const [sections, setSections] = useState<ProposalSection[]>(proposal.content?.sections || [])
    const [pricing, setPricing] = useState<PricingItem[]>(proposal.content?.pricing || [])
    const [saving, setSaving] = useState(false)
    const { user } = useAuth()

    const handleSave = async () => {
        setSaving(true)
        try {
            const totalValue = pricing.reduce((s, p) => s + (p.amount || 0), 0)
            const res = await fetch(`${ENDPOINTS.PROPOSALS}/${proposal.id}`, {
                method: 'PUT',
                headers: getJsonAuthHeaders(),
                body: JSON.stringify({ title, content: { sections, pricing }, totalValue })
            })
            if (res.ok) {
                const updated = await res.json()
                onUpdate(updated)
                toast.success('Proposal saved')
            }
        } catch { toast.error('Save failed') }
        finally { setSaving(false) }
    }

    const handleStatusChange = async (newStatus: string) => {
        setSaving(true)
        try {
            const res = await fetch(`${ENDPOINTS.PROPOSALS}/${proposal.id}`, {
                method: 'PUT',
                headers: getJsonAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                const updated = await res.json()
                onUpdate(updated)
                toast.success(`Proposal marked as ${newStatus}`)
            }
        } catch { toast.error('Status update failed') }
        finally { setSaving(false) }
    }

    const updateSection = (i: number, field: string, value: string) => {
        setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
    }

    const updatePricing = (i: number, field: string, value: string | number) => {
        setPricing(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
    }

    const totalValue = pricing.reduce((s, p) => s + (p.amount || 0), 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-3xl max-h-[85vh] bg-bg-secondary rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                        {mode === 'edit' ? (
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg font-bold text-text-primary bg-transparent border-b border-border focus:border-accent-primary outline-none w-full"
                            />
                        ) : (
                            <h2 className="text-lg font-bold text-text-primary truncate">{title}</h2>
                        )}
                        <p className="text-xs text-text-muted mt-0.5">
                            {proposal.lead?.name} • {proposal.lead?.company}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
                            className="p-2 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                        >
                            {mode === 'edit' ? <Eye size={16} /> : <Edit size={16} />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Sections */}
                    {sections.map((section, i) => (
                        <div key={i} className="p-4 rounded-xl bg-bg-tertiary/50 border border-border">
                            {mode === 'edit' ? (
                                <>
                                    <input
                                        value={section.title}
                                        onChange={(e) => updateSection(i, 'title', e.target.value)}
                                        className="text-sm font-semibold text-text-primary bg-transparent border-b border-border/50 outline-none w-full mb-2 focus:border-accent-primary"
                                    />
                                    <textarea
                                        value={section.body}
                                        onChange={(e) => updateSection(i, 'body', e.target.value)}
                                        className="text-xs text-text-secondary bg-transparent outline-none w-full min-h-[80px] resize-none focus:ring-1 focus:ring-accent-primary/30 rounded p-1"
                                    />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-semibold text-text-primary mb-2">{section.title}</h3>
                                    <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{section.body}</p>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Pricing */}
                    {pricing.length > 0 && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                                <DollarSign size={14} className="text-emerald-400" /> Pricing
                            </h3>
                            <div className="space-y-2">
                                {pricing.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3">
                                        {mode === 'edit' ? (
                                            <>
                                                <input
                                                    value={p.item}
                                                    onChange={(e) => updatePricing(i, 'item', e.target.value)}
                                                    className="flex-1 text-xs bg-transparent border-b border-border/50 outline-none text-text-primary focus:border-accent-primary"
                                                />
                                                <input
                                                    type="number"
                                                    value={p.amount}
                                                    onChange={(e) => updatePricing(i, 'amount', parseFloat(e.target.value) || 0)}
                                                    className="w-24 text-xs text-right bg-transparent border-b border-border/50 outline-none text-text-primary focus:border-accent-primary"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <p className="text-xs text-text-primary">{p.item}</p>
                                                    {p.description && <p className="text-[10px] text-text-muted">{p.description}</p>}
                                                </div>
                                                <span className="text-xs font-medium text-text-primary">${p.amount?.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-500/20">
                                <span className="text-xs font-semibold text-text-primary">Total</span>
                                <span className="text-sm font-bold text-emerald-400">${totalValue.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <div className="flex gap-2">
                        {(statusActions[proposal.status] || []).map(action => (
                            <button
                                key={action.status}
                                onClick={() => handleStatusChange(action.status)}
                                disabled={saving}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${action.color} hover:opacity-90 transition-opacity disabled:opacity-50`}
                            >
                                <action.icon size={12} /> {action.label}
                            </button>
                        ))}
                    </div>

                    {mode === 'edit' && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save Changes
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
