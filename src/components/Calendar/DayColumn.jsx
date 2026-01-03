import { useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Video, Smartphone } from 'lucide-react'
import { ContentCard } from './ContentCard'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DayColumn = memo(function DayColumn({
  date,
  contents,
  isToday,
  viewMode = 'default',
  onAddContent,
  onEditContent,
  onDeleteContent,
  onDateChange,
  onOpenDetail
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const { dayOfWeek, dayNum } = useMemo(() => {
    const d = new Date(date)
    return { dayOfWeek: d.getDay(), dayNum: d.getDate() }
  }, [date])

  const { longContent, shortContent } = useMemo(() => ({
    longContent: contents.filter(c => c.type === 'long'),
    shortContent: contents.filter(c => c.type === 'short')
  }), [contents])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const contentId = e.dataTransfer.getData('contentId')
    if (contentId && onDateChange) {
      onDateChange(contentId, date)
    }
    setIsDragOver(false)
  }, [date, onDateChange])

  const handleAddClick = useCallback(() => {
    onAddContent(date)
  }, [date, onAddContent])

  const minHeight = viewMode === 'compact' ? 'min-h-[200px]' : viewMode === 'detailed' ? 'min-h-[500px]' : 'min-h-[400px]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col rounded-xl p-3 ${minHeight} transition-all duration-200
        ${isDragOver
          ? 'bg-accent-primary/20 border-2 border-dashed border-accent-primary scale-[1.02]'
          : isToday
            ? 'bg-accent-primary/10 border-2 border-accent-primary/50'
            : 'bg-bg-secondary border-2 border-border'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-xs font-medium ${isToday ? 'text-accent-primary' : 'text-text-muted'}`}>
            {dayNames[dayOfWeek]}
          </p>
          <p className={`text-xl font-bold ${isToday ? 'text-accent-primary' : 'text-text-primary'}`}>
            {dayNum}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {viewMode === 'compact' && contents.length > 0 && (
            <div className="flex items-center gap-1 mr-1">
              {longContent.length > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-accent-secondary">
                  <Video size={10} /> {longContent.length}
                </span>
              )}
              {shortContent.length > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-accent-primary">
                  <Smartphone size={10} /> {shortContent.length}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleAddClick}
            className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-accent-primary/20 text-text-muted hover:text-accent-primary transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {longContent.map(content => (
          <ContentCard
            key={content.id}
            content={content}
            viewMode={viewMode}
            onEdit={onEditContent}
            onDelete={onDeleteContent}
            onClick={() => onOpenDetail?.(content)}
          />
        ))}

        {longContent.length > 0 && shortContent.length > 0 && viewMode !== 'compact' && (
          <div className="border-t border-border/50 my-2" />
        )}

        {shortContent.map(content => (
          <ContentCard
            key={content.id}
            content={content}
            viewMode={viewMode}
            onEdit={onEditContent}
            onDelete={onDeleteContent}
            onClick={() => onOpenDetail?.(content)}
          />
        ))}

        {contents.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-full py-8 ${isDragOver ? 'text-accent-primary' : 'text-text-muted'}`}>
            <p className="text-sm">{isDragOver ? 'Drop here!' : 'No content'}</p>
            {!isDragOver && (
              <button
                onClick={handleAddClick}
                className="text-xs text-accent-primary hover:underline mt-1"
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
})
