import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Filter, FileText, Folder, ChevronDown,
  ArrowRight, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

const API_SERVER = 'http://localhost:3002'

// Highlight matching text
function HighlightText({ text, query }) {
  if (!query || !text) return <span>{text}</span>

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

// Search Result Item
function SearchResultItem({ result, query, onSelect }) {
  const { task, matchType, matchField, fileMatch } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      onClick={() => onSelect(task)}
      className="p-3 hover:bg-bg-tertiary rounded-lg cursor-pointer transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Match type indicator */}
        <div className={`p-1.5 rounded-lg shrink-0 ${matchType === 'file' ? 'bg-purple-500/20' :
            matchType === 'title' ? 'bg-blue-500/20' :
              'bg-green-500/20'
          }`}>
          {matchType === 'file' ? (
            <FileText className="w-4 h-4 text-purple-400" />
          ) : matchType === 'title' ? (
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          ) : (
            <Folder className="w-4 h-4 text-green-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Task title */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-text-primary truncate">
              <HighlightText text={task.title} query={query} />
            </h4>
            <span className={`px-1.5 py-0.5 rounded text-xs ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
              }`}>
              {task.priority}
            </span>
          </div>

          {/* Match context */}
          {matchType === 'description' && task.description && (
            <p className="text-xs text-text-muted line-clamp-2">
              <HighlightText
                text={task.description.substring(0, 150)}
                query={query}
              />
            </p>
          )}

          {matchType === 'file' && fileMatch && (
            <div className="mt-1 p-2 bg-bg-secondary rounded border border-border">
              <p className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {fileMatch.fileName}
              </p>
              <p className="text-xs text-text-muted line-clamp-2">
                <HighlightText text={fileMatch.matches?.[0]?.text || ''} query={query} />
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span>Column: {result.columnName || 'Unknown'}</span>
            {task.dueDate && (
              <span>Due: {format(new Date(task.dueDate), 'MMM d')}</span>
            )}
            {task.progress > 0 && (
              <span>{task.progress}% done</span>
            )}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
      </div>
    </motion.div>
  )
}

export function GlobalSearch({
  tasks,
  columns,
  isOpen,
  onClose,
  onSelectTask
}) {
  const [query, setQuery] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('all')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchLower = searchQuery.toLowerCase()
    const searchResults = []

    // Filter by column if selected
    const tasksToSearch = selectedColumn === 'all'
      ? tasks
      : tasks.filter(t => t.columnId === selectedColumn)

    // Search task titles and descriptions
    for (const task of tasksToSearch) {
      const column = columns.find(c => c.id === task.columnId)
      const columnName = column?.name || 'Unknown'

      // Search in title
      if (task.title?.toLowerCase().includes(searchLower)) {
        searchResults.push({
          task,
          matchType: 'title',
          matchField: 'title',
          columnName
        })
        continue // Only one result per task
      }

      // Search in description
      if (task.description?.toLowerCase().includes(searchLower)) {
        searchResults.push({
          task,
          matchType: 'description',
          matchField: 'description',
          columnName
        })
        continue
      }

      // Search in subtasks
      const subtaskMatch = task.subtasks?.find(st =>
        st.text?.toLowerCase().includes(searchLower)
      )
      if (subtaskMatch) {
        searchResults.push({
          task,
          matchType: 'subtask',
          matchField: 'subtasks',
          columnName
        })
        continue
      }
    }

    // Search in attached MD files
    const attachmentPaths = tasksToSearch
      .filter(t => t.attachments?.length > 0)
      .flatMap(t => t.attachments.map(a => {
        // Handle both object format {path: "..."} and string format
        const filePath = typeof a === 'string' ? a : a.path
        return {
          taskId: t.id,
          path: filePath,
          task: t
        }
      }))
      .filter(a => {
        if (!a.path || typeof a.path !== 'string') return false
        return a.path.endsWith('.md') && !a.path.startsWith('clipboard://')
      })

    if (attachmentPaths.length > 0) {
      try {
        const response = await fetch(`${API_SERVER}/api/file/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paths: attachmentPaths.map(a => a.path),
            query: searchQuery
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('File search results:', data) // Debug log

          for (const fileResult of data.results || []) {
            const attachment = attachmentPaths.find(a => a.path === fileResult.path)
            if (attachment) {
              // Check if task already in results with a different match type
              const existingIndex = searchResults.findIndex(r => r.task.id === attachment.taskId)

              if (existingIndex === -1) {
                // Task not in results yet, add file match
                const column = columns.find(c => c.id === attachment.task.columnId)
                searchResults.push({
                  task: attachment.task,
                  matchType: 'file',
                  matchField: 'attachments',
                  fileMatch: fileResult,
                  columnName: column?.name || 'Unknown'
                })
              } else {
                // Task already in results, but add file match info if it was a different match type
                const existing = searchResults[existingIndex]
                if (existing.matchType !== 'file' && !existing.fileMatch) {
                  // Add file match as additional info
                  existing.additionalFileMatch = fileResult
                }
              }
            }
          }
        } else {
          console.error('File search failed:', response.status, await response.text())
        }
      } catch (error) {
        console.error('File search error:', error)
      }
    }

    console.log('Total search results:', searchResults.length) // Debug log

    setResults(searchResults)
    setIsSearching(false)
  }, [tasks, columns, selectedColumn])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  const handleSelect = (task) => {
    onSelectTask(task)
    onClose()
    setQuery('')
    setResults([])
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-4 bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, descriptions, and attached files..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />

          {/* Column Filter */}
          <div className="relative">
            <button
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedColumn !== 'all'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
                }`}
            >
              <Filter className="w-4 h-4" />
              {selectedColumn === 'all' ? 'All Columns' : columns.find(c => c.id === selectedColumn)?.name}
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showColumnFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-bg-primary border border-border rounded-lg shadow-xl overflow-hidden z-10"
                >
                  <button
                    onClick={() => {
                      setSelectedColumn('all')
                      setShowColumnFilter(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary transition-colors ${selectedColumn === 'all' ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary'
                      }`}
                  >
                    All Columns
                  </button>
                  {columns.map(col => (
                    <button
                      key={col.id}
                      onClick={() => {
                        setSelectedColumn(col.id)
                        setShowColumnFilter(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary transition-colors flex items-center gap-2 ${selectedColumn === col.id ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary'
                        }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      {col.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isSearching && (
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          )}

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Type at least 2 characters to search</p>
              <p className="text-xs mt-2 text-text-muted/70">
                Searches task titles, descriptions, subtasks, and attached MD files
              </p>
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="p-8 text-center text-text-muted">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-2 text-text-muted/70">
                Try different keywords or check spelling
              </p>
            </div>
          ) : (
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-text-muted">
                {results.length} result{results.length !== 1 ? 's' : ''} found
                {selectedColumn !== 'all' && ` in ${columns.find(c => c.id === selectedColumn)?.name}`}
              </p>
              <AnimatePresence>
                {results.map((result, index) => (
                  <SearchResultItem
                    key={`${result.task.id}-${result.matchType}-${index}`}
                    result={result}
                    query={query}
                    onSelect={handleSelect}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">Enter</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">Esc</kbd> to close
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">Ctrl+K</kbd> to open search
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GlobalSearch
