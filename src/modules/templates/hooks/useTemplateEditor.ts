import { useState, useCallback, useRef, useEffect } from 'react'

const BLOCK_TYPES = {
  paragraph: { label: 'Text', shortcut: 'p', icon: 'type' },
  heading: { label: 'Heading', shortcut: 'h', icon: 'heading' },
  list: { label: 'List', shortcut: 'l', icon: 'list' },
  callout: { label: 'Callout', shortcut: 'c', icon: 'alert-circle' },
  divider: { label: 'Divider', shortcut: 'd', icon: 'minus' },
  quote: { label: 'Quote', shortcut: 'q', icon: 'quote' },
  code: { label: 'Code', shortcut: '`', icon: 'code' }
}

export function useTemplateEditor(initialContent: any = null, onSave: any = null) {
  const [blocks, setBlocks] = useState<any[]>(() => {
    if (initialContent?.blocks?.length) {
      return initialContent.blocks
    }
    return [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }]
  })

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  const saveTimeoutRef = useRef<any>(null)

  // Save current state to undo stack
  const pushToUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), JSON.stringify(blocks)])
    setRedoStack([])
  }, [blocks])

  // Generate unique block ID
  const generateBlockId = useCallback(() => crypto.randomUUID(), [])

  // Add a new block
  const addBlock = useCallback((type = 'paragraph', afterId = null, initialData = {}) => {
    pushToUndo()

    const newBlock = {
      id: generateBlockId(),
      type,
      ...getDefaultBlockData(type),
      ...initialData
    }

    setBlocks(prev => {
      if (!afterId) {
        return [...prev, newBlock]
      }
      const index = prev.findIndex(b => b.id === afterId)
      if (index === -1) return [...prev, newBlock]
      return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)]
    })

    setIsDirty(true)
    setActiveBlockId(newBlock.id)
    return newBlock.id
  }, [pushToUndo, generateBlockId])

  // Remove a block
  const removeBlock = useCallback((blockId) => {
    pushToUndo()
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== blockId)
      // Ensure at least one block exists
      if (filtered.length === 0) {
        return [{ id: generateBlockId(), type: 'paragraph', text: '' }]
      }
      return filtered
    })
    setIsDirty(true)
  }, [pushToUndo, generateBlockId])

  // Update a block
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    ))
    setIsDirty(true)
  }, [])

  // Move block up or down
  const moveBlock = useCallback((blockId, direction) => {
    pushToUndo()
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId)
      if (index === -1) return prev

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev

      const newBlocks = [...prev]
      const [removed] = newBlocks.splice(index, 1)
      newBlocks.splice(newIndex, 0, removed)
      return newBlocks
    })
    setIsDirty(true)
  }, [pushToUndo])

  // Reorder blocks (for drag-drop)
  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    pushToUndo()
    setBlocks(prev => {
      const newBlocks = [...prev]
      const [removed] = newBlocks.splice(fromIndex, 1)
      newBlocks.splice(toIndex, 0, removed)
      return newBlocks
    })
    setIsDirty(true)
  }, [pushToUndo])

  // Change block type
  const changeBlockType = useCallback((blockId, newType) => {
    pushToUndo()
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      return {
        id: b.id,
        type: newType,
        ...getDefaultBlockData(newType),
        // Preserve text if applicable
        ...(b.text && { text: b.text })
      }
    }))
    setIsDirty(true)
  }, [pushToUndo])

  // Duplicate a block
  const duplicateBlock = useCallback((blockId) => {
    pushToUndo()
    const block = blocks.find(b => b.id === blockId)
    if (!block) return null

    const newBlock = { ...block, id: generateBlockId() }
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId)
      return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)]
    })
    setIsDirty(true)
    return newBlock.id
  }, [blocks, pushToUndo, generateBlockId])

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return
    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, JSON.stringify(blocks)])
    setUndoStack(prev => prev.slice(0, -1))
    setBlocks(JSON.parse(previousState))
    setIsDirty(true)
  }, [undoStack, blocks])

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return
    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, JSON.stringify(blocks)])
    setRedoStack(prev => prev.slice(0, -1))
    setBlocks(JSON.parse(nextState))
    setIsDirty(true)
  }, [redoStack, blocks])

  // Convert blocks to markdown
  const toMarkdown = useCallback(() => {
    return blocks.map(block => blockToMarkdown(block)).join('\n\n')
  }, [blocks])

  // Convert blocks to content object
  const toContent = useCallback(() => {
    return {
      type: 'doc',
      blocks: blocks
    }
  }, [blocks])

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty || !onSave) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave({
        content: toContent(),
        rawMarkdown: toMarkdown()
      })
      setIsDirty(false)
    }, 1500) // 1.5s debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [blocks, isDirty, onSave, toContent, toMarkdown])

  // Reset editor with new content
  const resetContent = useCallback((content) => {
    if (content?.blocks?.length) {
      setBlocks(content.blocks)
    } else {
      setBlocks([{ id: generateBlockId(), type: 'paragraph', text: '' }])
    }
    setIsDirty(false)
    setUndoStack([])
    setRedoStack([])
  }, [generateBlockId])

  return {
    blocks,
    activeBlockId,
    isDirty,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    blockTypes: BLOCK_TYPES,
    setActiveBlockId,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    reorderBlocks,
    changeBlockType,
    duplicateBlock,
    undo,
    redo,
    toMarkdown,
    toContent,
    resetContent
  }
}

// Helper: Get default data for block type
function getDefaultBlockData(type) {
  switch (type) {
    case 'paragraph':
      return { text: '' }
    case 'heading':
      return { text: '', level: 2 }
    case 'list':
      return { items: [''], style: 'bullet' }
    case 'callout':
      return { text: '', emoji: 'bulb' }
    case 'divider':
      return {}
    case 'quote':
      return { text: '' }
    case 'code':
      return { text: '', language: 'javascript' }
    default:
      return { text: '' }
  }
}

// Helper: Convert single block to markdown
function blockToMarkdown(block) {
  switch (block.type) {
    case 'paragraph':
      return block.text || ''
    case 'heading':
      const hashes = '#'.repeat(block.level || 2)
      return `${hashes} ${block.text || ''}`
    case 'list':
      if (!block.items?.length) return ''
      return block.items.map((item, i) =>
        block.style === 'numbered' ? `${i + 1}. ${item}` : `- ${item}`
      ).join('\n')
    case 'callout':
      return `> ${block.emoji || '💡'} ${block.text || ''}`
    case 'divider':
      return '---'
    case 'quote':
      return `> ${block.text || ''}`
    case 'code':
      return `\`\`\`${block.language || ''}\n${block.text || ''}\n\`\`\``
    default:
      return block.text || ''
  }
}

export default useTemplateEditor
