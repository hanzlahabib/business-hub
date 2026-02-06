import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Plus } from 'lucide-react'

export function CommentBubble({
  count = 0,
  hasUnresolved = false,
  onClick,
  onAddComment,
  position = 'right', // 'right' | 'left'
  size = 'default' // 'small' | 'default'
}) {
  const [showAddButton, setShowAddButton] = useState(false)

  const sizeClasses = {
    small: 'w-5 h-5 text-xs',
    default: 'w-6 h-6 text-xs'
  }

  const positionClasses = {
    right: 'right-0 translate-x-1/2',
    left: 'left-0 -translate-x-1/2'
  }

  if (count === 0 && !showAddButton) {
    return (
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${positionClasses[position]}`}
        onMouseEnter={() => setShowAddButton(true)}
        onMouseLeave={() => setShowAddButton(false)}
      >
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onAddComment}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors opacity-0 group-hover:opacity-100`}
            title="Add comment"
          >
            <Plus className="w-3 h-3" />
          </motion.button>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${positionClasses[position]}`}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-colors ${
          hasUnresolved
            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
            : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
        }`}
        title={`${count} comment${count !== 1 ? 's' : ''}${hasUnresolved ? ' (unresolved)' : ''}`}
      >
        {count > 0 ? (
          <span className="font-medium">{count > 9 ? '9+' : count}</span>
        ) : (
          <MessageCircle className="w-3 h-3" />
        )}
      </motion.button>

      {/* Unresolved indicator dot */}
      {hasUnresolved && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
      )}
    </div>
  )
}

// Floating comment button that appears on hover
export function FloatingCommentButton({ onClick, className = '' }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-full transition-colors ${className}`}
      title="Add comment"
    >
      <MessageCircle className="w-4 h-4" />
    </motion.button>
  )
}

// Comment indicator for sidebars/panels
export function CommentIndicator({
  count = 0,
  unresolvedCount = 0,
  onClick,
  showLabel = true,
  size = 'default'
}) {
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5'
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg transition-colors ${sizeClasses[size]} ${
        unresolvedCount > 0
          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
          : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
      }`}
    >
      <MessageCircle className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
      {showLabel && (
        <span>
          {count} {count === 1 ? 'comment' : 'comments'}
          {unresolvedCount > 0 && (
            <span className="ml-1 text-amber-400">
              ({unresolvedCount} open)
            </span>
          )}
        </span>
      )}
      {!showLabel && count > 0 && (
        <span>{count}</span>
      )}
    </button>
  )
}

export default CommentBubble
