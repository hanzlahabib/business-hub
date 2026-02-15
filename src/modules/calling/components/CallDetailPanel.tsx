import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Phone, Clock, User, Building2, FileText, MessageSquare,
    Info, Play, Pause, Volume2, Mic, Calendar, Hash, Bot,
    ChevronRight, Loader2, Sparkles, AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useCalls } from '../hooks/useCalls'
import type { Call } from '../hooks/useCalls'
import { CallTranscript } from './CallTranscript'
import { toast } from 'sonner'

interface Props {
    callId: string | null
    isOpen: boolean
    onClose: () => void
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'in-progress': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    ringing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    queued: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
}

const OUTCOME_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    booked: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Booked' },
    'follow-up': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Follow-up' },
    'not-interested': { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Not Interested' },
    'no-answer': { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'No Answer' },
    voicemail: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Voicemail' },
}

const SENTIMENT_STYLES: Record<string, { bg: string; text: string }> = {
    positive: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    neutral: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    negative: { bg: 'bg-red-500/10', text: 'text-red-400' },
}

function formatDuration(seconds?: number): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function AudioPlayer({ src }: { src: string }) {
    const [playing, setPlaying] = useState(false)
    const [audio] = useState(() => new Audio(src))

    useEffect(() => {
        audio.addEventListener('ended', () => setPlaying(false))
        return () => { audio.pause(); audio.removeEventListener('ended', () => setPlaying(false)) }
    }, [audio])

    const toggle = () => {
        if (playing) { audio.pause(); setPlaying(false) }
        else { audio.play(); setPlaying(true) }
    }

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
        >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play Recording'}
            <Volume2 size={12} className="ml-1 opacity-60" />
        </button>
    )
}

const TABS = [
    { id: 'transcript', label: 'Transcript', icon: MessageSquare },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'details', label: 'Details', icon: Info },
] as const

type TabId = typeof TABS[number]['id']

