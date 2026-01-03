import { useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Video, Smartphone, MessageSquare, Youtube, FileText, FileCode, Link2, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const STATUS_OPTIONS = ['idea', 'script', 'recording', 'editing', 'thumbnail', 'published']

const STATUS_COLORS = {
  idea: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  script: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  recording: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  editing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  thumbnail: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  published: 'bg-green-500/20 text-green-300 border-green-500/30'
}

const URL_ICONS = {
  youtube: { icon: Youtube, color: 'text-red-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  github: { icon: FileCode, color: 'text-purple-500' },
  other: { icon: Link2, color: 'text-gray-400' }
}

export const TableView = memo(function TableView({ contents, onEdit, onUpdateStatus, onOpenDetail }) {
  const [selectedIds, setSelectedIds] = useState(new Set())

  const sortedContents = useMemo(() => {
    return [...contents].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0
      if (!a.scheduledDate) return 1
      if (!b.scheduledDate) return -1
      return a.scheduledDate.localeCompare(b.scheduledDate)
    })
  }, [contents])

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedContents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedContents.map(c => c.id)))
    }
  }, [selectedIds.size, sortedContents])

  return (
    <div className="p-4">
      {/* Selection info */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg flex items-center justify-between">
          <span className="text-sm text-text-primary">
            {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-text-muted hover:text-text-primary"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-bg-tertiary/50 border-b border-border">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sortedContents.length && sortedContents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border bg-bg-tertiary"
                />
              </th>
              <th className="text-left p-3 text-sm font-medium text-text-muted">Title</th>
              <th className="w-24 text-left p-3 text-sm font-medium text-text-muted">Type</th>
              <th className="w-32 text-left p-3 text-sm font-medium text-text-muted">Status</th>
              <th className="w-28 text-left p-3 text-sm font-medium text-text-muted">Date</th>
              <th className="w-24 text-left p-3 text-sm font-medium text-text-muted">Topic</th>
              <th className="w-20 text-center p-3 text-sm font-medium text-text-muted">Links</th>
              <th className="w-16 text-center p-3 text-sm font-medium text-text-muted">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedContents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-muted">
                  No content yet
                </td>
              </tr>
            ) : (
              sortedContents.map(content => (
                <TableRow
                  key={content.id}
                  content={content}
                  isSelected={selectedIds.has(content.id)}
                  onToggleSelect={() => toggleSelect(content.id)}
                  onUpdateStatus={onUpdateStatus}
                  onOpenDetail={onOpenDetail}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})

const TableRow = memo(function TableRow({ content, isSelected, onToggleSelect, onUpdateStatus, onOpenDetail }) {
  const [editingStatus, setEditingStatus] = useState(false)
  const isLong = content.type === 'long'
  const Icon = isLong ? Video : Smartphone

  const formattedDate = content.scheduledDate
    ? format(parseISO(content.scheduledDate), 'MMM d')
    : '-'

  const handleStatusChange = useCallback((newStatus) => {
    onUpdateStatus?.(content.id, newStatus)
    setEditingStatus(false)
  }, [content.id, onUpdateStatus])

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`hover:bg-bg-tertiary/30 transition-colors ${isSelected ? 'bg-accent-primary/5' : ''}`}
    >
      {/* Checkbox */}
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-border bg-bg-tertiary"
        />
      </td>

      {/* Title */}
      <td
        className="p-3 cursor-pointer"
        onClick={() => onOpenDetail?.(content)}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded shrink-0 ${isLong ? 'bg-accent-secondary/20' : 'bg-accent-primary/20'}`}>
            <Icon size={12} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
          </div>
          <span className="text-sm font-medium text-text-primary truncate max-w-[300px]">
            {content.title || 'Untitled'}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="p-3">
        <span className={`text-xs font-medium ${isLong ? 'text-accent-secondary' : 'text-accent-primary'}`}>
          {isLong ? 'Long' : 'Short'}
        </span>
      </td>

      {/* Status - Inline editable */}
      <td className="p-3">
        {editingStatus ? (
          <div className="flex items-center gap-1">
            <select
              autoFocus
              value={content.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              onBlur={() => setEditingStatus(false)}
              className="px-2 py-1 rounded text-xs bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent-primary"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={() => setEditingStatus(true)}
            className={`px-2 py-1 rounded text-xs font-medium capitalize border transition-colors hover:opacity-80 ${STATUS_COLORS[content.status]}`}
          >
            {content.status}
          </button>
        )}
      </td>

      {/* Date */}
      <td className="p-3 text-sm text-text-muted">
        {formattedDate}
      </td>

      {/* Topic */}
      <td className="p-3">
        <span className="text-xs text-text-muted truncate block max-w-[100px]">
          {content.topic || '-'}
        </span>
      </td>

      {/* Links */}
      <td className="p-3">
        <div className="flex items-center justify-center gap-1">
          {content.urls?.slice(0, 2).map(urlItem => {
            const { icon: UrlIcon, color } = URL_ICONS[urlItem.type] || URL_ICONS.other
            return (
              <a
                key={urlItem.id}
                href={urlItem.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`p-1 rounded hover:bg-bg-tertiary ${color}`}
                title={urlItem.label || urlItem.url}
              >
                <UrlIcon size={12} />
              </a>
            )
          })}
          {content.urls?.length > 2 && (
            <span className="text-[10px] text-text-muted">+{content.urls.length - 2}</span>
          )}
          {(!content.urls || content.urls.length === 0) && (
            <span className="text-text-muted/30">-</span>
          )}
        </div>
      </td>

      {/* Comments */}
      <td className="p-3 text-center">
        {content.comments?.length > 0 ? (
          <span className="text-xs text-text-muted flex items-center justify-center gap-1">
            <MessageSquare size={12} />
            {content.comments.length}
          </span>
        ) : (
          <span className="text-text-muted/30">-</span>
        )}
      </td>
    </motion.tr>
  )
})
