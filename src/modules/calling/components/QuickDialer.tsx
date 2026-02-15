import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, User, ScrollText, Loader2, Search, Building2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import type { CallScript } from '../hooks/useCalls'

interface Lead {
    id: string
    name: string
    company?: string
    phone?: string
    email?: string
}

interface Props {
    scripts: CallScript[]
    onInitiateCall: (data: { leadId: string; scriptId?: string }) => Promise<any>
    prefilledLeadId?: string
    prefilledLeadName?: string
}

export function QuickDialer({ scripts, onInitiateCall, prefilledLeadId, prefilledLeadName }: Props) {
    const { user } = useAuth()
    const [selectedLead, setSelectedLead] = useState<Lead | null>(
        prefilledLeadId ? { id: prefilledLeadId, name: prefilledLeadName || '' } : null
    )
    const [query, setQuery] = useState(prefilledLeadName || '')
    const [leads, setLeads] = useState<Lead[]>([])
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [scriptId, setScriptId] = useState('')
    const [calling, setCalling] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch all leads once
    useEffect(() => {
        if (!user) return
        fetch(ENDPOINTS.LEADS, {
            headers: { 'x-user-id': user.id }
        })
            .then(r => r.json())
            .then(data => setLeads(Array.isArray(data) ? data : []))
            .catch(() => {})
    }, [user])

    // Filter leads client-side as user types
    useEffect(() => {
        if (!query.trim() || selectedLead) {
            setFilteredLeads([])
            return
        }
        const q = query.toLowerCase()
        const results = leads.filter(l =>
            l.name?.toLowerCase().includes(q) ||
            l.company?.toLowerCase().includes(q) ||
            l.phone?.includes(q) ||
            l.email?.toLowerCase().includes(q)
        ).slice(0, 8)
        setFilteredLeads(results)
        setShowDropdown(results.length > 0)
    }, [query, leads, selectedLead])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead)
        setQuery(lead.name)
        setShowDropdown(false)
    }

    const handleClearLead = () => {
        if (prefilledLeadId) return
        setSelectedLead(null)
        setQuery('')
        inputRef.current?.focus()
    }

    const handleCall = async () => {
        if (!selectedLead) {
            toast.error('Please select a lead')
            return
        }
        setCalling(true)
        try {
            const result = await onInitiateCall({ leadId: selectedLead.id, scriptId: scriptId || undefined })
            if (result) {
                toast.success(`Call initiated to ${selectedLead.name}`)
                if (!prefilledLeadId) {
                    setSelectedLead(null)
                    setQuery('')
                }
            } else {
                toast.error('Failed to initiate call')
            }
        } catch {
            toast.error('Failed to initiate call')
        } finally {
            setCalling(false)
        }
    }

    return (
        <div className="bg-bg-secondary rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Phone size={14} className="text-cyan-500" />
                Quick Dial
            </h3>

            <div className="space-y-3">
                {/* Lead Search */}
                <div ref={dropdownRef}>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">
                        Lead
                    </label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value)
                                if (selectedLead) setSelectedLead(null)
                            }}
                            onFocus={() => {
                                if (filteredLeads.length > 0 && !selectedLead) setShowDropdown(true)
                            }}
                            placeholder="Search leads by name, company..."
                            disabled={!!prefilledLeadId}
                            className="w-full pl-9 pr-8 py-2 text-xs bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-60"
                        />
                        {selectedLead && !prefilledLeadId && (
                            <button
                                onClick={handleClearLead}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-bg-secondary text-text-muted"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Selected lead info */}
                    {selectedLead && (
                        <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                            <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                <User size={10} className="text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-text-primary truncate">{selectedLead.name}</p>
                                <div className="flex items-center gap-2">
                                    {selectedLead.company && (
                                        <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                            <Building2 size={8} /> {selectedLead.company}
                                        </span>
                                    )}
                                    {selectedLead.phone && (
                                        <span className="text-[10px] text-text-muted">{selectedLead.phone}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-bg-secondary border border-border rounded-lg shadow-xl">
                            {filteredLeads.map(lead => (
                                <button
                                    key={lead.id}
                                    onClick={() => handleSelectLead(lead)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
                                >
                                    <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                        <User size={11} className="text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text-primary truncate">{lead.name}</p>
                                        <div className="flex items-center gap-2">
                                            {lead.company && (
                                                <span className="text-[10px] text-text-muted truncate">{lead.company}</span>
                                            )}
                                            {lead.phone && (
                                                <span className="text-[10px] text-text-muted">{lead.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Script Select */}
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">
                        Script (optional)
                    </label>
                    <div className="relative">
                        <ScrollText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <select
                            value={scriptId}
                            onChange={e => setScriptId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none"
                        >
                            <option value="">No script</option>
                            {scripts.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Call Button */}
                <button
                    onClick={handleCall}
                    disabled={calling || !selectedLead}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                >
                    {calling ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Dialing...
                        </>
                    ) : (
                        <>
                            <Phone size={14} />
                            Start Call
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
