import { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'

export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  className = '',
  label,
  icon: Icon
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optValue) => {
    onChange(optValue === value ? '' : optValue)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-xs text-text-muted mb-1">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full px-3 py-2 bg-bg-secondary border rounded-lg text-sm text-left transition-colors ${
          isOpen ? 'border-blue-500/50 bg-bg-tertiary' : 'border-border hover:border-border-hover'
        } ${value ? 'text-text-primary' : 'text-text-muted'}`}
      >
        {Icon && <Icon className="w-4 h-4 text-text-muted flex-shrink-0" />}
        <span className="flex-1 truncate">
          {selectedOption?.label || placeholder}
        </span>
        {value ? (
          <X
            className="w-4 h-4 text-text-muted hover:text-text-primary flex-shrink-0"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-bg-primary border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-bg-secondary border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto">
            {/* All option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                !value ? 'bg-blue-500/20 text-blue-400' : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {!value && <Check className="w-3 h-3" />}
              </div>
              <span>All</span>
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                    opt.value === value
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {opt.value === value && <Check className="w-3 h-3" />}
                  </div>
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-xs text-text-muted">{opt.count}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-text-muted text-center">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
