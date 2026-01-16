import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, FileText, Video, Scissors, Image, CheckCircle, TrendingUp, X, Filter
} from 'lucide-react'
import { flowNodeReveal } from '../../lib/animations'

// ============================================================================
// CONSTANTS
// ============================================================================

const STAGES = [
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: '#94a3b8', description: 'Initial concept' },
  { id: 'script', label: 'Script', icon: FileText, color: '#3b82f6', description: 'Writing content' },
  { id: 'recording', label: 'Recording', icon: Video, color: '#f59e0b', description: 'Filming' },
  { id: 'editing', label: 'Editing', icon: Scissors, color: '#8b5cf6', description: 'Post-production' },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, color: '#f97316', description: 'Final touches' },
  { id: 'published', label: 'Published', icon: CheckCircle, color: '#22c55e', description: 'Live!' }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TaskFlow = memo(function TaskFlow({
  contents = [],
  activeStage = null,
  onStageClick,
  showStats = true,
  compact = false
}) {
  // Calculate counts per stage
  const stageCounts = useMemo(() => {
    const counts = {}
    STAGES.forEach(s => {
      counts[s.id] = contents.filter(c => c.status === s.id).length
    })
    return counts
  }, [contents])

  // Calculate completion stats
  const stats = useMemo(() => {
    const total = contents.length
    if (total === 0) return { published: 0, inProgress: 0, percentage: 0 }

    const published = stageCounts.published
    const inProgress = total - published
    const percentage = Math.round((published / total) * 100)

    return { published, inProgress, percentage, total }
  }, [contents, stageCounts])

  // Find current active stage index for progress line
  const activeIndex = useMemo(() => {
    if (!activeStage) return -1
    return STAGES.findIndex(s => s.id === activeStage)
  }, [activeStage])

  return (
    <div className={`
      relative bg-bg-secondary rounded-2xl border border-border
      ${compact ? 'p-4' : 'p-6'}
    `}>
      {/* Header with Stats */}
      {showStats && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Content Pipeline</h3>
              <p className="text-xs text-text-muted">{stats.total} items in workflow</p>
            </div>
          </div>

          {/* Active Filter Badge + Completion percentage */}
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {activeStage && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  onClick={() => onStageClick?.(activeStage)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary/20 text-accent-primary text-sm font-medium hover:bg-accent-primary/30 transition-colors"
                >
                  <Filter size={14} />
                  <span>Filtering: {STAGES.find(s => s.id === activeStage)?.label}</span>
                  <X size={14} className="opacity-70 hover:opacity-100" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="text-right">
              <motion.span
                key={stats.percentage}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-gradient"
              >
                {stats.percentage}%
              </motion.span>
              <p className="text-xs text-text-muted">Published</p>
            </div>
          </div>
        </div>
      )}

      {/* Flow Pipeline */}
      <div className="relative flex items-center justify-between">
        {/* Background connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-bg-tertiary -translate-y-1/2 rounded-full" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full gradient-primary progress-glow"
          initial={{ width: 0 }}
          animate={{
            width: activeIndex >= 0
              ? `${(activeIndex / (STAGES.length - 1)) * 100}%`
              : '0%'
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Stage Nodes */}
        {STAGES.map((stage, index) => (
          <TaskFlowNode
            key={stage.id}
            stage={stage}
            index={index}
            count={stageCounts[stage.id]}
            isActive={activeStage === stage.id}
            isCompleted={activeIndex > index}
            compact={compact}
            onClick={() => onStageClick?.(stage.id)}
          />
        ))}
      </div>

      {/* Quick Stats Bar */}
      {showStats && (
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
          <StatBadge
            label="In Progress"
            value={stats.inProgress}
            color="accent-warning"
          />
          <StatBadge
            label="Published"
            value={stats.published}
            color="accent-success"
          />
          {!activeStage && (
            <span className="text-xs text-text-muted/60 italic">
              Click a stage to filter
            </span>
          )}
        </div>
      )}
    </div>
  )
})

// ============================================================================
// NODE COMPONENT
// ============================================================================

const TaskFlowNode = memo(function TaskFlowNode({
  stage,
  index,
  count,
  isActive,
  isCompleted,
  compact,
  onClick
}) {
  const Icon = stage.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...flowNodeReveal(index)}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className="relative z-10 flex flex-col items-center gap-2 group"
    >
      {/* Glow ring for active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.5, 0, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{ backgroundColor: stage.color }}
        />
      )}

      {/* Node circle */}
      <motion.div
        className={`
          relative flex items-center justify-center rounded-full
          transition-glow cursor-pointer
          ${compact ? 'w-12 h-12' : 'w-14 h-14'}
          ${isActive ? 'ring-pulse' : ''}
        `}
        style={{
          backgroundColor: isActive || isCompleted
            ? stage.color
            : 'var(--color-bg-tertiary)',
          boxShadow: isActive
            ? `0 0 30px ${stage.color}60, 0 0 60px ${stage.color}30`
            : 'none'
        }}
      >
        <Icon
          size={compact ? 18 : 22}
          className={isActive || isCompleted ? 'text-white' : 'text-text-muted'}
        />

        {/* Count badge */}
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              absolute -top-1 -right-1 flex items-center justify-center
              rounded-full bg-accent-primary text-white text-xs font-bold
              ${compact ? 'w-4 h-4 text-[10px]' : 'w-5 h-5'}
            `}
          >
            {count}
          </motion.span>
        )}
      </motion.div>

      {/* Label */}
      {!compact && (
        <span
          className={`
            text-xs font-medium transition-colors
            ${isActive ? 'text-text-primary' : 'text-text-muted'}
            group-hover:text-text-primary
          `}
        >
          {stage.label}
        </span>
      )}

      {/* Tooltip on hover for compact mode */}
      {compact && (
        <div className="
          absolute -bottom-8 left-1/2 -translate-x-1/2
          px-2 py-1 rounded bg-bg-tertiary text-xs text-text-primary
          opacity-0 group-hover:opacity-100 transition-opacity
          whitespace-nowrap pointer-events-none
        ">
          {stage.label} ({count})
        </div>
      )}
    </motion.button>
  )
})

// ============================================================================
// STAT BADGE COMPONENT
// ============================================================================

const StatBadge = memo(function StatBadge({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full bg-${color}`} />
      <span className="text-xs text-text-muted">{label}:</span>
      <motion.span
        key={value}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className={`text-sm font-semibold text-${color}`}
      >
        {value}
      </motion.span>
    </div>
  )
})
