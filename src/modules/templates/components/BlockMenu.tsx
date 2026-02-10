import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlertCircle,
  Minus,
  Quote,
  Code
} from 'lucide-react'

const menuItems = [
  { type: 'paragraph', label: 'Text', description: 'Plain text block', icon: Type, shortcut: '/p' },
  { type: 'heading', label: 'Heading 1', description: 'Large heading', icon: Heading1, shortcut: '/h1', data: { level: 1 } },
  { type: 'heading', label: 'Heading 2', description: 'Medium heading', icon: Heading2, shortcut: '/h2', data: { level: 2 } },
  { type: 'heading', label: 'Heading 3', description: 'Small heading', icon: Heading3, shortcut: '/h3', data: { level: 3 } },
  { type: 'list', label: 'Bullet List', description: 'Unordered list', icon: List, shortcut: '/bullet', data: { style: 'bullet' } },
  { type: 'list', label: 'Numbered List', description: 'Ordered list', icon: ListOrdered, shortcut: '/numbered', data: { style: 'numbered' } },
  { type: 'callout', label: 'Callout', description: 'Highlighted text box', icon: AlertCircle, shortcut: '/callout' },
  { type: 'quote', label: 'Quote', description: 'Block quote', icon: Quote, shortcut: '/quote' },
  { type: 'divider', label: 'Divider', description: 'Horizontal line', icon: Minus, shortcut: '/divider' },
  { type: 'code', label: 'Code', description: 'Code snippet', icon: Code, shortcut: '/code' }
]

export function BlockMenu({ isOpen, onClose, onSelect, position = { x: 0, y: 0 } }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<any>(null)
  const inputRef = useRef<any>(null)

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (item) => {
    onSelect(item.type, item.data || {})
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed z-50 w-72 bg-bg-primary border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{ left: position.x, top: position.y }}
      >
        {/* Search input */}
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search blocks..."
            className="w-full px-3 py-2 bg-bg-secondary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border-hover"
          />
        </div>

        {/* Menu items */}
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredItems.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-text-muted">
              No blocks found
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={`${item.type}-${item.label}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  <div className="p-1.5 bg-bg-tertiary rounded-lg">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-text-muted truncate">{item.description}</div>
                  </div>
                  <span className="text-xs text-text-muted font-mono">{item.shortcut}</span>
                </button>
              )
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BlockMenu
