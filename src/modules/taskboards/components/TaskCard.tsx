import { motion } from 'framer-motion'
import { Calendar, CheckSquare, Flag, MoreHorizontal, GripVertical, Paperclip, FileText } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'

const priorityConfig = {
  low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Low' },
  medium: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Medium' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' }
}

export function TaskCard({ task, onClick, onMenuClick, isDragging }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium
  const completedSubtasks = task.subtasks?.filter(st => st.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(task)}
      className={`
        group relative cursor-pointer
        bg-bg-secondary border border-border rounded-lg p-3
        transition-all duration-200
        ${isDragging ? 'shadow-xl ring-2 ring-blue-500/50' : 'hover:border-border-hover hover:shadow-lg'}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
        <GripVertical className="w-4 h-4 text-text-muted" />
      </div>

      {/* Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onMenuClick?.(task, e)
        }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary transition-all"
      >
        <MoreHorizontal className="w-4 h-4 text-text-muted" />
      </button>

      {/* Content */}
      <div className="pl-4">
        {/* Priority & Attachments */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${priority.bg} ${priority.color}`}>
            <Flag className="w-2.5 h-2.5" />
            {priority.label}
          </span>
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">
              <Paperclip className="w-2.5 h-2.5" />
              {task.attachments.length}
            </span>
          )}
          {task.linkedFile && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400" title={task.linkedFile}>
              <FileText className="w-2.5 h-2.5" />
              Doc
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-text-primary mb-2 line-clamp-2 pr-6">
          {task.title}
        </h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-text-muted line-clamp-2 mb-2 whitespace-pre-wrap">
            {task.description.replace(/\\n/g, '\n')}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <CheckSquare className="w-3 h-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-400' :
              isDueToday ? 'text-amber-400' :
              'text-text-muted'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>
                {isDueToday ? 'Today' : format(new Date(task.dueDate), 'MMM d')}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar for subtasks */}
        {totalSubtasks > 0 && (
          <div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default TaskCard
