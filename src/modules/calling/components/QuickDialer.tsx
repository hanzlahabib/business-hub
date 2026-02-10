import { useState } from 'react'
import { Phone, User, ScrollText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CallScript } from '../hooks/useCalls'

interface Props {
    scripts: CallScript[]
    onInitiateCall: (data: { leadId: string; scriptId?: string }) => Promise<any>
    prefilledLeadId?: string
    prefilledLeadName?: string
}

export function QuickDialer({ scripts, onInitiateCall, prefilledLeadId, prefilledLeadName }: Props) {
    const [leadId, setLeadId] = useState(prefilledLeadId || '')
    const [scriptId, setScriptId] = useState('')
    const [calling, setCalling] = useState(false)

    const handleCall = async () => {
        if (!leadId.trim()) {
            toast.error('Please enter a Lead ID')
            return
        }
        setCalling(true)
        try {
            const result = await onInitiateCall({ leadId, scriptId: scriptId || undefined })
            if (result) {
                toast.success(`📞 Call initiated${prefilledLeadName ? ` to ${prefilledLeadName}` : ''}`)
                if (!prefilledLeadId) setLeadId('')
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
                {/* Lead ID Input */}
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">
                        Lead
                    </label>
                    <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={prefilledLeadName || leadId}
                            onChange={e => setLeadId(e.target.value)}
                            placeholder="Enter Lead ID..."
                            disabled={!!prefilledLeadId}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-60"
                        />
                    </div>
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
                    disabled={calling || !leadId.trim()}
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
