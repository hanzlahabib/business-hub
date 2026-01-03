import { motion } from 'framer-motion'
import { Video, Smartphone, MoreVertical, Trash2, Edit, GripVertical, MessageSquare, Youtube, FileText, FileCode, Link2, Presentation, Monitor, Pencil, User } from 'lucide-react'
import { Badge } from '../UI'
import { useState, useCallback, useMemo, memo } from 'react'

const URL_ICONS = {
  youtube: { icon: Youtube, color: 'text-red-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  github: { icon: FileCode, color: 'text-purple-500' },
  other: { icon: Link2, color: 'text-gray-400' }
}

const VIDEO_VARIANT_CONFIG = {
  'cozy-screen': { icon: Monitor, color: '#8B5CF6', label: 'Cozy' },
  'whiteboard': { icon: Pencil, color: '#F59E0B', label: 'Whiteboard' },
  'slides-face': { icon: User, color: '#10B981', label: 'Slides' },
  'notion-doc': { icon: FileText, color: '#3B82F6', label: 'Notion' }
}

// Video Variant Badge Component
function VideoVariantBadge({ variant, size = 'default' }) {
  const config = VIDEO_VARIANT_CONFIG[variant]
  if (!config) return null

  const VariantIcon = config.icon

  if (size === 'icon') {
    return <VariantIcon size={10} style={{ color: config.color }} title={config.label} />
  }

  if (size === 'small') {
    return <VariantIcon size={12} style={{ color: config.color }} title={config.label} />
  }

  return (
    <span
      className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <VariantIcon size={10} />
      {config.label}
    </span>
  )
}

const statusColors = {
  idea: 'default',
  script: 'warning',
  recording: 'primary',
  editing: 'secondary',
  thumbnail: 'warning',
  published: 'success'
}

export const ContentCard = memo(function ContentCard({ content, viewMode = 'default', onEdit, onDelete, onClick }) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const isLong = content.type === 'long'
  const Icon = isLong ? Video : Smartphone

  const handleDragStart = useCallback((e) => {
    setIsDragging(true)
    e.dataTransfer.setData('contentId', content.id)
    e.dataTransfer.effectAllowed = 'move'
  }, [content.id])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const toggleMenu = useCallback((e) => {
    e.stopPropagation()
    setShowMenu(prev => !prev)
  }, [])

  const handleEdit = useCallback((e) => {
    e.stopPropagation()
    onEdit?.(content)
    setShowMenu(false)
  }, [content, onEdit])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    onDelete?.(content.id)
    setShowMenu(false)
  }, [content.id, onDelete])

  const baseClasses = useMemo(() => `
    relative cursor-grab active:cursor-grabbing transition-all
    ${isDragging ? 'opacity-50 scale-95 rotate-2' : 'hover:scale-[1.02]'}
    ${isLong
      ? 'bg-accent-secondary/10 border-accent-secondary/30'
      : 'bg-accent-primary/10 border-accent-primary/30'
    }
  `, [isDragging, isLong])

  // Compact View - Single line, minimal info
  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={`${baseClasses} p-2 rounded-lg border flex items-center gap-2`}
      >
        <Icon size={12} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
        <p className="text-xs font-medium text-text-primary truncate flex-1">
          {content.title || 'Untitled'}
        </p>
        {/* URL & Comment indicators */}
        <div className="flex items-center gap-1">
          <VideoVariantBadge variant={content.videoVariant} size="icon" />
          {content.urls?.length > 0 && (
            <div className="flex items-center -space-x-1">
              {[...new Set(content.urls.map(u => u.type))].slice(0, 2).map(type => {
                const { icon: UrlIcon, color } = URL_ICONS[type] || URL_ICONS.other
                return <UrlIcon key={type} size={10} className={color} />
              })}
            </div>
          )}
          {content.comments?.length > 0 && (
            <span className="text-[10px] text-text-muted flex items-center">
              <MessageSquare size={10} className="mr-0.5" />
              {content.comments.length}
            </span>
          )}
          {content.presentationReady && (
            <Presentation size={10} className="text-accent-success" title="Presentation Ready" />
          )}
        </div>
        <span className={`w-2 h-2 rounded-full ${
          content.status === 'published' ? 'bg-accent-success' :
          content.status === 'editing' || content.status === 'thumbnail' ? 'bg-accent-warning' :
          'bg-text-muted/50'
        }`} />
      </motion.div>
    )
  }

  // Detailed View - Full info with notes and hook
  if (viewMode === 'detailed') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={`${baseClasses} p-4 rounded-xl border cursor-pointer`}
      >
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1">
            <GripVertical size={12} className="text-text-muted/50" />
            <div className={`p-2 rounded-lg ${isLong ? 'bg-accent-secondary/20' : 'bg-accent-primary/20'}`}>
              <Icon size={16} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">{content.title || 'Untitled'}</p>
            {content.topic && (
              <p className="text-xs text-text-muted mt-0.5">{content.topic}</p>
            )}
          </div>
          <div className="relative">
            <button onClick={toggleMenu} className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary">
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-bg-secondary border border-border rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                <button onClick={handleEdit} className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-text-primary">
                  <Edit size={14} /> Edit
                </button>
                <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-accent-danger">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge variant={isLong ? 'long' : 'short'} size="xs">{isLong ? 'Long' : 'Short'}</Badge>
          <Badge variant={statusColors[content.status]} size="xs">{content.status}</Badge>
          <VideoVariantBadge variant={content.videoVariant} />
          {content.presentationReady && (
            <span className="flex items-center gap-1 text-xs text-accent-success">
              <Presentation size={12} />
              Ready
            </span>
          )}
        </div>

        {content.hook && (
          <div className="mt-3 p-2 rounded-lg bg-bg-tertiary/50">
            <p className="text-xs text-text-muted flex items-center gap-1">
              <MessageSquare size={10} /> Hook
            </p>
            <p className="text-xs text-text-primary mt-0.5 italic">"{content.hook}"</p>
          </div>
        )}

        {content.notes && (
          <p className="mt-2 text-xs text-text-muted/80 line-clamp-2">{content.notes}</p>
        )}

        {/* URL badges & Comment count */}
        {(content.urls?.length > 0 || content.comments?.length > 0) && (
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-3">
            {content.urls?.length > 0 && (
              <div className="flex items-center gap-1">
                {content.urls.slice(0, 3).map(urlItem => {
                  const { icon: UrlIcon, color } = URL_ICONS[urlItem.type] || URL_ICONS.other
                  return (
                    <a
                      key={urlItem.id}
                      href={urlItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1 rounded hover:bg-bg-tertiary ${color}`}
                      title={urlItem.label || urlItem.url}
                    >
                      <UrlIcon size={12} />
                    </a>
                  )
                })}
                {content.urls.length > 3 && (
                  <span className="text-[10px] text-text-muted">+{content.urls.length - 3}</span>
                )}
              </div>
            )}
            {content.comments?.length > 0 && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <MessageSquare size={12} />
                {content.comments.length}
              </span>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  // Default View
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`${baseClasses} p-3 rounded-xl border cursor-pointer`}
    >
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1">
          <GripVertical size={12} className="text-text-muted/50" />
          <div className={`p-1.5 rounded-lg ${isLong ? 'bg-accent-secondary/20' : 'bg-accent-primary/20'}`}>
            <Icon size={14} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{content.title || 'Untitled'}</p>
          {content.topic && (
            <p className="text-xs text-text-muted truncate mt-0.5">{content.topic}</p>
          )}
        </div>
        <div className="relative">
          <button onClick={toggleMenu} className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary">
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-bg-secondary border border-border rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
              <button onClick={handleEdit} className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-text-primary">
                <Edit size={14} /> Edit
              </button>
              <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-accent-danger">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <Badge variant={isLong ? 'long' : 'short'} size="xs">{isLong ? 'Long' : 'Short'}</Badge>
        <Badge variant={statusColors[content.status]} size="xs">{content.status}</Badge>
        <VideoVariantBadge variant={content.videoVariant} size="small" />
        {content.presentationReady && (
          <Presentation size={12} className="text-accent-success" title="Presentation Ready" />
        )}
        {/* URL & Comment indicators */}
        {content.urls?.length > 0 && (
          <div className="flex items-center gap-0.5 ml-auto">
            {[...new Set(content.urls.map(u => u.type))].slice(0, 3).map(type => {
              const { icon: UrlIcon, color } = URL_ICONS[type] || URL_ICONS.other
              return <UrlIcon key={type} size={12} className={color} />
            })}
          </div>
        )}
        {content.comments?.length > 0 && (
          <span className="text-[10px] text-text-muted flex items-center gap-0.5">
            <MessageSquare size={10} />
            {content.comments.length}
          </span>
        )}
      </div>
    </motion.div>
  )
})
