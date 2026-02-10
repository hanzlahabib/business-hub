import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react'

const presetColors = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'
]

export function BoardSettingsModal({
  isOpen,
  onClose,
  board,
  onUpdate,
  onDelete
}) {
  const [name, setName] = useState('')
  const [columns, setColumns] = useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (board) {
      setName(board.name || '')
      setColumns(board.columns || [])
    }
  }, [board])

  const handleAddColumn = () => {
    setColumns(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: 'New Column',
        color: presetColors[prev.length % presetColors.length]
      }
    ])
  }

  const handleRemoveColumn = (id) => {
    if (columns.length > 1) {
      setColumns(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleColumnChange = (id, field, value) => {
    setColumns(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const handleMoveColumn = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= columns.length) return

    const newColumns = [...columns]
    const [removed] = newColumns.splice(index, 1)
    newColumns.splice(newIndex, 0, removed)
    setColumns(newColumns)
  }

  const handleSave = () => {
    if (!name.trim()) return

    onUpdate?.(board.id, {
      name: name.trim(),
      columns
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete?.(board.id)
    onClose()
  }

  if (!isOpen || !board) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-bg-primary border border-border rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bg-tertiary rounded-lg">
                <Settings className="w-5 h-5 text-text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Board Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Board Name */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">Board Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                placeholder="Board name"
              />
            </div>

            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-text-muted">Columns</label>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-3 h-3" />
                  Add Column
                </button>
              </div>

              <div className="space-y-2">
                {columns.map((col, index) => (
                  <div
                    key={col.id}
                    className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg group"
                  >
                    {/* Drag handle */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveColumn(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-text-muted hover:text-text-secondary disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 15l-6-6-6 6"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveColumn(index, 'down')}
                        disabled={index === columns.length - 1}
                        className="p-0.5 text-text-muted hover:text-text-secondary disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>
                    </div>

                    {/* Color picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={col.color}
                        onChange={(e) => handleColumnChange(col.id, 'color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleColumnChange(col.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-border-hover"
                    />

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(col.id)}
                      disabled={columns.length <= 1}
                      className="p-1.5 hover:bg-red-500/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-muted mt-2">
                Note: Removing a column will move its tasks to the first column.
              </p>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Board
                </button>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-medium">Delete this board?</p>
                      <p className="text-red-300/70 text-sm">
                        This will permanently delete the board and all its tasks. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-text-secondary hover:text-text-primary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Yes, Delete Board
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BoardSettingsModal
