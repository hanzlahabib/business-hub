import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, Globe, Building2, Calendar, Edit, Trash2, Send, ExternalLink, MessageSquare, LayoutGrid, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { MessageThread } from '../../../shared/components/MessageThread'
import { useMessages } from '../../../shared/hooks/useMessages'

const statusColors = {
  new: 'bg-gray-500',
  contacted: 'bg-blue-500',
  replied: 'bg-cyan-500',
  meeting: 'bg-amber-500',
  won: 'bg-green-500',
  lost: 'bg-red-500'
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
  const [activeTab, setActiveTab] = useState('details')
  const { messages, loading: messagesLoading, fetchMessagesByLead, getMessageStats } = useMessages()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (lead?.id && isOpen) {
      fetchMessagesByLead(lead.id)
      getMessageStats(lead.id).then(setStats)
    }
  }, [lead?.id, isOpen, fetchMessagesByLead, getMessageStats])

  if (!isOpen || !lead) return null

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
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${statusColors[lead.status]}`} />
                  <span className="text-xs text-text-muted uppercase tracking-wider">
                    {lead.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">{lead.name}</h2>
                {lead.contactPerson && (
                  <p className="text-text-muted">{lead.contactPerson}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSendEmail?.(lead)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Email
              </button>

              {/* Show View Board if linked, Create Board if not */}
              {linkedBoard || lead.linkedBoardId ? (
                <button
                  onClick={() => onViewBoard?.(linkedBoard || lead.linkedBoardId)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Board
                </button>
              ) : (
                <button
                  onClick={() => onCreateBoard?.(lead)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Create Board
                </button>
              )}

              <button
                onClick={() => onEdit?.(lead)}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-text-muted" />
              </button>
              <button
                onClick={() => onDelete?.(lead)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {['details', 'messages', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-text-primary border-b-2 border-blue-500'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'messages' && stats?.total > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-bg-tertiary rounded text-xs">
                    {stats.total}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    Contact Info
                  </h3>
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span className="text-text-primary">{lead.email}</span>
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-400" />
                      <span className="text-text-primary">{lead.phone}</span>
                    </a>
                  )}
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="text-text-primary flex-1 truncate">{lead.website}</span>
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </a>
                  )}
                </div>

                {/* Status Change */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['new', 'contacted', 'replied', 'meeting', 'won', 'lost'].map(status => (
                      <button
                        key={status}
                        onClick={() => onStatusChange?.(lead.id, status)}
                        className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                          lead.status === status
                            ? `${statusColors[status]} text-white`
                            : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
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
                    <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
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
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-muted mb-1">Industry</p>
                      <p className="text-text-primary capitalize">{lead.industry || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-muted mb-1">Source</p>
                      <p className="text-text-primary capitalize">{lead.source || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-muted mb-1">Created</p>
                      <p className="text-text-primary">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-muted mb-1">Last Contact</p>
                      <p className="text-text-primary">
                        {lead.lastContactedAt
                          ? format(new Date(lead.lastContactedAt), 'MMM d, yyyy')
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Website Issues */}
                {lead.websiteIssues && lead.websiteIssues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                      Website Issues
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.websiteIssues.map(issue => (
                        <span
                          key={issue}
                          className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {lead.tags && lead.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
                      Notes
                    </h3>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap bg-bg-secondary p-4 rounded-lg">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <MessageThread
                messages={messages}
                loading={messagesLoading}
                emptyMessage="No messages sent to this lead yet"
              />
            )}

            {activeTab === 'activity' && (
              <div className="text-center py-8 text-text-muted">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Activity timeline coming soon</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LeadDetailPanel
