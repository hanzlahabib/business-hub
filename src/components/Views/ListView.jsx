import { useState, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Filter, Video, Smartphone, Calendar, MessageSquare, Youtube, FileText, FileCode, Link2, ExternalLink, ArrowUpDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Badge } from '../UI'

const STATUS_OPTIONS = ['all', 'idea', 'script', 'recording', 'editing', 'thumbnail', 'published']
const TYPE_OPTIONS = ['all', 'long', 'short']

const STATUS_COLORS = {
  idea: 'bg-gray-500/20 text-gray-300',
  script: 'bg-blue-500/20 text-blue-300',
  recording: 'bg-yellow-500/20 text-yellow-300',
  editing: 'bg-orange-500/20 text-orange-300',
  thumbnail: 'bg-pink-500/20 text-pink-300',
  published: 'bg-green-500/20 text-green-300'
}

const URL_ICONS = {
  youtube: { icon: Youtube, color: 'text-red-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  github: { icon: FileCode, color: 'text-purple-500' },
  other: { icon: Link2, color: 'text-gray-400' }
}

export const ListView = memo(function ListView({ contents, onEdit, onDelete, onOpenDetail }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortField, setSortField] = useState('scheduledDate')
  const [sortDirection, setSortDirection] = useState('asc')

  const filteredAndSortedContents = useMemo(() => {
    let result = [...contents]

    // Apply filters
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle null/undefined values
      if (!aVal && !bVal) return 0
      if (!aVal) return sortDirection === 'asc' ? 1 : -1
      if (!bVal) return sortDirection === 'asc' ? -1 : 1

      // String comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [contents, statusFilter, typeFilter, sortField, sortDirection])

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const SortHeader = useCallback(({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-text-primary transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      )}
      {sortField !== field && <ArrowUpDown size={12} className="opacity-30" />}
    </button>
  ), [sortField, sortDirection, handleSort])

  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <span className="text-sm text-text-muted">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          {TYPE_OPTIONS.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All Types' : t === 'long' ? 'Long Form' : 'Shorts'}</option>
          ))}
        </select>

        <span className="text-sm text-text-muted ml-auto">
          {filteredAndSortedContents.length} items
        </span>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_100px_120px_80px_60px] gap-4 px-4 py-3 bg-bg-tertiary/50 border-b border-border text-sm text-text-muted font-medium">
          <SortHeader field="title">Title</SortHeader>
          <SortHeader field="type">Type</SortHeader>
          <SortHeader field="status">Status</SortHeader>
          <SortHeader field="scheduledDate">Date</SortHeader>
          <span>Links</span>
          <span>Notes</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          <AnimatePresence>
            {filteredAndSortedContents.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">
                No content matches the current filters
              </div>
            ) : (
              filteredAndSortedContents.map(content => (
                <ListRow
                  key={content.id}
                  content={content}
                  onEdit={onEdit}
                  onOpenDetail={onOpenDetail}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})

const ListRow = memo(function ListRow({ content, onEdit, onOpenDetail }) {
  const isLong = content.type === 'long'
  const Icon = isLong ? Video : Smartphone

  const formattedDate = content.scheduledDate
    ? format(parseISO(content.scheduledDate), 'MMM d, yyyy')
    : '-'

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onOpenDetail?.(content)}
      className="grid grid-cols-[1fr_100px_100px_120px_80px_60px] gap-4 px-4 py-3 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
    >
      {/* Title & Topic */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-lg shrink-0 ${isLong ? 'bg-accent-secondary/20' : 'bg-accent-primary/20'}`}>
          <Icon size={14} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{content.title || 'Untitled'}</p>
          {content.topic && (
            <p className="text-xs text-text-muted truncate">{content.topic}</p>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="flex items-center">
        <Badge variant={isLong ? 'long' : 'short'} size="xs">
          {isLong ? 'Long' : 'Short'}
        </Badge>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[content.status]}`}>
          {content.status}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center text-sm text-text-muted">
        {formattedDate}
      </div>

      {/* Links */}
      <div className="flex items-center gap-1">
        {content.urls?.slice(0, 3).map(urlItem => {
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
              <UrlIcon size={14} />
            </a>
          )
        })}
        {content.urls?.length > 3 && (
          <span className="text-xs text-text-muted">+{content.urls.length - 3}</span>
        )}
      </div>

      {/* Comments */}
      <div className="flex items-center text-text-muted">
        {content.comments?.length > 0 && (
          <span className="text-xs flex items-center gap-1">
            <MessageSquare size={12} />
            {content.comments.length}
          </span>
        )}
      </div>
    </motion.div>
  )
})
