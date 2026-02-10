// @ts-nocheck
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit,
  Trash2,
  Copy,
  Star,
  Pin,
  Clock,
  Hash,
  Tag,
  FileText,
  Mail,
  Linkedin,
  ClipboardList,
  File,
  Check,
  Eye,
  Code,
  History,
  MessageCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { BlockEditor } from './BlockEditor'
import { VersionHistory } from './VersionHistory'
import { CommentThread } from './CommentThread'
import { useTemplateHistory } from '../hooks/useTemplateHistory'
import { useTemplateComments } from '../hooks/useTemplateComments'

const categoryConfig = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'from-blue-500 to-cyan-500' },
  email: { label: 'Email', icon: Mail, color: 'from-red-500 to-orange-500' },
  proposal: { label: 'Proposal', icon: ClipboardList, color: 'from-green-500 to-emerald-500' },
  document: { label: 'Document', icon: FileText, color: 'from-amber-500 to-yellow-500' },
  custom: { label: 'Custom', icon: File, color: 'from-purple-500 to-pink-500' }
}

export function TemplateDetailPanel({
  template,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onTogglePinned,
  onUpdate
}) {
  const [copied, setCopied] = useState(false)
  const [variableValues, setVariableValues] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'edit' | 'history' | 'comments'
  const { saveVersion } = useTemplateHistory(template?.id)
  const {
    comments,
    createComment,
    updateComment,
    deleteComment,
    toggleResolved,
    addReaction,
    getReplies,
    unresolvedCount
  } = useTemplateComments(template?.id)

  const config = template ? (categoryConfig[template.category] || categoryConfig.custom) : null
  const CategoryIcon = config?.icon || FileText

  // Replace variables in content
  const processedContent = useMemo(() => {
    if (!template?.rawMarkdown) return ''
    let content = template.rawMarkdown
    Object.entries(variableValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
    })
    return content
  }, [template?.rawMarkdown, variableValues])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedContent)
    setCopied(true)
    onCopy?.(template)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVariableChange = (variable, value) => {
    setVariableValues(prev => ({ ...prev, [variable]: value }))
  }

  const handleSaveFromEditor = useCallback(async ({ content, rawMarkdown }) => {
    if (onUpdate && template) {
      // Save version before updating
      await saveVersion({ ...template, content, rawMarkdown }, 'edited', 'Content updated')
      onUpdate(template.id, { content, rawMarkdown })
    }
  }, [onUpdate, template, saveVersion])

  const handleVersionRestore = useCallback((restoredTemplate) => {
    // Refresh the template data after restore
    if (onUpdate && template) {
      onUpdate(template.id, {
        content: restoredTemplate.content,
        rawMarkdown: restoredTemplate.rawMarkdown
      })
    }
  }, [onUpdate, template])

  if (!isOpen || !template) return null

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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl h-full bg-bg-primary border-l border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                  <CategoryIcon className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{template.name}</h2>
                  <p className="text-sm text-text-muted">{config.label}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'preview'
                    ? 'bg-bg-tertiary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'edit'
                    ? 'bg-bg-tertiary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                <Code className="w-4 h-4" />
                Edit Blocks
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'history'
                    ? 'bg-bg-tertiary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'comments'
                    ? 'bg-bg-tertiary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                <MessageCircle className="w-4 h-4" />
                Comments
                {unresolvedCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'edit' ? (
            <div className="flex-1 overflow-hidden">
              <BlockEditor
                initialContent={template.content}
                onSave={handleSaveFromEditor}
                autoSave={true}
                showToolbar={true}
              />
            </div>
          ) : activeTab === 'history' ? (
            <div className="flex-1 overflow-hidden">
              <VersionHistory
                templateId={template.id}
                onRestore={handleVersionRestore}
              />
            </div>
          ) : activeTab === 'comments' ? (
            <div className="flex-1 overflow-hidden">
              <CommentThread
                templateId={template.id}
                comments={comments}
                getReplies={getReplies}
                onCreateComment={createComment}
                onUpdateComment={updateComment}
                onDeleteComment={deleteComment}
                onResolve={toggleResolved}
                onReact={addReaction}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleFavorite?.(template.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${template.isFavorite
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
                    }`}
                >
                  <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                  {template.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
                <button
                  onClick={() => onTogglePinned?.(template.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${template.isPinned
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
                    }`}
                >
                  <Pin className={`w-4 h-4 ${template.isPinned ? 'fill-current' : ''}`} />
                  {template.isPinned ? 'Pinned' : 'Pin'}
                </button>
                <button
                  onClick={() => onEdit?.(template)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary text-text-muted hover:bg-bg-tertiary rounded-lg text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(template.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>

              {/* Description */}
              {template.description && (
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-2">Description</h3>
                  <p className="text-text-secondary">{template.description}</p>
                </div>
              )}

              {/* Subject (for email) */}
              {template.subject && (
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-2">Subject Line</h3>
                  <p className="text-text-secondary font-mono text-sm bg-bg-secondary p-3 rounded-lg">
                    {template.subject}
                  </p>
                </div>
              )}

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-text-muted mb-3">
                    <Hash className="w-4 h-4" />
                    Variables ({template.variables.length})
                  </h3>
                  <div className="space-y-2">
                    {template.variables.map(variable => (
                      <div key={variable} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded w-32 text-center">
                          {`{{${variable}}}`}
                        </span>
                        <input
                          type="text"
                          value={variableValues[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          placeholder={`Enter ${variable}...`}
                          className="flex-1 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-text-muted">Content Preview</h3>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${copied
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-bg-secondary border border-border rounded-lg p-4">
                  <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                    {processedContent}
                  </pre>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="w-3 h-3" />
                  Created {format(new Date(template.createdAt), 'MMM d, yyyy')}
                </div>
                {template.lastUsedAt && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    Last used {formatDistanceToNow(new Date(template.lastUsedAt), { addSuffix: true })}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <FileText className="w-3 h-3" />
                  Used {template.usageCount || 0} times
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TemplateDetailPanel
