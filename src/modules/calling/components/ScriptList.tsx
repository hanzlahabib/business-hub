import { useState } from 'react'
import { ScrollText, Plus, Sparkles, Trash2, Edit, MoreVertical, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ScriptEditor } from './ScriptEditor'
import type { CallScript } from '../hooks/useCalls'

interface Props {
    scripts: CallScript[]
    loading: boolean
    generating: boolean
    onCreateScript: (data: Partial<CallScript>) => Promise<any>
    onUpdateScript: (id: string, data: Partial<CallScript>) => Promise<any>
    onDeleteScript: (id: string) => Promise<boolean>
    onGenerateScript: (params: { purpose: string; industry?: string; rateRange?: any; context?: string }) => Promise<any>
}

export function ScriptList({
    scripts, loading, generating,
    onCreateScript, onUpdateScript, onDeleteScript, onGenerateScript
}: Props) {
    const [showEditor, setShowEditor] = useState(false)
    const [editingScript, setEditingScript] = useState<CallScript | null>(null)
    const [showAIForm, setShowAIForm] = useState(false)
    const [aiPurpose, setAiPurpose] = useState('')
    const [aiIndustry, setAiIndustry] = useState('')
    const [menuOpen, setMenuOpen] = useState<string | null>(null)

    const handleSave = async (data: Partial<CallScript>) => {
        if (editingScript) {
            await onUpdateScript(editingScript.id, data)
            toast.success('Script updated')
        } else {
            await onCreateScript(data)
            toast.success('Script created')
        }
        setShowEditor(false)
        setEditingScript(null)
    }

    const handleDelete = async (id: string) => {
        const ok = await onDeleteScript(id)
        if (ok) toast.success('Script deleted')
        setMenuOpen(null)
    }

    const handleGenerate = async () => {
        if (!aiPurpose.trim()) return
        const result = await onGenerateScript({ purpose: aiPurpose, industry: aiIndustry || undefined })
        if (result) {
            toast.success('✨ AI script generated!')
            setShowAIForm(false)
            setAiPurpose('')
            setAiIndustry('')
        }
    }

    if (showEditor) {
        return (
            <ScriptEditor
                script={editingScript}
                onSave={handleSave}
                onCancel={() => { setShowEditor(false); setEditingScript(null) }}
            />
        )
    }

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setEditingScript(null); setShowEditor(true) }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={14} />
                    New Script
                </button>
                <button
                    onClick={() => setShowAIForm(!showAIForm)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/20"
                >
                    <Sparkles size={14} />
                    AI Generate
                </button>
            </div>

            {/* AI Generation Form */}
            {showAIForm && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        AI Script Generator
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={aiPurpose}
                            onChange={e => setAiPurpose(e.target.value)}
                            placeholder="Purpose (e.g., Schedule a demo call)"
                            className="text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500/50"
                        />
                        <input
                            type="text"
                            value={aiIndustry}
                            onChange={e => setAiIndustry(e.target.value)}
                            placeholder="Industry (optional)"
                            className="text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !aiPurpose.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white text-xs font-semibold rounded-lg hover:bg-violet-400 disabled:opacity-50"
                        >
                            {generating ? (
                                <span className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </span>
                            ) : (
                                <>
                                    <Sparkles size={12} />
                                    Generate
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowAIForm(false)}
                            className="px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Scripts Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-36 bg-bg-secondary rounded-xl border border-border animate-pulse" />
                    ))}
                </div>
            ) : scripts.length === 0 ? (
                <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border">
                    <FileText size={32} className="mx-auto text-text-muted/30 mb-3" />
                    <p className="text-sm font-medium text-text-muted mb-1">No scripts yet</p>
                    <p className="text-xs text-text-muted/70">Create a script manually or let AI generate one</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {scripts.map(script => (
                        <div
                            key={script.id}
                            className="bg-bg-secondary rounded-xl border border-border p-4 hover:border-cyan-500/30 transition-all group relative"
                        >
                            {/* Menu */}
                            <div className="absolute top-3 right-3">
                                <button
                                    onClick={() => setMenuOpen(menuOpen === script.id ? null : script.id)}
                                    className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {menuOpen === script.id && (
                                    <div className="absolute right-0 top-7 bg-bg-secondary border border-border rounded-lg shadow-xl z-10 overflow-hidden min-w-[120px]">
                                        <button
                                            onClick={() => { setEditingScript(script); setShowEditor(true); setMenuOpen(null) }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary"
                                        >
                                            <Edit size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(script.id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <ScrollText size={14} className="text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-text-primary truncate">{script.name}</h4>
                                    {script.purpose && (
                                        <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{script.purpose}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                                {script.industry && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">
                                        {script.industry}
                                    </span>
                                )}
                                <span className="text-[10px] text-text-muted ml-auto">
                                    Used {script.usageCount || 0}×
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
