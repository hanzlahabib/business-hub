import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Star,
  Clock,
  FileText,
  Inbox
} from 'lucide-react'

const quickFilters = [
  { id: 'all', label: 'All Templates', icon: Inbox, count: null },
  { id: 'favorites', label: 'Favorites', icon: Star, count: null },
  { id: 'recent', label: 'Recently Used', icon: Clock, count: null }
]

export function FolderTree({
  folders = [],
  templates = [],
  selectedFolderId,
  activeFilter = 'all',
  onFolderSelect,
  onFilterSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [editingFolder, setEditingFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [menuFolderId, setMenuFolderId] = useState(null)

  // Count templates per folder
  const getTemplateCount = (folderId) => {
    return templates.filter(t => t.folderId === folderId).length
  }

  // Get filter counts
  const filterCounts = {
    all: templates.length,
    favorites: templates.filter(t => t.isFavorite).length,
    recent: templates.filter(t => t.lastUsedAt).length
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder?.({
        name: newFolderName.trim(),
        icon: 'folder',
        color: '#6366F1'
      })
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  const handleRenameFolder = (folderId, newName) => {
    if (newName.trim()) {
      onEditFolder?.(folderId, { name: newName.trim() })
    }
    setEditingFolder(null)
  }

  const rootFolders = folders.filter(f => !f.parentId).sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="w-56 flex-shrink-0 bg-bg-secondary/50 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-secondary">Templates</h3>
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-1 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
            title="New folder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-2 border-b border-border">
        {quickFilters.map(filter => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id && !selectedFolderId
          return (
            <button
              key={filter.id}
              onClick={() => {
                onFilterSelect?.(filter.id)
                onFolderSelect?.(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </div>
              <span className="text-xs text-text-muted">
                {filterCounts[filter.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-text-muted uppercase tracking-wider px-3 py-2">
          Folders
        </div>

        {/* New Folder Input */}
        <AnimatePresence>
          {showNewFolder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 py-1"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder()
                    if (e.key === 'Escape') {
                      setShowNewFolder(false)
                      setNewFolderName('')
                    }
                  }}
                  onBlur={() => {
                    if (!newFolderName.trim()) {
                      setShowNewFolder(false)
                    }
                  }}
                  placeholder="Folder name..."
                  className="flex-1 bg-bg-secondary border border-border rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white/40"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folder List */}
        {rootFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id)
          const isSelected = selectedFolderId === folder.id
          const childFolders = folders.filter(f => f.parentId === folder.id)
          const count = getTemplateCount(folder.id)
          const FolderIcon = isExpanded ? FolderOpen : Folder

          return (
            <div key={folder.id} className="group">
              <div
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                {childFolders.length > 0 ? (
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="p-0.5 hover:bg-bg-tertiary rounded"
                  >
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                ) : (
                  <span className="w-4" />
                )}

                <button
                  onClick={() => {
                    onFolderSelect?.(folder.id)
                    onFilterSelect?.(null)
                  }}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  {editingFolder === folder.id ? (
                    <input
                      type="text"
                      defaultValue={folder.name}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolder(folder.id, e.target.value)
                        if (e.key === 'Escape') setEditingFolder(null)
                      }}
                      onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                      className="flex-1 bg-bg-tertiary border border-border rounded px-1 text-sm focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <FolderIcon
                        className="w-4 h-4"
                        style={{ color: folder.color || '#6366F1' }}
                      />
                      <span className="flex-1 text-sm truncate">{folder.name}</span>
                      <span className="text-xs text-text-muted">{count}</span>
                    </>
                  )}
                </button>

                {/* Folder menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuFolderId(menuFolderId === folder.id ? null : folder.id)
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary rounded transition-all"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>

                  {menuFolderId === folder.id && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-32 py-1 bg-bg-secondary border border-border rounded-lg shadow-xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFolder(folder.id)
                          setMenuFolderId(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                      >
                        <Edit2 className="w-3 h-3" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteFolder?.(folder.id)
                          setMenuFolderId(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Child folders */}
              <AnimatePresence>
                {isExpanded && childFolders.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4"
                  >
                    {childFolders.map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onFolderSelect?.(child.id)
                          onFilterSelect?.(null)
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedFolderId === child.id
                            ? 'bg-bg-tertiary text-text-primary'
                            : 'text-text-muted hover:bg-bg-secondary'
                        }`}
                      >
                        <Folder className="w-4 h-4" style={{ color: child.color }} />
                        <span className="flex-1 truncate">{child.name}</span>
                        <span className="text-xs text-text-muted">
                          {getTemplateCount(child.id)}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {rootFolders.length === 0 && !showNewFolder && (
          <div className="px-3 py-4 text-center text-xs text-text-muted">
            No folders yet
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <FileText className="w-3 h-3" />
          <span>{templates.length} templates total</span>
        </div>
      </div>
    </div>
  )
}

export default FolderTree
