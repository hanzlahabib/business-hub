
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Pin,
  Copy,
  MoreHorizontal,
  FileText,
  Mail,
  Linkedin,
  ClipboardList,
  File,
  Calendar,
  Hash,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const categoryConfig = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  email: { label: 'Email', icon: Mail, color: 'text-red-400' },
  proposal: { label: 'Proposal', icon: ClipboardList, color: 'text-green-400' },
  document: { label: 'Document', icon: FileText, color: 'text-amber-400' },
  custom: { label: 'Custom', icon: File, color: 'text-purple-400' }
}

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-300',
  published: 'bg-green-500/20 text-green-300',
  archived: 'bg-red-500/20 text-red-300'
}

export function TemplateList({
  templates = [],
  onTemplateClick,
  onCopy,
  onToggleFavorite,
  searchQuery = ''
}: any) {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [sortField, setSortField] = useState('updatedAt')
  const [sortDirection, setSortDirection] = useState('desc')

  const filteredAndSorted = useMemo(() => {
    let result = [...templates]

    // Filter
    if (localSearch) {
      const q = localSearch.toLowerCase()
      result = result.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle dates
      if (sortField.includes('At')) {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal?.toLowerCase() || ''
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [templates, localSearch, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: any) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search templates..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-bg-secondary border-b border-border text-xs text-text-muted uppercase tracking-wider">
        <button
          onClick={() => handleSort('name')}
          className="col-span-4 flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          Name <SortIcon field="name" />
        </button>
        <button
          onClick={() => handleSort('category')}
          className="col-span-2 flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          Category <SortIcon field="category" />
        </button>
        <button
          onClick={() => handleSort('status')}
          className="col-span-1 flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          Status <SortIcon field="status" />
        </button>
        <button
          onClick={() => handleSort('usageCount')}
          className="col-span-1 flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          Uses <SortIcon field="usageCount" />
        </button>
        <button
          onClick={() => handleSort('updatedAt')}
          className="col-span-2 flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          Updated <SortIcon field="updatedAt" />
        </button>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredAndSorted.map((template, index) => {
            const config = categoryConfig[template.category] || categoryConfig.custom
            const CategoryIcon = config.icon

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onTemplateClick?.(template)}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-bg-secondary cursor-pointer group"
              >
                {/* Name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1">
                    {template.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {template.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-text-primary truncate">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-text-muted truncate">{template.description}</div>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 flex items-center gap-2">
                  <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-sm text-text-secondary">{config.label}</span>
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[template.status]}`}>
                    {template.status}
                  </span>
                </div>

                {/* Usage */}
                <div className="col-span-1 flex items-center text-sm text-text-muted">
                  {template.usageCount || 0}
                </div>

                {/* Updated */}
                <div className="col-span-2 flex items-center gap-1 text-sm text-text-muted">
                  <Calendar className="w-3 h-3" />
                  {template.updatedAt
                    ? formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })
                    : 'Never'
                  }
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite?.(template.id)
                    }}
                    className={`p-1.5 rounded hover:bg-bg-tertiary transition-colors ${
                      template.isFavorite ? 'text-yellow-400' : 'text-text-muted'
                    }`}
                    title={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopy?.(template)
                    }}
                    className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredAndSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p>No templates found</p>
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-text-muted">
        {filteredAndSorted.length} of {templates.length} templates
      </div>
    </div>
  )
}

export default TemplateList
