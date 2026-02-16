// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import {
  X, Mail, Phone, PhoneCall, Globe, Building2, Calendar,
  Edit, Trash2, Send, ExternalLink, MessageSquare, LayoutGrid,
  Eye, Clock, User, Mic, ChevronDown, ChevronRight, Play, Pause,
  Volume2, FileText, Brain, MoreHorizontal, TrendingUp, Flame,
  Sparkles
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { MessageThread } from '../../../shared/components/MessageThread'
import { useMessages } from '../../../shared/hooks/useMessages'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'sonner'
import { LeadActivityTimeline } from './LeadActivityTimeline'
import { LeadIntelligence } from './LeadIntelligence'

const statusColors = {
  new: 'bg-gray-500',
  contacted: 'bg-blue-500',
  replied: 'bg-cyan-500',
  meeting: 'bg-amber-500',
  won: 'bg-green-500',
  lost: 'bg-red-500'
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function getDealHeat(lead: any): number {
  const statusScores = { new: 20, contacted: 35, replied: 50, qualified: 70, meeting: 80, negotiation: 90, won: 100, lost: 0 }
  return statusScores[lead.status] || 20
}

export function LeadDetailPanel({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onSendEmail,
  onCreateBoard,
  onViewBoard,
  onStatusChange,
  linkedBoard = null
}) {
  const [activeTab, setActiveTab] = useState('intelligence')
  const { messages, loading: messagesLoading, fetchMessagesByLead, getMessageStats } = useMessages()
  const [stats, setStats] = useState<any>(null)
  const { user } = useAuth()
  const [leadCalls, setLeadCalls] = useState<any[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [callingLead, setCallingLead] = useState(false)
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)

  const fetchLeadCalls = useCallback(async (leadId) => {
    if (!user) return
    setCallsLoading(true)
    try {
      const res = await fetch(`${ENDPOINTS.CALLS}?leadId=${leadId}`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
      })
      const data = await res.json()
      setLeadCalls(data.calls || [])
    } catch { /* ignore */ }
    finally { setCallsLoading(false) }
  }, [user])

  const handleCallLead = useCallback(async () => {
    if (!user || !lead?.id) return
    setCallingLead(true)
    try {
      const res = await fetch(`${ENDPOINTS.CALLS}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ leadId: lead.id })
      })
      if (res.ok) {
        toast.success(`📞 Call initiated to ${lead.name}`)
        fetchLeadCalls(lead.id)
      } else {
        toast.error('Failed to initiate call')
      }
    } catch { toast.error('Failed to initiate call') }
    finally { setCallingLead(false) }
  }, [user, lead, fetchLeadCalls])

  useEffect(() => {
    if (lead?.id && isOpen) {
      fetchMessagesByLead(lead.id)
      getMessageStats(lead.id).then(setStats)
      fetchLeadCalls(lead.id)
    }
  }, [lead?.id, isOpen, fetchMessagesByLead, getMessageStats, fetchLeadCalls])

  if (!isOpen || !lead) return null

  const heat = getDealHeat(lead)
  const circumference = 2 * Math.PI * 28
  const dashOffset = circumference - (heat / 100) * circumference

  return (
    <aside className="w-[400px] border-l border-border bg-bg-secondary flex flex-col shadow-2xl z-20 overflow-y-auto shrink-0 relative">
      {/* Panel Header */}
      <div className="p-6 border-b border-border relative overflow-hidden">
        {/* Close button */}
        <div className="absolute top-0 right-0 p-4 z-10">
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Gradient Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary to-purple-500" />

        <div className="flex flex-col items-center text-center mt-2">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full border-2 border-accent-primary/50 p-1 mb-3 relative">
            <div className="w-full h-full rounded-full bg-bg-tertiary flex items-center justify-center text-xl font-bold text-text-muted">
              {getInitials(lead.name)}
            </div>
            {lead.source && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-bg-primary rounded-full flex items-center justify-center border border-border">
                <span className="text-[10px]">
                  {lead.source === 'linkedin' ? '💼' : lead.source === 'google' ? '🔍' : lead.source === 'instagram' ? '📸' : '📌'}
                </span>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-text-primary">{lead.name}</h2>
          <p className="text-sm text-text-muted">
            {lead.title || lead.role || lead.contactPerson || ''}{lead.company ? ` at ${lead.company}` : ''}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onSendEmail?.(lead)}
              className="p-2 rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </button>
            {lead.phone && (
              <button
                onClick={handleCallLead}
                disabled={callingLead}
                className="p-2 rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all disabled:opacity-50"
                title="Call"
              >
                <Phone className={`w-4 h-4 ${callingLead ? 'animate-pulse' : ''}`} />
              </button>
            )}
            <button
              className="p-2 rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
              title="Schedule"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit?.(lead)}
              className="p-2 rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-bg-secondary">
        {[
          { key: 'intelligence', label: 'Intelligence' },
          { key: 'activity', label: 'Activity' },
          { key: 'notes', label: 'Notes' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
              ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-6 flex-1">
        {activeTab === 'intelligence' && (
          <IntelligenceTab lead={lead} heat={heat} circumference={circumference} dashOffset={dashOffset} />
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <LeadActivityTimeline leadId={lead.id} />

            {/* Messages section */}
            {messages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Messages</h4>
                <MessageThread
                  messages={messages}
                  loading={messagesLoading}
                  emptyMessage="No messages sent to this lead yet"
                />
              </div>
            )}

            {/* Calls section */}
            {leadCalls.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Calls</h4>
                <CallsList
                  calls={leadCalls}
                  loading={callsLoading}
                  expandedCallId={expandedCallId}
                  onToggleExpand={setExpandedCallId}
                  lead={lead}
                  onCallLead={handleCallLead}
                  callingLead={callingLead}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <NotesTab lead={lead} onStatusChange={onStatusChange} linkedBoard={linkedBoard} onViewBoard={onViewBoard} onCreateBoard={onCreateBoard} onDelete={onDelete} />
        )}
      </div>
    </aside>
  )
}

/* =====================================================
   Intelligence Tab — Stitch design
   ===================================================== */
function IntelligenceTab({ lead, heat, circumference, dashOffset }) {
  const heatColor = heat >= 70 ? 'text-accent-primary' : heat >= 40 ? 'text-amber-400' : 'text-text-muted'
  const strokeColor = heat >= 70 ? 'text-accent-primary' : heat >= 40 ? 'text-amber-400' : 'text-text-muted'

  return (
    <>
      {/* Deal Heat Visualizer */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border/50">
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Deal Probability</div>
          <div className={`text-2xl font-bold text-text-primary`}>{heat}%</div>
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% this week
          </div>
        </div>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-bg-elevated"
              cx="32" cy="32" r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle
              className={strokeColor}
              cx="32" cy="32" r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <Flame className={`absolute ${heatColor} w-5 h-5`} />
        </div>
      </div>

      {/* AI Summary */}
      <div className="relative rounded-xl bg-gradient-to-b from-accent-primary/10 to-transparent border border-accent-primary/20 p-5">
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-bg-primary border border-accent-primary/30 rounded text-xs font-medium text-accent-primary flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Second Brain AI
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mt-1">
          {lead.notes
            ? lead.notes.slice(0, 200)
            : `Lead from ${lead.source || 'unknown source'}. Current status: ${lead.status}. ${lead.industry ? `Industry: ${lead.industry}.` : ''} ${lead.tags?.length ? `Key areas: ${lead.tags.join(', ')}.` : ''}`
          }
        </p>
      </div>

      {/* Key Fields Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
          <div className="text-xs text-text-muted mb-1">Budget Range</div>
          <div className="text-sm font-semibold text-text-primary">{lead.budget || 'Not set'}</div>
        </div>
        <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
          <div className="text-xs text-text-muted mb-1">Timeline</div>
          <div className="text-sm font-semibold text-text-primary">{lead.timeline || 'Not set'}</div>
        </div>
      </div>

      {/* Pain Points / Tags */}
      {(lead.tags?.length > 0 || lead.websiteIssues?.length > 0) && (
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Identified Pain Points</div>
          <div className="flex flex-wrap gap-2">
            {lead.websiteIssues?.map(issue => (
              <span key={issue} className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                #{issue}
              </span>
            ))}
            {lead.tags?.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-md text-xs font-medium bg-bg-tertiary text-text-secondary border border-border">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Best Action Card */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Next Best Action</span>
          <span className="text-xs text-text-muted">Based on last interaction</span>
        </div>
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-accent-primary">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary">
                {lead.status === 'new' ? 'Send Introduction Email' :
                  lead.status === 'contacted' ? 'Schedule Follow-up Call' :
                    lead.status === 'replied' ? 'Prepare Custom Proposal' :
                      lead.status === 'negotiation' ? 'Send Migration Case Study' :
                        'Review Lead Status'}
              </h4>
              <p className="text-xs text-text-muted mt-1">
                {lead.status === 'new' ? 'Reach out with a personalized introduction.' :
                  lead.status === 'contacted' ? 'Follow up on your initial outreach.' :
                    lead.status === 'replied' ? 'They showed interest — send a tailored proposal.' :
                      lead.status === 'negotiation' ? 'Address concerns with relevant case studies.' :
                        'Evaluate and update the current lead pipeline.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all">
            Re-analyze
          </button>
          <button className="px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-blue-600 text-sm font-medium text-white shadow-lg shadow-accent-primary/25 transition-all flex items-center justify-center gap-2">
            <Send className="w-3.5 h-3.5" />
            Generate Proposal
          </button>
        </div>
      </div>

      {/* Full Intelligence Data (if backend has it) */}
      <div className="mt-2">
        <LeadIntelligence leadId={lead.id} />
      </div>
    </>
  )
}

/* =====================================================
   Notes Tab
   ===================================================== */
function NotesTab({ lead, onStatusChange, linkedBoard, onViewBoard, onCreateBoard, onDelete }) {
  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Contact Info
        </h3>
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-text-primary">{lead.email}</span>
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-sm text-text-primary">{lead.phone}</span>
          </a>
        )}
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-text-primary flex-1 truncate">{lead.website}</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
          </a>
        )}
      </div>

      {/* Status Change */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {['new', 'contacted', 'replied', 'meeting', 'won', 'lost'].map(status => (
            <button
              key={status}
              onClick={() => onStatusChange?.(lead.id, status)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${lead.status === status
                ? `${statusColors[status]} text-white`
                : 'bg-bg-tertiary text-text-muted hover:bg-bg-elevated'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Linked Board */}
      {linkedBoard && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Linked Board
          </h3>
          <button
            onClick={() => onViewBoard?.(linkedBoard)}
            className="w-full flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors"
          >
            <LayoutGrid className="w-5 h-5 text-green-400" />
            <div className="text-left">
              <p className="text-text-primary font-medium">{linkedBoard.name}</p>
              <p className="text-xs text-text-muted">
                {linkedBoard.columns?.length || 0} columns
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">Industry</p>
            <p className="text-sm text-text-primary capitalize">{lead.industry || 'Not set'}</p>
          </div>
          <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">Source</p>
            <p className="text-sm text-text-primary capitalize">{lead.source || 'Not set'}</p>
          </div>
          <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">Created</p>
            <p className="text-sm text-text-primary">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
          </div>
          <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">Last Contact</p>
            <p className="text-sm text-text-primary">
              {lead.lastContactedAt
                ? format(new Date(lead.lastContactedAt), 'MMM d, yyyy')
                : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Notes
          </h3>
          <p className="text-text-secondary text-sm whitespace-pre-wrap bg-bg-tertiary p-4 rounded-lg border border-border">
            {lead.notes}
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => onDelete?.(lead)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Lead
        </button>
      </div>
    </div>
  )
}

/* =====================================================
   Calls List — extracted from original
   ===================================================== */
function CallsList({ calls, loading, expandedCallId, onToggleExpand, lead, onCallLead, callingLead }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-bg-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-6">
        <Phone className="w-6 h-6 mx-auto mb-2 text-text-muted opacity-50" />
        <p className="text-text-muted text-sm">No calls yet</p>
        {lead.phone && (
          <button
            onClick={onCallLead}
            disabled={callingLead}
            className="mt-3 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
          >
            <PhoneCall className="w-4 h-4 inline mr-1" /> Make First Call
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {calls.map(call => {
        const statusColor = {
          completed: 'bg-emerald-500/10 text-emerald-400',
          'in-progress': 'bg-amber-500/10 text-amber-400',
          failed: 'bg-red-500/10 text-red-400',
          queued: 'bg-gray-500/10 text-gray-400'
        }[call.status] || 'bg-gray-500/10 text-gray-400'

        const outcomeLabel = {
          booked: '✅ Booked',
          'follow-up': '📅 Follow-up',
          'not-interested': '❌ Not Interested',
          'no-answer': '📵 No Answer',
          voicemail: '📩 Voicemail'
        }[call.outcome] || null

        const isExpanded = expandedCallId === call.id

        return (
          <div key={call.id} className="bg-bg-tertiary rounded-lg overflow-hidden border border-border/50">
            <div
              onClick={() => onToggleExpand(isExpanded ? null : call.id)}
              className="p-3 hover:bg-bg-elevated transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor} font-medium`}>
                    {call.status}
                  </span>
                  {call.recordingUrl && <Mic className="w-3 h-3 text-cyan-400" />}
                </div>
                <span className="text-[10px] text-text-muted">
                  {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-5">
                {outcomeLabel && <span className="text-xs font-medium">{outcomeLabel}</span>}
                {call.duration && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                  </span>
                )}
                {call.summary && !isExpanded && (
                  <span className="text-xs text-text-muted truncate flex-1">{call.summary}</span>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                {call.summary && (
                  <div className="p-2.5 bg-bg-elevated rounded-lg">
                    <p className="text-[10px] text-text-muted mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Summary
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">{call.summary}</p>
                  </div>
                )}
                {call.transcription && (
                  <div className="p-2.5 bg-bg-elevated rounded-lg">
                    <p className="text-[10px] text-text-muted mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Transcript Preview
                    </p>
                    <LeadCallTranscriptPreview transcription={call.transcription} />
                  </div>
                )}
                {call.recordingUrl && (
                  <LeadCallAudioPlayer src={call.recordingUrl} />
                )}
                <a
                  href="/calling"
                  className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                >
                  View Full Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* =====================================================
   Helpers — Transcript & Audio
   ===================================================== */
function LeadCallTranscriptPreview({ transcription }: { transcription: string }) {
  let messages: Array<{ role: string; content: string }> = []
  try {
    const parsed = JSON.parse(transcription)
    if (Array.isArray(parsed)) {
      messages = parsed.slice(0, 5).map(m => ({
        role: m.role === 'user' || m.role === 'human' ? 'user' : 'assistant',
        content: m.content || m.text || '',
      }))
    }
  } catch {
    const lines = transcription.split('\n').filter(l => l.trim()).slice(0, 5)
    messages = lines.map(line => {
      const match = line.match(/^(assistant|agent|ai|user|lead|human|customer):\s*(.*)/i)
      if (match) {
        const role = ['user', 'lead', 'human', 'customer'].includes(match[1].toLowerCase()) ? 'user' : 'assistant'
        return { role, content: match[2] }
      }
      return { role: 'assistant', content: line }
    })
  }

  if (messages.length === 0) return <p className="text-[10px] text-text-muted">Empty transcript</p>

  return (
    <div className="space-y-1.5">
      {messages.map((msg, i) => (
        <div key={i} className="flex gap-1.5">
          <span className={`text-[10px] font-medium flex-shrink-0 ${msg.role === 'user' ? 'text-text-muted' : 'text-cyan-400'}`}>
            {msg.role === 'user' ? 'Lead:' : 'Agent:'}
          </span>
          <span className="text-[10px] text-text-secondary truncate">{msg.content}</span>
        </div>
      ))}
    </div>
  )
}

function LeadCallAudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false)
  const [audio] = useState(() => new Audio(src))

  useEffect(() => {
    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => { audio.pause(); audio.removeEventListener('ended', onEnded) }
  }, [audio])

  return (
    <button
      onClick={() => {
        if (playing) { audio.pause(); setPlaying(false) }
        else { audio.play(); setPlaying(true) }
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/20 transition-colors"
    >
      {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      {playing ? 'Pause' : 'Play Recording'}
      <Volume2 className="w-3 h-3 opacity-60" />
    </button>
  )
}

export default LeadDetailPanel
