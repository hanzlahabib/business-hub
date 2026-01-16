import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LayoutGrid, Users, Plus, Trash2 } from 'lucide-react'

const presetColors = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'
]

export function CreateBoardModal({ isOpen, onClose, onCreate, leads = [] }) {
  const [name, setName] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [columns, setColumns] = useState([
    { id: 'todo', name: 'To Do', color: '#6B7280' },
    { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
    { id: 'review', name: 'Review', color: '#F59E0B' },
    { id: 'done', name: 'Done', color: '#10B981' }
  ])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onCreate({
      name: name.trim(),
      leadId: selectedLead?.id || null,
      columns
    })

    // Reset form
    setName('')
    setSelectedLead(null)
    setColumns([
      { id: 'todo', name: 'To Do', color: '#6B7280' },
      { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
      { id: 'review', name: 'Review', color: '#F59E0B' },
      { id: 'done', name: 'Done', color: '#10B981' }
    ])
    onClose()
  }

  if (!isOpen) return null

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
          className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Create Board</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Board Name */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">Board Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                placeholder="e.g., Website Redesign Project"
              />
            </div>

            {/* Link to Lead (optional) */}
            {leads.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <Users className="w-4 h-4" />
                  Link to Lead (optional)
                </label>
                <select
                  value={selectedLead?.id || ''}
                  onChange={(e) => {
                    const lead = leads.find(l => l.id === e.target.value)
                    setSelectedLead(lead || null)
                    if (lead && !name) {
                      setName(`${lead.name} Project`)
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                >
                  <option value="">No lead (standalone board)</option>
                  {leads.filter(l => !l.linkedBoardId).map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/60">Columns</label>
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
                    className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                  >
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
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-white/30"
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
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-xs text-white/40 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setColumns([
                    { id: 'todo', name: 'To Do', color: '#6B7280' },
                    { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
                    { id: 'done', name: 'Done', color: '#10B981' }
                  ])}
                  className="px-2 py-1 bg-white/5 text-white/50 rounded text-xs hover:bg-white/10"
                >
                  Simple (3)
                </button>
                <button
                  type="button"
                  onClick={() => setColumns([
                    { id: 'backlog', name: 'Backlog', color: '#6B7280' },
                    { id: 'todo', name: 'To Do', color: '#3B82F6' },
                    { id: 'inprogress', name: 'In Progress', color: '#8B5CF6' },
                    { id: 'review', name: 'Review', color: '#F59E0B' },
                    { id: 'done', name: 'Done', color: '#10B981' }
                  ])}
                  className="px-2 py-1 bg-white/5 text-white/50 rounded text-xs hover:bg-white/10"
                >
                  Agile (5)
                </button>
                <button
                  type="button"
                  onClick={() => setColumns([
                    { id: 'design', name: 'Design', color: '#EC4899' },
                    { id: 'development', name: 'Development', color: '#3B82F6' },
                    { id: 'testing', name: 'Testing', color: '#F59E0B' },
                    { id: 'deployment', name: 'Deployment', color: '#10B981' }
                  ])}
                  className="px-2 py-1 bg-white/5 text-white/50 rounded text-xs hover:bg-white/10"
                >
                  Web Project (4)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Board
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CreateBoardModal
