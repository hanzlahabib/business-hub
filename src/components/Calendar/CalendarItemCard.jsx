import { useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Video, Smartphone, CheckSquare, Briefcase, Users, Target } from 'lucide-react'
import { CALENDAR_ITEM_TYPES } from '../../hooks/useCalendarItems'

// Type-specific styling using CSS variables
const TYPE_STYLES = {
  content: {
    bg: 'bg-[var(--color-calendar-content)]/10',
    border: 'border-[var(--color-calendar-content)]/30',
    text: 'text-[var(--color-calendar-content)]'
  },
  task: {
    bg: 'bg-[var(--color-calendar-task)]/10',
    border: 'border-[var(--color-calendar-task)]/30',
    text: 'text-[var(--color-calendar-task)]'
  },
  interview: {
    bg: 'bg-[var(--color-calendar-interview)]/10',
    border: 'border-[var(--color-calendar-interview)]/30',
    text: 'text-[var(--color-calendar-interview)]'
  },
  lead: {
    bg: 'bg-[var(--color-calendar-lead)]/10',
    border: 'border-[var(--color-calendar-lead)]/30',
    text: 'text-[var(--color-calendar-lead)]'
  },
  milestone: {
    bg: 'bg-[var(--color-calendar-milestone)]/10',
    border: 'border-[var(--color-calendar-milestone)]/30',
    text: 'text-[var(--color-calendar-milestone)]'
  }
}

// Icon mapping
const TYPE_ICONS = {
  content: Video,
  task: CheckSquare,
  interview: Briefcase,
  lead: Users,
  milestone: Target
}

// Priority indicator colors
const PRIORITY_COLORS = {
  high: 'bg-accent-danger',
  medium: 'bg-accent-warning',
  low: 'bg-accent-info'
}

export const CalendarItemCard = memo(function CalendarItemCard({
  item,
  viewMode = 'default',
  onClick,
  onDragStart,
  onDragEnd
}) {
  const [isDragging, setIsDragging] = useState(false)

  const styles = TYPE_STYLES[item.type] || TYPE_STYLES.content
  const Icon = item.icon || TYPE_ICONS[item.type] || CheckSquare
  const typeConfig = CALENDAR_ITEM_TYPES[item.type]

  const handleDragStart = useCallback((e) => {
    if (!item.draggable) {
      e.preventDefault()
      return
    }
    setIsDragging(true)
    e.dataTransfer.setData('calendarItemId', item.id)
    e.dataTransfer.setData('calendarItemType', item.type)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(item)
  }, [item, onDragStart])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    onDragEnd?.(item)
  }, [item, onDragEnd])

  const handleClick = useCallback(() => {
    onClick?.(item)
  }, [item, onClick])

  // Compact view - single line with icon and title
  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        draggable={item.draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={`
          relative p-1.5 rounded-md border flex items-center gap-1.5
          ${item.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
          ${styles.bg} ${styles.border}
          transition-all
        `}
      >
        <Icon size={10} className={styles.text} />
        <p className="text-[10px] font-medium text-text-primary truncate flex-1">
          {item.title}
        </p>
        {item.priority && (
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium}`} />
        )}
      </motion.div>
    )
  }

  // Detailed view - more info
  if (viewMode === 'detailed') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        draggable={item.draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={`
          relative p-3 rounded-lg border
          ${item.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isDragging ? 'opacity-50 scale-95 rotate-1' : 'hover:scale-[1.02]'}
          ${styles.bg} ${styles.border}
          transition-all
        `}
      >
        <div className="flex items-start gap-2">
          {item.draggable && (
            <GripVertical size={12} className="text-text-muted/50 mt-0.5" />
          )}
          <div className={`p-1.5 rounded-md ${styles.bg}`}>
            <Icon size={14} className={styles.text} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary leading-tight line-clamp-2">
              {item.title}
            </p>
            {typeConfig && (
              <span className={`text-[10px] ${styles.text} mt-0.5`}>
                {typeConfig.label}
              </span>
            )}
          </div>
          {item.priority && (
            <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium}`} />
          )}
        </div>

        {/* Show additional info based on type */}
        {item.type === 'task' && item.sourceData?.subtasks?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-[10px] text-text-muted">
              {item.sourceData.subtasks.filter(s => s.done).length}/{item.sourceData.subtasks.length} subtasks
            </p>
          </div>
        )}

        {item.type === 'interview' && item.sourceData?.role && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-[10px] text-text-muted truncate">
              {item.sourceData.role}
            </p>
          </div>
        )}

        {item.type === 'milestone' && item.pathName && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-[10px] text-text-muted truncate">
              {item.pathName}
            </p>
          </div>
        )}
      </motion.div>
    )
  }

  // Default view - balanced info
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      draggable={item.draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`
        relative p-2 rounded-lg border
        ${item.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isDragging ? 'opacity-50 scale-95 rotate-1' : 'hover:scale-[1.02]'}
        ${styles.bg} ${styles.border}
        transition-all
      `}
    >
      <div className="flex items-center gap-2">
        {item.draggable && (
          <GripVertical size={10} className="text-text-muted/50" />
        )}
        <div className={`p-1 rounded-md ${styles.bg}`}>
          <Icon size={12} className={styles.text} />
        </div>
        <p className="text-xs font-medium text-text-primary truncate flex-1">
          {item.title}
        </p>
        {item.priority && (
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium}`} />
        )}
      </div>
    </motion.div>
  )
})

export default CalendarItemCard
