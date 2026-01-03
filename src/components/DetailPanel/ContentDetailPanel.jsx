import { memo, useCallback, useState } from 'react'
import { X, Edit3, Calendar, Clock, Tag, FileText, ExternalLink, Youtube, FileCode, Link2, Trash2, Plus, Presentation, Folder, ListChecks } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { CommentSection } from '../Comments'

const URL_TYPE_CONFIG = {
  youtube: {
    icon: Youtube,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Watch'
  },
  doc: {
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Open'
  },
  github: {
    icon: FileCode,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'View Repo'
  },
  other: {
    icon: Link2,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    label: 'Open'
  }
}

const STATUS_COLORS = {
  idea: 'bg-gray-500/20 text-gray-300',
  script: 'bg-blue-500/20 text-blue-300',
  recording: 'bg-yellow-500/20 text-yellow-300',
  editing: 'bg-orange-500/20 text-orange-300',
  thumbnail: 'bg-pink-500/20 text-pink-300',
  published: 'bg-green-500/20 text-green-300'
}

export const ContentDetailPanel = memo(function ContentDetailPanel({
  content,
  isOpen,
  onClose,
  onEdit,
  onAddComment,
  onDeleteComment,
  onAddUrl,
  onRemoveUrl,
  onUpdateContent
}) {
  const [newUrl, setNewUrl] = useState('')
  const [newUrlLabel, setNewUrlLabel] = useState('')
  const [showUrlForm, setShowUrlForm] = useState(false)

  const handleAddUrl = useCallback(async (e) => {
    e.preventDefault()
    if (!newUrl.trim()) return

    await onAddUrl(content.id, { url: newUrl.trim(), label: newUrlLabel.trim() })
    setNewUrl('')
    setNewUrlLabel('')
    setShowUrlForm(false)
  }, [content?.id, newUrl, newUrlLabel, onAddUrl])

  const handleAddComment = useCallback(async (text) => {
    await onAddComment(content.id, text)
  }, [content?.id, onAddComment])

  const handleDeleteComment = useCallback(async (commentId) => {
    await onDeleteComment(content.id, commentId)
  }, [content?.id, onDeleteComment])

  const handleTogglePresentationReady = useCallback(async () => {
    if (onUpdateContent) {
      await onUpdateContent({
        ...content,
        presentationReady: !content.presentationReady
      })
    }
  }, [content, onUpdateContent])

  if (!content) return null

  const formattedScheduledDate = content.scheduledDate
    ? format(parseISO(content.scheduledDate), 'EEEE, MMM d, yyyy')
    : 'Not scheduled'

  const formattedPublishedDate = content.publishedDate
    ? format(parseISO(content.publishedDate), 'MMM d, yyyy h:mm a')
    : null

  const formattedCreatedDate = content.createdAt
    ? format(parseISO(content.createdAt), 'MMM d, yyyy')
    : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-bg-secondary border-l border-border z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  content.type === 'long' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-accent-secondary/20 text-accent-secondary'
                }`}>
                  {content.type === 'long' ? 'Long Form' : 'Short'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[content.status]}`}>
                  {content.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(content)}
                  className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Title & Topic */}
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  {content.title || 'Untitled'}
                </h2>
                {content.topic && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Tag size={14} />
                    <span className="text-sm">{content.topic}</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-text-muted" />
                  <span className="text-text-muted">Scheduled:</span>
                  <span className="text-text-primary">{formattedScheduledDate}</span>
                </div>
                {formattedPublishedDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-green-400" />
                    <span className="text-text-muted">Published:</span>
                    <span className="text-green-400">{formattedPublishedDate}</span>
                  </div>
                )}
                {formattedCreatedDate && (
                  <div className="flex items-center gap-3 text-sm text-text-muted/70">
                    <Clock size={16} />
                    <span>Created:</span>
                    <span>{formattedCreatedDate}</span>
                  </div>
                )}
              </div>

              {/* Presentation Ready Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 border border-border">
                <div className="flex items-center gap-3">
                  <Presentation size={18} className={content.presentationReady ? 'text-accent-success' : 'text-text-muted'} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Presentation Ready</p>
                    <p className="text-xs text-text-muted">
                      {content.presentationReady ? 'Slides are prepared' : 'Slides not ready yet'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePresentationReady}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    content.presentationReady ? 'bg-accent-success' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      content.presentationReady ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slide Details - only when presentation is ready and has details */}
              {content.presentationReady && content.slideDetails && (
                content.slideDetails.folderName ||
                content.slideDetails.bulletPoints?.length > 0 ||
                content.slideDetails.slides?.length > 0
              ) && (
                <div className="space-y-3 p-3 rounded-lg bg-accent-success/5 border border-accent-success/20">
                  <div className="flex items-center gap-2 text-accent-success">
                    <Presentation size={16} />
                    <span className="text-sm font-medium">Slide Details</span>
                  </div>

                  {/* Folder Name */}
                  {content.slideDetails.folderName && (
                    <div className="flex items-center gap-2">
                      <Folder size={14} className="text-text-muted" />
                      <span className="text-sm text-text-muted">Folder:</span>
                      <code className="text-sm text-accent-success bg-accent-success/10 px-2 py-0.5 rounded">
                        {content.slideDetails.folderName}
                      </code>
                    </div>
                  )}

                  {/* Bullet Points */}
                  {content.slideDetails.bulletPoints?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ListChecks size={14} className="text-text-muted" />
                        <span className="text-sm text-text-muted">Key Points ({content.slideDetails.bulletPoints.length})</span>
                      </div>
                      <ul className="space-y-1 ml-1">
                        {content.slideDetails.bulletPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
                            <span className="text-accent-success mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Slides */}
                  {content.slideDetails.slides?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Presentation size={14} className="text-text-muted" />
                        <span className="text-sm text-text-muted">Slides ({content.slideDetails.slides.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {content.slideDetails.slides.map((slide, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs text-text-primary"
                          >
                            <span className="text-accent-success font-medium">{index + 1}.</span>
                            {slide}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hook */}
              {content.hook && (
                <div className="p-3 bg-bg-tertiary/50 rounded-lg border border-border">
                  <p className="text-xs text-text-muted mb-1">Hook</p>
                  <p className="text-sm text-text-primary italic">"{content.hook}"</p>
                </div>
              )}

              {/* Notes */}
              {content.notes && (
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Notes
                  </h4>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {content.notes}
                  </p>
                </div>
              )}

              {/* URLs Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-muted flex items-center gap-2">
                    <Link2 size={14} />
                    Links ({content.urls?.length || 0})
                  </h4>
                  <button
                    onClick={() => setShowUrlForm(!showUrlForm)}
                    className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-accent-primary transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add URL Form */}
                {showUrlForm && (
                  <form onSubmit={handleAddUrl} className="space-y-2 p-3 bg-bg-tertiary/50 rounded-lg">
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newUrlLabel}
                      onChange={(e) => setNewUrlLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!newUrl.trim()}
                        className="flex-1 px-3 py-2 rounded-lg bg-accent-primary text-white text-sm disabled:opacity-50 hover:bg-accent-primary/90 transition-colors"
                      >
                        Add Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlForm(false)
                          setNewUrl('')
                          setNewUrlLabel('')
                        }}
                        className="px-3 py-2 rounded-lg bg-bg-primary text-text-muted text-sm hover:text-text-primary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* URL List */}
                <div className="space-y-2">
                  {content.urls?.length === 0 ? (
                    <p className="text-sm text-text-muted/60 text-center py-3">
                      No links added
                    </p>
                  ) : (
                    content.urls?.map(urlItem => (
                      <UrlItem
                        key={urlItem.id}
                        urlItem={urlItem}
                        onRemove={() => onRemoveUrl(content.id, urlItem.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <CommentSection
                comments={content.comments || []}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                maxHeight="300px"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

const UrlItem = memo(function UrlItem({ urlItem, onRemove }) {
  const config = URL_TYPE_CONFIG[urlItem.type] || URL_TYPE_CONFIG.other
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} border ${config.borderColor} group`}>
      <Icon size={18} className={config.color} />
      <div className="flex-1 min-w-0">
        {urlItem.label && (
          <p className="text-sm font-medium text-text-primary truncate">{urlItem.label}</p>
        )}
        <p className="text-xs text-text-muted truncate">{urlItem.url}</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={urlItem.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${config.color} hover:bg-white/10 transition-colors`}
        >
          <ExternalLink size={12} />
          {config.label}
        </a>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-accent-danger/20 text-accent-danger transition-all"
          title="Remove link"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
})