export function CallDetailPanel({ callId, isOpen, onClose }: Props) {
    const { fetchCallById, transcribeCall } = useCalls()
    const [call, setCall] = useState<Call | null>(null)
    const [loading, setLoading] = useState(false)
    const [transcribing, setTranscribing] = useState(false)
    const [activeTab, setActiveTab] = useState<TabId>('transcript')

    const loadCall = useCallback(async (id: string) => {
        setLoading(true)
        const data = await fetchCallById(id)
        if (data) setCall(data)
        setLoading(false)
    }, [fetchCallById])

    useEffect(() => {
        if (callId && isOpen) {
            loadCall(callId)
            setActiveTab('transcript')
        }
    }, [callId, isOpen, loadCall])

    const handleTranscribe = async () => {
        if (!callId) return
        setTranscribing(true)
        const result = await transcribeCall(callId)
        if (result?.transcription) {
            setCall(prev => prev ? { ...prev, transcription: result.transcription } : prev)
            toast.success('Transcription complete')
        } else {
            toast.error('Failed to transcribe call')
        }
        setTranscribing(false)
    }

    if (!isOpen) return null

    const status = call?.status ? STATUS_STYLES[call.status] || STATUS_STYLES.queued : null
    const outcome = call?.outcome ? OUTCOME_STYLES[call.outcome] : null
    const sentiment = call?.sentiment ? SENTIMENT_STYLES[call.sentiment] : null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl h-full bg-bg-primary border-l border-border shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-border">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-bg-tertiary rounded animate-pulse" />
                                        <div className="h-3 w-24 bg-bg-tertiary rounded animate-pulse" />
                                    </div>
                                ) : call ? (
                                    <>
                                        <h2 className="text-lg font-bold text-text-primary truncate flex items-center gap-2">
                                            <Phone size={16} className="text-cyan-500 flex-shrink-0" />
                                            {call.lead?.name || 'Unknown Lead'}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            {call.lead?.phone && (
                                                <span className="text-xs text-text-muted">{call.lead.phone}</span>
                                            )}
                                            {call.lead?.company && (
                                                <span className="text-xs text-text-muted flex items-center gap-1">
                                                    <Building2 size={10} /> {call.lead.company}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        {/* Badges row */}
                        {call && !loading && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {status && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text} font-medium`}>
                                        {call.status}
                                    </span>
                                )}
                                {outcome && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${outcome.bg} ${outcome.text} font-medium`}>
                                        {outcome.label}
                                    </span>
                                )}
                                {sentiment && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sentiment.bg} ${sentiment.text} font-medium capitalize`}>
                                        {call.sentiment}
                                    </span>
                                )}
                                {call.duration != null && (
                                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                                        <Clock size={10} /> {formatDuration(call.duration)}
                                    </span>
                                )}
                                <span className="text-[10px] text-text-muted flex items-center gap-1">
                                    <Calendar size={10} />
                                    {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                                </span>
                                {call.recordingUrl && (
                                    <span className="text-[10px] text-cyan-400 flex items-center gap-0.5">
                                        <Mic size={10} /> Recorded
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Error Banner */}
                        {call && call.status === 'failed' && call.errorReason && (
                            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-red-400">Call Failed</p>
                                    <p className="text-[11px] text-red-300/80 mt-0.5">{call.errorReason}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                                        isActive
                                            ? 'text-cyan-400 border-cyan-400'
                                            : 'text-text-muted border-transparent hover:text-text-primary'
                                    }`}
                                >
                                    <Icon size={13} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-bg-tertiary/50 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : !call ? (
                            <div className="text-center py-8">
                                <Phone size={24} className="mx-auto text-text-muted/30 mb-2" />
                                <p className="text-xs text-text-muted">Call not found</p>
                            </div>
                        ) : (
                            <>
                                {/* Transcript Tab */}
                                {activeTab === 'transcript' && (
                                    <div className="space-y-4">
                                        {call.transcription ? (
                                            <CallTranscript transcription={call.transcription} />
                                        ) : (
                                            <div className="text-center py-8 space-y-3">
                                                <MessageSquare size={28} className="mx-auto text-text-muted/30" />
                                                <p className="text-xs text-text-muted">No transcript yet</p>
                                                {call.recordingUrl && (
                                                    <button
                                                        onClick={handleTranscribe}
                                                        disabled={transcribing}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        {transcribing ? (
                                                            <Loader2 size={13} className="animate-spin" />
                                                        ) : (
                                                            <Sparkles size={13} />
                                                        )}
                                                        {transcribing ? 'Transcribing...' : 'Transcribe Call'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Summary Tab */}
                                {activeTab === 'summary' && (
                                    <div className="space-y-4">
                                        {/* Call Summary */}
                                        {call.summary ? (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                                                <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                                                    <FileText size={13} className="text-cyan-400" />
                                                    Call Summary
                                                </h4>
                                                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                                    {call.summary}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border text-center">
                                                <p className="text-xs text-text-muted">No summary available</p>
                                            </div>
                                        )}

                                        {/* Meeting Notes */}
                                        {call.meetingNotes && call.meetingNotes.length > 0 && (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                                                <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-amber-400" />
                                                    Meeting Notes
                                                </h4>
                                                <div className="space-y-2">
                                                    {call.meetingNotes.map((note: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-2">
                                                            <ChevronRight size={12} className="text-text-muted mt-0.5 flex-shrink-0" />
                                                            <div className="text-xs text-text-secondary">
                                                                {note.type && (
                                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${
                                                                        note.type === 'action' ? 'bg-amber-500/10 text-amber-400' :
                                                                        note.type === 'decision' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                        'bg-gray-500/10 text-gray-400'
                                                                    }`}>
                                                                        {note.type}
                                                                    </span>
                                                                )}
                                                                {note.text || note.content || JSON.stringify(note)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Negotiations */}
                                        {call.negotiations && call.negotiations.length > 0 && (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                                                <h4 className="text-xs font-semibold text-text-primary mb-3">Negotiations</h4>
                                                <div className="space-y-2">
                                                    {call.negotiations.map((neg: any, i: number) => (
                                                        <div key={i} className="text-xs text-text-secondary p-2 bg-bg-tertiary rounded-lg">
                                                            {neg.text || neg.content || JSON.stringify(neg)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!call.summary && (!call.meetingNotes || call.meetingNotes.length === 0) && (
                                            <div className="text-center py-8">
                                                <FileText size={24} className="mx-auto text-text-muted/30 mb-2" />
                                                <p className="text-xs text-text-muted">No summary or notes available</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Details Tab */}
                                {activeTab === 'details' && (
                                    <div className="space-y-4">
                                        {/* Recording */}
                                        {call.recordingUrl && (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                                                <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                                                    <Mic size={13} className="text-cyan-400" />
                                                    Recording
                                                </h4>
                                                <AudioPlayer src={call.recordingUrl} />
                                            </div>
                                        )}

                                        {/* Metadata Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <MetaItem label="Direction" value={call.direction || '-'} icon={Phone} />
                                            <MetaItem label="Duration" value={formatDuration(call.duration)} icon={Clock} />
                                            <MetaItem label="Status" value={call.status} icon={Info} />
                                            <MetaItem label="Outcome" value={call.outcome || '-'} icon={FileText} />
                                            {call.providerCallId && (
                                                <MetaItem label="Provider ID" value={call.providerCallId} icon={Hash} />
                                            )}
                                            {call.script && (
                                                <MetaItem label="Script" value={call.script.name} icon={FileText} />
                                            )}
                                            {call.agentInstanceId && (
                                                <MetaItem label="Agent" value={call.agentInstanceId} icon={Bot} />
                                            )}
                                            <MetaItem
                                                label="Started"
                                                value={call.startedAt ? new Date(call.startedAt).toLocaleString() : '-'}
                                                icon={Calendar}
                                            />
                                            <MetaItem
                                                label="Ended"
                                                value={call.endedAt ? new Date(call.endedAt).toLocaleString() : '-'}
                                                icon={Calendar}
                                            />
                                            <MetaItem
                                                label="Created"
                                                value={new Date(call.createdAt).toLocaleString()}
                                                icon={Calendar}
                                            />
                                        </div>

                                        {/* Script Details */}
                                        {call.script && (
                                            <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                                                <h4 className="text-xs font-semibold text-text-primary mb-2">Script: {call.script.name}</h4>
                                                {call.script.purpose && (
                                                    <p className="text-[10px] text-text-muted mb-2">Purpose: {call.script.purpose}</p>
                                                )}
                                                {call.script.openingLine && (
                                                    <p className="text-xs text-text-secondary italic">"{call.script.openingLine}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

function MetaItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
    return (
        <div className="p-3 bg-bg-secondary rounded-lg">
            <p className="text-[10px] text-text-muted mb-1 flex items-center gap-1">
                <Icon size={10} /> {label}
            </p>
            <p className="text-xs text-text-primary truncate capitalize">{value}</p>
        </div>
    )
}

export default CallDetailPanel
