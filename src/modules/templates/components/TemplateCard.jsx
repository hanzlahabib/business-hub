import { motion } from 'framer-motion'
import {
  FileText,
  Mail,
  Linkedin,
  ClipboardList,
  File,
  Star,
  Pin,
  Copy,
  MoreHorizontal,
  Calendar,
  Hash
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const categoryConfig = {
  linkedin: {
    label: 'LinkedIn',
    color: 'from-blue-600/20 to-cyan-500/20 border-blue-500/30',
    icon: Linkedin,
    gradient: 'from-blue-500 to-cyan-500'
  },
  email: {
    label: 'Email',
    color: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    icon: Mail,
    gradient: 'from-red-500 to-orange-500'
  },
  proposal: {
    label: 'Proposal',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    icon: ClipboardList,
    gradient: 'from-green-500 to-emerald-500'
  },
  document: {
    label: 'Document',
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    icon: FileText,
    gradient: 'from-amber-500 to-yellow-500'
  },
  custom: {
    label: 'Custom',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    icon: File,
    gradient: 'from-purple-500 to-pink-500'
  }
}

const statusBadges = {
  draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-500 border border-gray-500/20' },
  published: { label: 'Published', className: 'bg-green-500/10 text-green-600 border border-green-500/20' },
  archived: { label: 'Archived', className: 'bg-red-500/10 text-red-600 border border-red-500/20' }
}

export function TemplateCard({
  template,
  onClick,
  onMenuClick,
  onCopy,
  onToggleFavorite,
  isDragging
}) {
  const config = categoryConfig[template.category] || categoryConfig.custom
  const CategoryIcon = config.icon
  const statusBadge = statusBadges[template.status] || statusBadges.draft

  const previewText = template.rawMarkdown
    ?.replace(/\{\{[\w]+\}\}/g, '...')
    ?.replace(/[#*_\-]/g, '')
    ?.slice(0, 100)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(template)}
      className={`
        group relative cursor-pointer
        bg-gradient-to-br ${config.color}
        border rounded-xl p-4
        transition-all duration-200
        ${isDragging ? 'shadow-xl ring-2 ring-white/20' : 'hover:shadow-lg'}
      `}
    >
      {/* Menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onMenuClick?.(template, e)
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary transition-all"
      >
        <MoreHorizontal className="w-4 h-4 text-text-muted" />
      </button>

      {/* Pinned/Favorite indicators */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        {template.isPinned && (
          <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
        )}
        {template.isFavorite && (
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        )}
      </div>

      {/* Header */}
      <div className="mb-3 mt-2">
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${config.gradient}`}>
            <CategoryIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-2">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                {template.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewText && (
        <div className="mb-3 p-2 bg-black/20 rounded-lg">
          <p className="text-xs text-text-muted line-clamp-2 font-mono">
            {previewText}...
          </p>
        </div>
      )}

      {/* Variables count */}
      {template.variables && template.variables.length > 0 && (
        <div className="flex items-center gap-1 mb-2 text-xs text-text-muted">
          <Hash className="w-3 h-3" />
          <span>{template.variables.length} variables</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          {template.usageCount > 0 && (
            <span className="text-xs text-text-muted">
              {template.usageCount} uses
            </span>
          )}
        </div>

        {template.lastUsedAt ? (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(template.lastUsedAt), { addSuffix: true })}</span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">Never used</span>
        )}
      </div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary border border-border/50"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-[10px] text-text-muted">+{template.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Quick Copy Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onCopy?.(template)
        }}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary transition-all"
        title="Copy to clipboard"
      >
        <Copy className="w-4 h-4 text-text-muted" />
      </button>
    </motion.div>
  )
}

export default TemplateCard
