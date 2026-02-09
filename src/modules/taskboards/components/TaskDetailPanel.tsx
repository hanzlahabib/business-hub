import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Flag, Plus, Trash2, CheckSquare, Square,
  Clock, Zap, Flame, GripVertical, MoreHorizontal,
  Type, AlignLeft, ListTodo, Paperclip, FileText, ExternalLink, Copy, Check,
  TrendingUp, Timer, MessageSquare, Send, Image as ImageIcon
} from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlockEditor } from '../../templates/components/BlockEditor'
import { MarkdownViewer } from '../../../shared/components/MarkdownViewer'

const priorities = [
  { value: 'low', label: 'Low', icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', activeBg: 'bg-gray-500', gradient: 'from-gray-500 to-gray-600' },
  { value: 'medium', label: 'Medium', icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/20', activeBg: 'bg-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'high', label: 'High', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20', activeBg: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500' },
  { value: 'urgent', label: 'Urgent', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/20', activeBg: 'bg-red-500', gradient: 'from-red-500 to-rose-500' }
]

// Inline Editable Text Component
function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  inputClassName = '',
  multiline = false,
  autoFocus = false
}) {
  const [isEditing, setIsEditing] = useState(autoFocus)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.setSelectionRange) {
        const len = localValue?.length || 0
        inputRef.current.setSelectionRange(len, len)
      }
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setLocalValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none resize-none ${inputClassName}`}
          rows={4}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-transparent border-none outline-none ${inputClassName}`}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-text ${className} ${!value ? 'text-text-muted' : ''}`}
    >
      {value || placeholder}
    </div>
  )
}

// Property Row Component (Notion-style)
function PropertyRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2 group">
      <div className="flex items-center gap-2 w-28 shrink-0 text-text-muted text-sm">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value || 0)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setLocalValue(value || 0)
  }, [value])

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10)
    setLocalValue(newValue)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const getProgressColor = (val) => {
    if (val >= 80) return 'from-green-500 to-emerald-500'
    if (val >= 50) return 'from-blue-500 to-cyan-500'
    if (val >= 25) return 'from-orange-500 to-amber-500'
    return 'from-red-500 to-rose-500'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${localValue}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full bg-gradient-to-r ${getProgressColor(localValue)}`}
        />
      </div>
      {isEditing ? (
        <input
          type="number"
          min="0"
          max="100"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          autoFocus
          className="w-16 px-2 py-1 bg-bg-tertiary rounded text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            localValue === 100
              ? 'bg-green-500/20 text-green-400'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary'
          }`}
        >
          {localValue}%
        </button>
      )}
    </div>
  )
}

// Comment Item Component
function CommentItem({ comment, onDelete }) {
  return (
    <div className="flex gap-3 p-3 bg-bg-secondary/70 rounded-lg group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
        {comment.author?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary">{comment.author || 'User'}</span>
          <span className="text-xs text-text-muted">
            {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : 'Just now'}
          </span>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">{comment.text}</p>
      </div>
      <button
        onClick={() => onDelete?.(comment.id)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all self-start"
      >
        <Trash2 className="w-3 h-3 text-red-400" />
      </button>
    </div>
  )
}

// Comments Section Component
function CommentsSection({ comments = [], onAdd, onDelete }) {
  const [newComment, setNewComment] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAdd?.({
        id: crypto.randomUUID(),
        text: newComment.trim(),
        author: 'Hanzla',
        createdAt: new Date().toISOString()
      })
      setNewComment('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Add comment input */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
          H
        </div>
        <div className="flex-1 flex items-start gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Add a comment or note..."
            rows={2}
            className="flex-1 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-transparent focus:border-blue-500/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none transition-colors"
          />
          {newComment.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleSubmit}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

// Image Upload Component with Clipboard Paste Support
function ImageUploadZone({ onUpload }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Handle clipboard paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          setIsPasting(true)

          const file = item.getAsFile()
          if (file) {
            await processImageFile(file)
          }

          setIsPasting(false)
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onUpload])

  const processImageFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const attachment = {
          id: crypto.randomUUID(),
          name: file.name || `Screenshot-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.png`,
          type: 'image',
          path: `clipboard://${file.name || 'screenshot'}`,
          dataUrl: e.target.result,
          size: file.size,
          createdAt: new Date().toISOString()
        }
        onUpload?.(attachment)
        resolve()
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    for (const file of files) {
      await processImageFile(file)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await processImageFile(file)
      }
    }
    e.target.value = ''
  }

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 p-4
        border-2 border-dashed rounded-lg cursor-pointer transition-all
        ${isDragOver
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border hover:border-border-hover hover:bg-bg-secondary/50'
        }
        ${isPasting ? 'border-green-500 bg-green-500/10' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {isPasting ? (
        <>
          <div className="animate-pulse">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-sm text-green-400">Processing screenshot...</p>
        </>
      ) : (
        <>
          <div className="p-2 bg-bg-tertiary rounded-lg">
            <ImageIcon className="w-5 h-5 text-text-muted" />
          </div>
          <div className="text-center">
            <p className="text-sm text-text-muted">
              <span className="text-blue-400">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-text-muted mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">Ctrl+V</kbd> to paste screenshot
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Image Viewer Modal
function ImageViewer({ isOpen, onClose, src, name }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <img
          src={src}
          alt={name}
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <p className="text-center text-text-muted text-sm mt-3">{name}</p>
      </div>
    </div>
  )
}

// Check if file is an image
function isImageFile(path) {
  if (!path) return false
  const ext = path.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

// Attachment Item Component
function AttachmentItem({ attachment, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  const fileName = attachment.name || attachment.path?.split('/').pop() || 'Document'
  const filePath = attachment.path || attachment
  const isImage = attachment.type === 'image' || isImageFile(filePath)
  const isMarkdown = filePath.endsWith('.md')
  const canView = isMarkdown || isImage

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(filePath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenInVSCode = () => {
    window.open(`vscode://file${filePath}`, '_blank')
  }

  const handleView = () => {
    if (isImage) {
      setImageViewerOpen(true)
    } else if (isMarkdown) {
      setViewerOpen(true)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-bg-secondary/70 hover:bg-bg-tertiary rounded-lg border border-border group transition-colors">
        {isImage ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-tertiary shrink-0">
            <img
              src={attachment.dataUrl || `file://${filePath}`}
              alt={fileName}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleView}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
              }}
            />
          </div>
        ) : (
          <div className={`p-2 rounded-lg ${isMarkdown ? 'bg-blue-500/20' : 'bg-bg-tertiary'}`}>
            <FileText className={`w-4 h-4 ${isMarkdown ? 'text-blue-400' : 'text-text-muted'}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium truncate">{fileName}</p>
          <p className="text-xs text-text-muted truncate">{filePath}</p>
        </div>
        <div className="flex items-center gap-1">
          {canView && (
            <button
              onClick={handleView}
              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors"
            >
              View
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Copy path"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-text-muted" />
            )}
          </button>
          {!isImage && (
            <button
              onClick={handleOpenInVSCode}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Open in VS Code"
            >
              <ExternalLink className="w-4 h-4 text-text-muted" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(attachment)}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove attachment"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>
      <MarkdownViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        filePath={filePath}
        fileName={fileName}
      />
      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        src={attachment.dataUrl || `file://${filePath}`}
        name={fileName}
      />
    </>
  )
}

// Linked Document Display Component
function LinkedDocumentDisplay({ filePath, onRemove }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileName = filePath?.split('/').pop() || 'Document'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(filePath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenInVSCode = () => {
    window.open(`vscode://file${filePath}`, '_blank')
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">{fileName}</span>
        </div>
        <button
          onClick={() => setViewerOpen(true)}
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors"
        >
          View
        </button>
        <button
          onClick={handleOpenInVSCode}
          className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
          title="Open in VS Code"
        >
          <ExternalLink className="w-4 h-4 text-text-muted" />
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
          title="Copy path"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-text-muted" />
          )}
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Remove link"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>
      <MarkdownViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        filePath={filePath}
        fileName={fileName}
      />
    </>
  )
}

// Convert plain text description to block content format
function textToBlockContent(text) {
  if (!text) {
    return { type: 'doc', blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }] }
  }

  const lines = text.replace(/\\n/g, '\n').split('\n')
  const blocks = []

  lines.forEach((line) => {
    const trimmed = line.trim()
    const blockId = crypto.randomUUID()

    if (trimmed.startsWith('# ')) {
      blocks.push({ id: blockId, type: 'heading', level: 1, text: trimmed.slice(2) })
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id: blockId, type: 'heading', level: 2, text: trimmed.slice(3) })
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id: blockId, type: 'heading', level: 3, text: trimmed.slice(4) })
    } else if (trimmed === '---') {
      blocks.push({ id: blockId, type: 'divider' })
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ id: blockId, type: 'quote', text: trimmed.slice(2) })
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock?.type === 'list' && lastBlock?.style === 'bullet') {
        lastBlock.items.push(trimmed.slice(2))
      } else {
        blocks.push({ id: blockId, type: 'list', style: 'bullet', items: [trimmed.slice(2)] })
      }
    } else if (/^\d+\.\s/.test(trimmed)) {
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock?.type === 'list' && lastBlock?.style === 'numbered') {
        lastBlock.items.push(trimmed.replace(/^\d+\.\s/, ''))
      } else {
        blocks.push({ id: blockId, type: 'list', style: 'numbered', items: [trimmed.replace(/^\d+\.\s/, '')] })
      }
    } else {
      blocks.push({ id: blockId, type: 'paragraph', text: line })
    }
  })

  return { type: 'doc', blocks: blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }] }
}

