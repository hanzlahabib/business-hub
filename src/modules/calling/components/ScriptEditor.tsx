import { useState } from 'react'
import { Save, X, Plus, Trash2, ChevronDown, ChevronRight, Bot, Building2, Mic } from 'lucide-react'
import type { CallScript, AssistantConfig } from '../hooks/useCalls'

const VOICE_PRESETS = [
    { value: 'adam', label: 'Adam (Deep Male)' },
    { value: 'josh', label: 'Josh (Natural Male)' },
    { value: 'rachel', label: 'Rachel (Female)' },
    { value: 'arnold', label: 'Arnold (Deep Male)' },
    { value: 'bella', label: 'Bella (Soft Female)' },
]

const LLM_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, Cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fastest)' },
]

interface Props {
    script: CallScript | null
    onSave: (data: Partial<CallScript>) => void
    onCancel: () => void
}

export function ScriptEditor({ script, onSave, onCancel }: Props) {
    const ac = script?.assistantConfig || {} as AssistantConfig

    // Script fields
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

    // Assistant config fields
    const [businessName, setBusinessName] = useState(ac.businessName || '')
    const [businessWebsite, setBusinessWebsite] = useState(ac.businessWebsite || '')
    const [businessLocation, setBusinessLocation] = useState(ac.businessLocation || '')
    const [agentName, setAgentName] = useState(ac.agentName || '')
    const [agentRole, setAgentRole] = useState(ac.agentRole || '')
    const [conversationStyle, setConversationStyle] = useState(ac.conversationStyle || '')
    const [voiceId, setVoiceId] = useState(ac.voiceId || 'adam')
    const [llmModel, setLlmModel] = useState(ac.llmModel || 'gpt-4o-mini')
    const [temperature, setTemperature] = useState(ac.temperature ?? 0.7)
    const [maxDuration, setMaxDuration] = useState(ac.maxDuration ?? 300)
    const [customSystemPrompt, setCustomSystemPrompt] = useState(ac.customSystemPrompt || '')

    // UI state
    const [showAiConfig, setShowAiConfig] = useState(!!ac.businessName)

    const handleSave = () => {
        if (!name.trim()) return

        // Build assistantConfig from fields
        const assistantConfig: AssistantConfig = {}
        if (businessName) assistantConfig.businessName = businessName
        if (businessWebsite) assistantConfig.businessWebsite = businessWebsite
        if (businessLocation) assistantConfig.businessLocation = businessLocation
        if (agentName) assistantConfig.agentName = agentName
        if (agentRole) assistantConfig.agentRole = agentRole
        if (conversationStyle) assistantConfig.conversationStyle = conversationStyle
        if (voiceId && voiceId !== 'adam') assistantConfig.voiceId = voiceId
        if (llmModel && llmModel !== 'gpt-4o-mini') assistantConfig.llmModel = llmModel
        if (temperature !== 0.7) assistantConfig.temperature = temperature
        if (maxDuration !== 300) assistantConfig.maxDuration = maxDuration
        if (customSystemPrompt) assistantConfig.customSystemPrompt = customSystemPrompt

        onSave({
            name,
            purpose: purpose || undefined,
            industry: industry || undefined,
            openingLine: openingLine || undefined,
            closingStrategy: closingStrategy || undefined,
            talkingPoints: talkingPoints.filter(t => t.topic.trim()) as any,
            objectionHandlers: objectionHandlers.filter(o => o.objection.trim()) as any,
            rateRange: (rateMin || rateMax || rateTarget) ? { min: rateMin, max: rateMax, target: rateTarget } as any : undefined,
            assistantConfig: Object.keys(assistantConfig).length > 0 ? assistantConfig as any : undefined,
        })
    }

    const inputClass = "w-full text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
    const selectClass = inputClass + " appearance-none cursor-pointer"
    const sectionHeader = "flex items-center gap-2 cursor-pointer select-none group"

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
                    <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Get contractor interested in free leads" className={inputClass} />
                </div>
                <div>
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., Electrician" className={inputClass} />
                </div>
            </div>

            {/* Opening Line */}
            <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">Opening Line</label>
                <textarea value={openingLine} onChange={e => setOpeningLine(e.target.value)} placeholder="Hi, this is Mike from Henderson EV Charger Pros..." rows={2} className={inputClass + ' resize-none'} />
            </div>

            {/* ========== AI CONFIGURATION (Collapsible) ========== */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowAiConfig(!showAiConfig)}
                    className={`${sectionHeader} w-full px-4 py-3 bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors`}
                >
                    {showAiConfig ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="text-text-muted" />}
                    <Bot size={14} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-text-primary">AI Assistant Configuration</span>
                    {!showAiConfig && businessName && (
                        <span className="ml-auto text-[10px] text-text-muted">{businessName} / {agentName || 'AI Agent'}</span>
                    )}
                </button>

                {showAiConfig && (
                    <div className="p-4 space-y-4">
                        {/* Business Context */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Building2 size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Business Context</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Business Name</label>
                                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Henderson EV Charger Pros" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Website</label>
                                    <input type="text" value={businessWebsite} onChange={e => setBusinessWebsite(e.target.value)} placeholder="hendersonevcharger.com" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Location</label>
                                    <input type="text" value={businessLocation} onChange={e => setBusinessLocation(e.target.value)} placeholder="Henderson, Nevada" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* AI Persona */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Bot size={12} className="text-violet-400" />
                                <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide">AI Persona</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Agent Name</label>
                                    <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Mike" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Role</label>
                                    <input type="text" value={agentRole} onChange={e => setAgentRole(e.target.value)} placeholder="sales representative" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Conversation Style</label>
                                    <input type="text" value={conversationStyle} onChange={e => setConversationStyle(e.target.value)} placeholder="friendly and professional" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Voice & LLM */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Mic size={12} className="text-amber-400" />
                                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Voice & AI Model</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Voice</label>
                                    <select value={voiceId} onChange={e => setVoiceId(e.target.value)} className={selectClass}>
                                        {VOICE_PRESETS.map(v => (
                                            <option key={v.value} value={v.value}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">LLM Model</label>
                                    <select value={llmModel} onChange={e => setLlmModel(e.target.value)} className={selectClass}>
                                        {LLM_MODELS.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Temperature ({temperature})</label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={temperature}
                                        onChange={e => setTemperature(Number(e.target.value))}
                                        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted mb-1 block">Max Duration ({Math.floor(maxDuration / 60)}m)</label>
                                    <input
                                        type="range"
                                        min={60}
                                        max={600}
                                        step={30}
                                        value={maxDuration}
                                        onChange={e => setMaxDuration(Number(e.target.value))}
                                        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Custom System Prompt (Advanced) */}
                        <div>
                            <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1 block">
                                Custom System Prompt <span className="text-text-muted/50">(optional — overrides auto-generated prompt)</span>
                            </label>
                            <textarea
                                value={customSystemPrompt}
                                onChange={e => setCustomSystemPrompt(e.target.value)}
                                placeholder="Leave empty to auto-generate from the fields above. Only set this if you want full control over the AI's system prompt."
                                rows={4}
                                className={inputClass + ' resize-y font-mono text-[10px]'}
                            />
                        </div>
                    </div>
                )}
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
