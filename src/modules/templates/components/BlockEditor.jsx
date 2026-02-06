import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Undo2, Redo2, Save, Loader2 } from 'lucide-react'
import { useTemplateEditor } from '../hooks/useTemplateEditor'
import { Block } from './Block'
import { BlockMenu } from './BlockMenu'

export function BlockEditor({
  initialContent = null,
  onSave = null,
  autoSave = true,
  showToolbar = true
}) {
  const {
    blocks,
    activeBlockId,
    isDirty,
    canUndo,
    canRedo,
    setActiveBlockId,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    reorderBlocks,
    duplicateBlock,
    undo,
    redo,
    toContent,
    toMarkdown,
    resetContent
  } = useTemplateEditor(
    initialContent,
    autoSave ? onSave : null
  )

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [menuAfterBlockId, setMenuAfterBlockId] = useState(null)
  const [draggingBlockId, setDraggingBlockId] = useState(null)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef(null)

  // Reset content when initialContent changes
  useEffect(() => {
    if (initialContent) {
      resetContent(initialContent)
    }
  }, [initialContent?.blocks?.length])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const handleBlockKeyDown = useCallback((blockId, action) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId)

    if (action === 'enter') {
      // Create new paragraph block after current
      addBlock('paragraph', blockId)
    } else if (action === 'backspace-empty') {
      // Remove empty block and focus previous
      if (blocks.length > 1) {
        const prevBlock = blocks[blockIndex - 1]
        removeBlock(blockId)
        if (prevBlock) {
          setActiveBlockId(prevBlock.id)
        }
      }
    } else if (action === 'slash') {
      // Open block menu
      const blockElement = editorRef.current?.querySelector(`[data-block-id="${blockId}"]`)
      if (blockElement) {
        const rect = blockElement.getBoundingClientRect()
        setMenuPosition({ x: rect.left, y: rect.bottom + 4 })
        setMenuAfterBlockId(blockId)
        setMenuOpen(true)
      }
    }
  }, [blocks, addBlock, removeBlock, setActiveBlockId])

  const handleMenuSelect = useCallback((type, data = {}) => {
    if (menuAfterBlockId) {
      // Replace current empty block or add after
      const currentBlock = blocks.find(b => b.id === menuAfterBlockId)
      if (currentBlock && currentBlock.type === 'paragraph' && !currentBlock.text) {
        // Replace empty paragraph with new block type
        updateBlock(menuAfterBlockId, { type, ...data })
      } else {
        addBlock(type, menuAfterBlockId, data)
      }
    } else {
      addBlock(type, null, data)
    }
    setMenuOpen(false)
    setMenuAfterBlockId(null)
  }, [menuAfterBlockId, blocks, addBlock, updateBlock])

  const handleAddBlockButton = useCallback((afterId) => {
    const blockElement = editorRef.current?.querySelector(`[data-block-id="${afterId}"]`)
    if (blockElement) {
      const rect = blockElement.getBoundingClientRect()
      setMenuPosition({ x: rect.left + 32, y: rect.bottom + 4 })
      setMenuAfterBlockId(afterId)
      setMenuOpen(true)
    }
  }, [])

  const handleDragStart = useCallback((blockId) => {
    setDraggingBlockId(blockId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingBlockId(null)
  }, [])

  const handleDragOver = useCallback((targetBlockId) => {
    if (!draggingBlockId || draggingBlockId === targetBlockId) return

    const fromIndex = blocks.findIndex(b => b.id === draggingBlockId)
    const toIndex = blocks.findIndex(b => b.id === targetBlockId)

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderBlocks(fromIndex, toIndex)
    }
  }, [draggingBlockId, blocks, reorderBlocks])

  const handleManualSave = useCallback(async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({
        content: toContent(),
        rawMarkdown: toMarkdown()
      })
    } finally {
      setSaving(false)
    }
  }, [onSave, toContent, toMarkdown])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-text-muted">Unsaved changes</span>
            )}
            {autoSave && isDirty && (
              <span className="text-xs text-text-muted">Auto-saving...</span>
            )}
            {!autoSave && onSave && (
              <button
                onClick={handleManualSave}
                disabled={!isDirty || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor area */}
      <div
        ref={editorRef}
        className="flex-1 overflow-y-auto p-4"
        onClick={() => {
          // Focus last block if clicking empty area
          if (blocks.length > 0) {
            setActiveBlockId(blocks[blocks.length - 1].id)
          }
        }}
      >
        <div className="max-w-2xl mx-auto space-y-1">
          <AnimatePresence>
            {blocks.map((block, index) => (
              <div key={block.id} data-block-id={block.id}>
                <Block
                  block={block}
                  isActive={activeBlockId === block.id}
                  onUpdate={updateBlock}
                  onKeyDown={handleBlockKeyDown}
                  onFocus={setActiveBlockId}
                  onAddBlock={handleAddBlockButton}
                  onRemove={removeBlock}
                  onDuplicate={duplicateBlock}
                  onMoveUp={(id) => moveBlock(id, 'up')}
                  onMoveDown={(id) => moveBlock(id, 'down')}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  isDragging={draggingBlockId === block.id}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Empty state / Add first block */}
          {blocks.length === 0 && (
            <div
              className="py-8 text-center text-text-muted cursor-pointer hover:text-text-secondary"
              onClick={() => addBlock('paragraph')}
            >
              Click to start writing or type / for commands
            </div>
          )}
        </div>
      </div>

      {/* Block menu */}
      <BlockMenu
        isOpen={menuOpen}
        onClose={() => {
          setMenuOpen(false)
          setMenuAfterBlockId(null)
        }}
        onSelect={handleMenuSelect}
        position={menuPosition}
      />
    </div>
  )
}

export default BlockEditor
