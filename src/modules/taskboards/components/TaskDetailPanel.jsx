import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Flag, Plus, Trash2, CheckSquare, Square, Save, Edit } from 'lucide-react'
import { format } from 'date-fns'

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500/20 text-gray-300' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500/20 text-red-300' }
]

export function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  columns = []
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [newSubtask, setNewSubtask] = useState('')

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        columnId: task.columnId || ''
      })
    }
  }, [task])

  const handleSave = () => {
    onUpdate?.(task.id, formData)
    setIsEditing(false)
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask?.(task.id, newSubtask.trim())
      setNewSubtask('')
    }
  }

  if (!isOpen || !task) return null

  const completedSubtasks = task.subtasks?.filter(st => st.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0

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
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md h-full bg-[#1a1a2e] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Task Details</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-lg transition-colors ${
                  isEditing ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white/60'
                }`}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(task.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Title */}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                />
              ) : (
                <h2 className="text-lg font-semibold text-white">{task.title}</h2>
              )}
            </div>

            {/* Column */}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Column</label>
              {isEditing ? (
                <select
                  value={formData.columnId}
                  onChange={(e) => setFormData(prev => ({ ...prev, columnId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: columns.find(c => c.id === task.columnId)?.color }}
                  />
                  <span className="text-white">{columns.find(c => c.id === task.columnId)?.name}</span>
                </div>
              )}
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Priority
                </label>
                {isEditing ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                  >
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded text-sm ${
                    priorities.find(p => p.value === task.priority)?.color
                  }`}>
                    {priorities.find(p => p.value === task.priority)?.label}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Due Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                  />
                ) : (
                  <span className="text-white">
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Not set'}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Description</label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 resize-none"
                  placeholder="Add description..."
                />
              ) : (
                <p className="text-white/70 text-sm whitespace-pre-wrap">
                  {task.description || 'No description'}
                </p>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/40 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  Subtasks ({completedSubtasks}/{totalSubtasks})
                </label>
              </div>

              {/* Progress */}
              {totalSubtasks > 0 && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-2 mb-3">
                {task.subtasks?.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 bg-white/5 rounded-lg group"
                  >
                    <button
                      onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                      className="shrink-0"
                    >
                      {subtask.done ? (
                        <CheckSquare className="w-4 h-4 text-green-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/40" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${subtask.done ? 'text-white/40 line-through' : 'text-white'}`}>
                      {subtask.text}
                    </span>
                    <button
                      onClick={() => onDeleteSubtask?.(task.id, subtask.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Created date */}
            <div className="text-xs text-white/30">
              Created {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {/* Save button when editing */}
          {isEditing && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TaskDetailPanel
