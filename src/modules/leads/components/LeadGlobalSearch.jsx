import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Phone, Mail, MapPin, Building2, Tag, ArrowRight, AlertCircle } from 'lucide-react'

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
function SearchResultItem({ lead, query, matchField, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      onClick={() => onSelect(lead)}
      className="p-3 hover:bg-bg-tertiary rounded-lg cursor-pointer transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Industry icon */}
        <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Lead name */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">
              <HighlightText text={lead.name} query={query} />
            </h4>
            {lead.priority && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                lead.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                lead.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {lead.priority}
              </span>
            )}
            {lead.industry && (
              <span className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted">
                {lead.industry}
              </span>
            )}
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <HighlightText text={lead.phone} query={query} />
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <HighlightText text={lead.email} query={query} />
              </span>
            )}
            {lead.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <HighlightText text={lead.location.substring(0, 40)} query={query} />
              </span>
            )}
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 4).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-muted">
                  <HighlightText text={tag} query={query} />
                </span>
              ))}
              {lead.tags.length > 4 && (
                <span className="px-1.5 py-0.5 text-xs text-text-muted">+{lead.tags.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
      </div>
    </motion.div>
  )
}

export function LeadGlobalSearch({
  leads,
  isOpen,
  onClose,
  onSelectLead
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
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
  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    const searchLower = searchQuery.toLowerCase()
    const searchResults = []

    for (const lead of leads) {
      let matchField = null

      // Search in name
      if (lead.name?.toLowerCase().includes(searchLower)) {
        matchField = 'name'
      }
      // Search in phone
      else if (lead.phone?.toLowerCase().includes(searchLower)) {
        matchField = 'phone'
      }
      // Search in email
      else if (lead.email?.toLowerCase().includes(searchLower)) {
        matchField = 'email'
      }
      // Search in location
      else if (lead.location?.toLowerCase().includes(searchLower)) {
        matchField = 'location'
      }
      // Search in industry
      else if (lead.industry?.toLowerCase().includes(searchLower)) {
        matchField = 'industry'
      }
      // Search in notes
      else if (lead.notes?.toLowerCase().includes(searchLower)) {
        matchField = 'notes'
      }
      // Search in pitchAngle
      else if (lead.pitchAngle?.toLowerCase().includes(searchLower)) {
        matchField = 'pitchAngle'
      }
      // Search in tags
      else if (lead.tags?.some(t => t.toLowerCase().includes(searchLower))) {
        matchField = 'tags'
      }
      // Search in contact person
      else if (lead.contactPerson?.toLowerCase().includes(searchLower)) {
        matchField = 'contactPerson'
      }

      if (matchField) {
        searchResults.push({ lead, matchField })
      }
    }

    setResults(searchResults)
  }, [leads])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 150)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  const handleSelect = (lead) => {
    onSelectLead(lead)
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
            placeholder="Search leads by name, phone, email, location, tags..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
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
                Searches name, phone, email, location, industry, notes, tags
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No leads found for "{query}"</p>
              <p className="text-xs mt-2 text-text-muted/70">
                Try different keywords or check spelling
              </p>
            </div>
          ) : (
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-text-muted">
                {results.length} lead{results.length !== 1 ? 's' : ''} found
              </p>
              <AnimatePresence>
                {results.map((result, index) => (
                  <SearchResultItem
                    key={`${result.lead.id}-${index}`}
                    lead={result.lead}
                    query={query}
                    matchField={result.matchField}
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
            <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">Ctrl+K</kbd> to search
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LeadGlobalSearch
