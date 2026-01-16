import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Upload, MoreHorizontal } from 'lucide-react'
import LeadCard from './LeadCard'
import { useLeads } from '../hooks/useLeads'

const statusConfig = {
  new: { label: 'New', color: 'from-gray-500 to-slate-600', emoji: '🆕' },
  contacted: { label: 'Contacted', color: 'from-blue-500 to-cyan-600', emoji: '📧' },
  replied: { label: 'Replied', color: 'from-purple-500 to-violet-600', emoji: '💬' },
  meeting: { label: 'Meeting', color: 'from-amber-500 to-orange-600', emoji: '📅' },
  won: { label: 'Won', color: 'from-green-500 to-emerald-600', emoji: '🎉' },
  lost: { label: 'Lost', color: 'from-red-500 to-rose-600', emoji: '❌' }
}

function StatusColumn({ status, leads, onLeadClick, onAddClick, onDrop }) {
  const config = statusConfig[status]
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) {
      onDrop(leadId, status)
    }
  }

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-white/5 rounded-xl border transition-colors ${
        isDragOver ? 'border-white/30 bg-white/10' : 'border-white/10'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 bg-gradient-to-r ${config.color} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <h3 className="font-semibold text-white">{config.label}</h3>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
              {leads.length}
            </span>
          </div>
          {status === 'new' && (
            <button
              onClick={onAddClick}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        <AnimatePresence>
          {leads.map(lead => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('leadId', lead.id)
              }}
            >
              <LeadCard
                lead={lead}
                onClick={onLeadClick}
              />
            </div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && (
          <div className="text-center py-8 text-white/30">
            <p className="text-sm">No leads</p>
            {status === 'new' && (
              <button
                onClick={onAddClick}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Add your first lead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function LeadBoard({
  onLeadClick,
  onAddClick,
  onImportClick,
  searchQuery = ''
}) {
  const { leads, changeStatus, getStats } = useLeads()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const filteredLeads = useMemo(() => {
    if (!localSearch) return leads
    const q = localSearch.toLowerCase()
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.contactPerson?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q)
    )
  }, [leads, localSearch])

  const leadsByStatus = useMemo(() => {
    const grouped = {}
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = filteredLeads.filter(l => l.status === status)
    })
    return grouped
  }, [filteredLeads])

  const handleDrop = async (leadId, newStatus) => {
    await changeStatus(leadId, newStatus)
  }

  const stats = getStats()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Lead Board</h2>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span>{stats.total} leads</span>
            <span>•</span>
            <span className="text-green-400">{stats.byStatus.won || 0} won</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search leads..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 w-64"
            />
          </div>

          {/* Import */}
          <button
            onClick={onImportClick}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          {/* Add Lead */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {Object.keys(statusConfig).map(status => (
            <StatusColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onLeadClick={onLeadClick}
              onAddClick={onAddClick}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeadBoard
