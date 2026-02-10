import { useState } from 'react'
import { Save, X, Plus, Trash2 } from 'lucide-react'
import type { CallScript } from '../hooks/useCalls'

interface Props {
    script: CallScript | null
    onSave: (data: Partial<CallScript>) => void
    onCancel: () => void
}

export function ScriptEditor({ script, onSave, onCancel }: Props) {
    const [name, setName] = useState(script?.name || '')
    const [purpose, setPurpose] = useState(script?.purpose || '')
    const [industry, setIndustry] = useState(script?.industry || '')
    const [openingLine, setOpeningLine] = useState(script?.openingLine || '')
    const [closingStrategy, setClosingStrategy] = useState(script?.closingStrategy || '')
    const [talkingPoints, setTalkingPoints] = useState<Array<{ topic: string; script: string }>>(
        (script?.talkingPoints as any) || [{ topic: '', script: '' }]
    )
    const [objectionHandlers, setObjectionHandlers] = useState<Array<{ objection: string; response: string }>>(
        (script?.objectionHandlers as any) || [{ objection: '', response: '' }]
    )
    const [rateMin, setRateMin] = useState<number>((script?.rateRange as any)?.min || 0)
    const [rateMax, setRateMax] = useState<number>((script?.rateRange as any)?.max || 0)
    const [rateTarget, setRateTarget] = useState<number>((script?.rateRange as any)?.target || 0)

    const handleSave = () => {
        if (!name.trim()) return
        onSave({
            name,
            purpose: purpose || undefined,
            industry: industry || undefined,
            openingLine: openingLine || undefined,
            closingStrategy: closingStrategy || undefined,
            talkingPoints: talkingPoints.filter(t => t.topic.trim()) as any,
            objectionHandlers: objectionHandlers.filter(o => o.objection.trim()) as any,
            rateRange: (rateMin || rateMax || rateTarget) ? { min: rateMin, max: rateMax, target: rateTarget } as any : undefined,
        })
    }

    const inputClass = "w-full text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"

    return (
        <div className="bg-bg-secondary rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                    {script ? 'Edit Script' : 'New Script'}
                </h3>
                <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted">
                    <X size={16} />
                </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Script name" className={inputClass} />
                </div>
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Purpose</label>
                    <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Schedule demo call" className={inputClass} />
                </div>
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS" className={inputClass} />
                </div>
            </div>

            {/* Opening Line */}
            <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Opening Line</label>
                <textarea value={openingLine} onChange={e => setOpeningLine(e.target.value)} placeholder="Hi, this is..." rows={2} className={inputClass + ' resize-none'} />
            </div>

            {/* Talking Points */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Talking Points</label>
                    <button onClick={() => setTalkingPoints(prev => [...prev, { topic: '', script: '' }])} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                        <Plus size={10} /> Add
                    </button>
                </div>
                <div className="space-y-2">
                    {talkingPoints.map((tp, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={tp.topic}
                                onChange={e => setTalkingPoints(prev => prev.map((t, j) => j === i ? { ...t, topic: e.target.value } : t))}
                                placeholder="Topic"
                                className={inputClass + ' flex-[1]'}
                            />
                            <input
                                type="text"
                                value={tp.script}
                                onChange={e => setTalkingPoints(prev => prev.map((t, j) => j === i ? { ...t, script: e.target.value } : t))}
                                placeholder="Script line"
                                className={inputClass + ' flex-[2]'}
                            />
                            <button onClick={() => setTalkingPoints(prev => prev.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-300 flex-shrink-0">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Objection Handlers */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Objection Handlers</label>
                    <button onClick={() => setObjectionHandlers(prev => [...prev, { objection: '', response: '' }])} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                        <Plus size={10} /> Add
                    </button>
                </div>
                <div className="space-y-2">
                    {objectionHandlers.map((oh, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={oh.objection}
                                onChange={e => setObjectionHandlers(prev => prev.map((o, j) => j === i ? { ...o, objection: e.target.value } : o))}
                                placeholder="Objection"
                                className={inputClass + ' flex-[1]'}
                            />
                            <input
                                type="text"
                                value={oh.response}
                                onChange={e => setObjectionHandlers(prev => prev.map((o, j) => j === i ? { ...o, response: e.target.value } : o))}
                                placeholder="Response"
                                className={inputClass + ' flex-[2]'}
                            />
                            <button onClick={() => setObjectionHandlers(prev => prev.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-300 flex-shrink-0">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rate Range */}
            <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2 block">Rate Range ($/hr)</label>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] text-text-muted mb-1 block">Min</label>
                        <input type="number" value={rateMin || ''} onChange={e => setRateMin(Number(e.target.value))} placeholder="0" className={inputClass} />
                    </div>
                    <div>
                        <label className="text-[10px] text-text-muted mb-1 block">Target</label>
                        <input type="number" value={rateTarget || ''} onChange={e => setRateTarget(Number(e.target.value))} placeholder="0" className={inputClass} />
                    </div>
                    <div>
                        <label className="text-[10px] text-text-muted mb-1 block">Max</label>
                        <input type="number" value={rateMax || ''} onChange={e => setRateMax(Number(e.target.value))} placeholder="0" className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Closing Strategy */}
            <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Closing Strategy</label>
                <textarea value={closingStrategy} onChange={e => setClosingStrategy(e.target.value)} placeholder="How to close the call..." rows={2} className={inputClass + ' resize-none'} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                >
                    <Save size={14} />
                    {script ? 'Update' : 'Create'} Script
                </button>
                <button onClick={onCancel} className="px-4 py-2 text-xs text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary">
                    Cancel
                </button>
            </div>
        </div>
    )
}
