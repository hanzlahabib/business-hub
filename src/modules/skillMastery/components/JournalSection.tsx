
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { PenTool, Calendar, Save, Trash2 } from 'lucide-react'

export function JournalSection({ plant, onLog }: any) {
    const [activeTab, setActiveTab] = useState('write') // 'write' or 'history'
    const [entry, setEntry] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const today = format(new Date(), 'yyyy-MM-dd')

    // Get today's log safely
    const todaysLogData = plant.logs?.[today]
    const todaysJournal = todaysLogData?.journal || ''

    const handleSave = () => {
        if (!entry.trim()) return

        setIsSaving(true)
        setTimeout(() => {
            onLog(today, { journal: entry })
            setIsSaving(false)
            setEntry('')
            setActiveTab('history')
        }, 600)
    }

    // Get all journal entries
    const history = Object.entries(plant.logs || {})
        .filter(([_, log]: [string, any]) => log.journal)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Tabs */}
            <div className="flex p-1 bg-bg-tertiary rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('write')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'write' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    Write Today
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    History ({history.length})
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'write' ? (
                    <motion.div
                        key="write"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="bg-bg-secondary p-6 rounded-2xl border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                        <PenTool size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-primary">{format(new Date(), 'EEEE, MMMM do')}</h3>
                                        <p className="text-xs text-text-muted">Brain Dump & Reflection</p>
                                    </div>
                                </div>
                                {todaysJournal && (
                                    <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                        Log Updated ✓
                                    </span>
                                )}
                            </div>

                            <textarea
                                value={entry}
                                onChange={(e) => setEntry(e.target.value)}
                                placeholder="What's on your mind? Spill it all here..."
                                className="w-full h-48 bg-bg-tertiary/50 p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-text-primary placeholder:text-text-muted/50"
                            />

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={!entry.trim() || isSaving}
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                                >
                                    {isSaving ? (
                                        <span className="animate-pulse">Saving...</span>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {todaysJournal && (
                            <div className="bg-bg-tertiary/30 p-6 rounded-2xl border border-dashed border-border/50">
                                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-3">Today's Entry:</p>
                                <p className="text-sm text-text-secondary leading-relaxed italic border-l-2 border-purple-500/30 pl-4">
                                    "{todaysJournal}"
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                    >
                        {history.length === 0 ? (
                            <div className="text-center py-16 text-text-muted">
                                <p className="text-4xl mb-4 opacity-20">📓</p>
                                <p className="font-medium">No journal entries yet.</p>
                                <p className="text-sm mt-1">Start writing to clear your mind.</p>
                            </div>
                        ) : (
                            history.map(([date, log]: [string, any]) => (
                                <div key={date} className="bg-bg-secondary p-5 rounded-2xl border border-border hover:border-purple-500/30 transition-all group">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50 group-hover:border-purple-500/10 transition-colors">
                                        <Calendar size={14} className="text-purple-500" />
                                        <span className="text-sm font-bold text-text-primary">
                                            {format(parseISO(date), 'MMMM d, yyyy')}
                                        </span>
                                        <span className="text-xs text-text-muted ml-auto">
                                            {format(parseISO(date), 'EEEE')}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary whitespace-pre-wrap leading-relaxed text-sm">
                                        {log.journal}
                                    </p>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