export function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddComment,
  onDeleteComment,
  columns = []
}) {
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const isNewTask = task?.title === 'New Task'

  // Convert description to block content (only when editing)
  const descriptionContent = useMemo(() => {
    return textToBlockContent(task?.description)
  }, [task?.description])

  // Reset editing state when task changes
  useEffect(() => {
    setIsEditingDescription(false)
  }, [task?.id])

  // Auto-update function
  const handleUpdate = useCallback((field, value) => {
    if (!task) return
    onUpdate?.(task.id, { [field]: value })
  }, [task, onUpdate])

  // Handle description save from BlockEditor
  const handleDescriptionSave = useCallback(({ rawMarkdown }) => {
    handleUpdate('description', rawMarkdown)
    setIsEditingDescription(false)
  }, [handleUpdate])

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask?.(task.id, newSubtask.trim())
      setNewSubtask('')
    }
  }

  const handleClose = () => {
    // If it's a new task with no title, delete it
    if (task?.title === 'New Task') {
      onDelete?.(task.id)
    }
    onClose()
  }

  if (!isOpen || !task) return null

  const completedSubtasks = task.subtasks?.filter(st => st.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const currentColumn = columns.find(c => c.id === task.columnId)
  const currentPriority = priorities.find(p => p.value === task.priority) || priorities[1]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl h-full bg-bg-primary border-l border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header - Minimal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentColumn?.color || '#3b82f6' }}
              />
              <span className="text-sm text-text-muted">{currentColumn?.name || 'Task'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete?.(task.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Title - Large, Notion-style */}
            <div className="px-6 pt-6 pb-4">
              <EditableText
                value={task.title === 'New Task' ? '' : task.title}
                onChange={(val) => handleUpdate('title', val || 'Untitled')}
                placeholder="Untitled"
                autoFocus={isNewTask}
                className="text-2xl font-bold text-text-primary hover:bg-bg-secondary rounded-lg px-2 py-1 -mx-2 transition-colors"
                inputClassName="text-2xl font-bold text-text-primary px-2 py-1"
              />
            </div>

            {/* Properties Section */}
            <div className="px-6 py-2 border-y border-border">
              {/* Status/Column */}
              <PropertyRow icon={ListTodo} label="Status">
                <div className="flex flex-wrap gap-1.5">
                  {columns.map(col => (
                    <button
                      key={col.id}
                      onClick={() => handleUpdate('columnId', col.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-all ${
                        task.columnId === col.id
                          ? 'bg-bg-tertiary text-text-primary'
                          : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary hover:text-text-secondary'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      {col.name}
                    </button>
                  ))}
                </div>
              </PropertyRow>

              {/* Priority */}
              <PropertyRow icon={Flag} label="Priority">
                <div className="flex gap-1.5">
                  {priorities.map(p => {
                    const Icon = p.icon
                    const isSelected = task.priority === p.value
                    return (
                      <button
                        key={p.value}
                        onClick={() => handleUpdate('priority', p.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-all ${
                          isSelected
                            ? `bg-gradient-to-r ${p.gradient} text-white shadow-sm`
                            : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </PropertyRow>

              {/* Due Date */}
              <PropertyRow icon={Calendar} label="Due Date">
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={(e) => handleUpdate('dueDate', e.target.value || null)}
                  className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-tertiary border-none rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
                />
                {task.dueDate && (
                  <span className="ml-2 text-sm text-text-muted">
                    {format(new Date(task.dueDate), 'EEEE, MMM d')}
                  </span>
                )}
              </PropertyRow>

              {/* Progress */}
              <PropertyRow icon={TrendingUp} label="Progress">
                <ProgressBar
                  value={task.progress || 0}
                  onChange={(val) => handleUpdate('progress', val)}
                />
              </PropertyRow>

              {/* Time Estimate */}
              <PropertyRow icon={Timer} label="Estimate">
                <EditableText
                  value={task.timeEstimate}
                  onChange={(val) => handleUpdate('timeEstimate', val)}
                  placeholder="e.g., 2 weeks, 3 days..."
                  className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-tertiary rounded-md text-sm text-text-secondary transition-colors"
                  inputClassName="px-2.5 py-1 text-sm text-text-primary"
                />
              </PropertyRow>

              {/* Linked Document */}
              {task.linkedFile && (
                <PropertyRow icon={FileText} label="Document">
                  <LinkedDocumentDisplay
                    filePath={task.linkedFile}
                    onRemove={() => handleUpdate('linkedFile', null)}
                  />
                </PropertyRow>
              )}
            </div>

            {/* Description */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <AlignLeft className="w-4 h-4" />
                  <span>Description</span>
                  {isEditingDescription && (
                    <span className="text-xs text-text-muted">Type / for commands</span>
                  )}
                </div>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                /* Block Editor for editing */
                <div className="bg-bg-secondary/50 rounded-xl border border-border overflow-hidden min-h-[200px]">
                  <BlockEditor
                    key={`${task.id}-edit`}
                    initialContent={descriptionContent}
                    onSave={handleDescriptionSave}
                    autoSave={false}
                    showToolbar={true}
                  />
                  <div className="flex justify-end gap-2 p-3 border-t border-border">
                    <button
                      onClick={() => setIsEditingDescription(false)}
                      className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Simple view mode with markdown rendering */
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="bg-bg-secondary/50 hover:bg-bg-tertiary/50 rounded-xl p-4 transition-colors border border-border cursor-pointer min-h-[80px]"
                >
                  {task.description ? (
                    <div className="prose prose-sm prose-invert max-w-none
                      prose-headings:text-text-primary prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                      prose-p:text-text-secondary prose-p:my-2
                      prose-strong:text-text-primary prose-strong:font-semibold
                      prose-em:text-text-secondary
                      prose-ul:text-text-secondary prose-ul:my-2 prose-ul:pl-4
                      prose-ol:text-text-secondary prose-ol:my-2 prose-ol:pl-4
                      prose-li:my-0.5
                      prose-code:text-blue-300 prose-code:bg-blue-500/20 prose-code:px-1 prose-code:rounded
                      prose-blockquote:border-l-2 prose-blockquote:border-border-hover prose-blockquote:pl-4 prose-blockquote:text-text-muted
                      prose-hr:border-border"
                    >
                      <ReactMarkdown>
                        {task.description.replace(/\\n/g, '\n')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm italic">
                      Click to add a description...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-3">
                <Paperclip className="w-4 h-4" />
                <span>Attachments</span>
                {task.attachments?.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {task.attachments.length}
                  </span>
                )}
              </div>

              {/* Existing attachments */}
              {task.attachments?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {task.attachments.map((attachment, index) => (
                    <AttachmentItem
                      key={attachment.id || index}
                      attachment={attachment}
                      onDelete={(att) => {
                        const updatedAttachments = (task.attachments || []).filter(
                          (a, i) => (a.id ? a.id !== att.id : i !== index)
                        )
                        handleUpdate('attachments', updatedAttachments)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Image upload zone */}
              <ImageUploadZone
                onUpload={(attachment) => {
                  const updatedAttachments = [...(task.attachments || []), attachment]
                  handleUpdate('attachments', updatedAttachments)
                }}
              />
            </div>

            {/* Subtasks Section */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <CheckSquare className="w-4 h-4" />
                  <span>Subtasks</span>
                  {totalSubtasks > 0 && (
                    <span className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs">
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {totalSubtasks > 0 && (
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-1 mb-3">
                <AnimatePresence>
                  {task.subtasks?.map((subtask, index) => (
                    <motion.div
                      key={subtask.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2 p-2 rounded-lg group hover:bg-bg-secondary transition-colors"
                    >
                      <div className="opacity-0 group-hover:opacity-50 cursor-grab">
                        <GripVertical className="w-3 h-3 text-text-muted" />
                      </div>
                      <button
                        onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                        className="shrink-0 transition-transform hover:scale-110"
                      >
                        {subtask.done ? (
                          <CheckSquare className="w-4 h-4 text-green-400" />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted hover:text-text-muted" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${
                        subtask.done ? 'text-text-muted line-through' : 'text-text-secondary'
                      }`}>
                        {subtask.text}
                      </span>
                      <button
                        onClick={() => onDeleteSubtask?.(task.id, subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add subtask input */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors border border-transparent focus-within:border-blue-500/30">
                  <Plus className="w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                {newSubtask.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleAddSubtask}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </motion.button>
                )}
              </div>
            </div>

            {/* Comments/Notes Section */}
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
                <MessageSquare className="w-4 h-4" />
                <span>Comments & Notes</span>
                {task.comments?.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {task.comments.length}
                  </span>
                )}
              </div>
              <CommentsSection
                comments={task.comments || []}
                onAdd={(comment) => {
                  const updatedComments = [...(task.comments || []), comment]
                  handleUpdate('comments', updatedComments)
                }}
                onDelete={(commentId) => {
                  const updatedComments = (task.comments || []).filter(c => c.id !== commentId)
                  handleUpdate('comments', updatedComments)
                }}
              />
            </div>

            {/* Footer info */}
            {!isNewTask && (
              <div className="px-6 py-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Created {format(new Date(task.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TaskDetailPanel
