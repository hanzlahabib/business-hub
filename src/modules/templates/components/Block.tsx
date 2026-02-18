
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MessageCircle
} from 'lucide-react'
import {
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  CalloutBlock,
  DividerBlock,
  QuoteBlock,
  CodeBlock
} from './blocks'
import { CommentBubble } from './CommentBubble'

const blockComponents = {
  paragraph: ParagraphBlock,
  heading: HeadingBlock,
  list: ListBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  quote: QuoteBlock,
  code: CodeBlock
}

export function Block({
  block,
  isActive,
  onUpdate,
  onKeyDown,
  onFocus,
  onAddBlock,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging,
  // Comment props
  commentCount = 0,
  hasUnresolvedComments = false,
  onOpenComments,
  onAddComment,
  showComments = true
}: any) {
  const [showMenu, setShowMenu] = useState(false)
  const blockRef = useRef<any>(null)

  const BlockComponent = blockComponents[block.type] || ParagraphBlock

  const handleChange = (updates) => {
    onUpdate(block.id, updates)
  }

  const handleKeyDown = (action) => {
    onKeyDown?.(block.id, action)
  }

  return (
    <motion.div
      ref={blockRef}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative pl-8 pr-8 py-1 rounded-lg transition-colors ${
        isActive ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onFocus?.(block.id)}
      draggable
      onDragStart={(e: any) => {
        e.dataTransfer.setData('blockId', block.id)
        onDragStart?.(block.id)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(block.id)
      }}
    >
      {/* Left controls - drag handle and add button */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddBlock?.(block.id)
          }}
          className="p-1 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
          title="Add block below"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div
          className="p-1 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Block content */}
      <div className="min-h-[1.5em]">
        <BlockComponent
          block={block}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          isActive={isActive}
        />
      </div>

      {/* Comment bubble - right side */}
      {showComments && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          {commentCount > 0 ? (
            <CommentBubble
              count={commentCount}
              hasUnresolved={hasUnresolvedComments}
              onClick={(e: any) => {
                e?.stopPropagation()
                onOpenComments?.(block.id)
              }}
              onAddComment={() => onOpenComments?.(block.id)}
              position="right"
              size="small"
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddComment?.(block.id)
              }}
              className="p-1 text-text-muted hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Add comment"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Right menu */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 bg-bg-primary border border-border rounded-lg shadow-xl">
              {showComments && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddComment?.(block.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Add comment
                  </button>
                  <hr className="my-1 border-border" />
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate?.(block.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp?.(block.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Move up
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown?.(block.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Move down
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.(block.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Block
