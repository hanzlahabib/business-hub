import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, FileText, Video, Scissors, Image, CheckCircle, X
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const STAGES = [
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: '#64748b' },
  { id: 'script', label: 'Script', icon: FileText, color: '#3b82f6' },
  { id: 'recording', label: 'Recording', icon: Video, color: '#f59e0b' },
  { id: 'editing', label: 'Editing', icon: Scissors, color: '#a855f7' },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, color: '#f97316' },
  { id: 'published', label: 'Published', icon: CheckCircle, color: '#22c55e' }
]

export const TaskFlow = memo(function TaskFlow({
  contents = [],
  activeStage = null,
  onStageClick,
  showStats = true
}) {
  const stageCounts = useMemo(() => {
    const counts = {}
    STAGES.forEach(s => {
      counts[s.id] = contents.filter(c => c.status === s.id).length
    })
    return counts
  }, [contents])

  const stats = useMemo(() => {
    const total = contents.length
    if (total === 0) return { published: 0, inProgress: 0, percentage: 0, total: 0 }

    const published = stageCounts.published
    const inProgress = total - published
    const percentage = Math.round((published / total) * 100)

    return { published, inProgress, percentage, total }
  }, [contents, stageCounts])

  return (
    <Card className="bg-bg-secondary/80 border-border p-4">
      <div className="flex items-center gap-6">
        {/* Stage Pills */}
        <div className="flex items-center gap-2 flex-1">
          {STAGES.map((stage, index) => {
            const count = stageCounts[stage.id]
            const isActive = activeStage === stage.id
            const Icon = stage.icon

            return (
              <motion.button
                key={stage.id}
                onClick={() => onStageClick?.(stage.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${isActive
                    ? 'ring-2 ring-offset-2 ring-offset-bg-secondary'
                    : 'hover:bg-bg-tertiary/50'
                  }
                `}
                style={{
                  backgroundColor: isActive ? `${stage.color}20` : 'transparent',
                  ringColor: isActive ? stage.color : 'transparent'
                }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${stage.color}20` }}
                >
                  <Icon size={14} style={{ color: stage.color }} />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-medium text-text-primary">{stage.label}</p>
                  <p className="text-[10px] text-text-muted">{count} items</p>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-[10px] font-bold lg:hidden"
                  style={{
                    backgroundColor: count > 0 ? `${stage.color}20` : 'var(--color-bg-tertiary)',
                    color: count > 0 ? stage.color : 'var(--color-text-muted)'
                  }}
                >
                  {count}
                </Badge>

                {/* Connector line */}
                {index < STAGES.length - 1 && (
                  <div className="w-4 h-[2px] bg-border ml-1 hidden xl:block" />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Progress & Stats */}
        {showStats && (
          <div className="flex items-center gap-4 pl-4 border-l border-border">
            {/* Progress Circle */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--color-bg-tertiary)"
                  strokeWidth="4"
                  fill="none"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#22c55e"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 126' }}
                  animate={{
                    strokeDasharray: `${(stats.percentage / 100) * 126} 126`
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-primary">{stats.percentage}%</span>
              </div>
            </div>

            {/* Stats Text */}
            <div className="text-right">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-bold text-text-primary">{stats.inProgress}</p>
                  <p className="text-[10px] text-text-muted uppercase">In Progress</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-lg font-bold text-green-500">{stats.published}</p>
                  <p className="text-[10px] text-text-muted uppercase">Published</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Indicator */}
      <AnimatePresence>
        {activeStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                Showing <span className="text-text-primary font-medium">{stageCounts[activeStage]}</span> items in{' '}
                <span className="font-medium" style={{ color: STAGES.find(s => s.id === activeStage)?.color }}>
                  {STAGES.find(s => s.id === activeStage)?.label}
                </span>
              </p>
              <button
                onClick={() => onStageClick?.(activeStage)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={12} />
                Clear filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
})

export default TaskFlow
