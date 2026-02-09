import { useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Video, Smartphone } from 'lucide-react'
import { ContentCard } from './ContentCard'
import { CalendarItemCard } from './CalendarItemCard'
import { CalendarItem } from '../../hooks/useCalendarItems'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayColumnProps {
    date: string
    contents: any[]
    items?: CalendarItem[]
    isToday?: boolean
    viewMode?: string
    onAddContent?: (date: string) => void
    onEditContent?: (content: any) => void
    onDeleteContent?: (id: string) => void
    onDateChange?: (id: string, date: string) => void
    onItemDateChange?: (item: CalendarItem, date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: CalendarItem) => void
}

export const DayColumn = memo(function DayColumn({
    date,
    contents,
    items = [],
    isToday,
    viewMode = 'default',
    onAddContent,
    onEditContent,
    onDeleteContent,
    onDateChange,
    onItemDateChange,
    onOpenDetail,
    onItemClick
}: DayColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false)

    const { dayOfWeek, dayNum } = useMemo(() => {
        const d = new Date(date)
        return { dayOfWeek: d.getDay(), dayNum: d.getDate() }
    }, [date])

    const { longContent, shortContent } = useMemo(() => ({
        longContent: contents.filter(c => c.type === 'long'),
        shortContent: contents.filter(c => c.type === 'short')
    }), [contents])

    // Group items by type (excluding content since that's handled separately)
    const groupedItems = useMemo(() => {
        const groups: Record<string, CalendarItem[]> = {
            task: [],
            interview: [],
            lead: [],
            milestone: []
        }
        items.forEach(item => {
            if (item.type !== 'content' && groups[item.type]) {
                groups[item.type].push(item)
            }
        })
        return groups
    }, [items])

    // Check if we have any non-content items
    const hasOtherItems = useMemo(() => {
        return Object.values(groupedItems).some(arr => arr.length > 0)
    }, [groupedItems])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()

        // Check if it's a content item (legacy)
        const contentId = e.dataTransfer.getData('contentId')
        if (contentId && onDateChange) {
            onDateChange(contentId, date)
            setIsDragOver(false)
            return
        }

        // Check if it's a calendar item
        const calendarItemId = e.dataTransfer.getData('calendarItemId')
        if (calendarItemId && onItemDateChange) {
            const item = items.find(i => i.id === calendarItemId)
            if (item && item.draggable) {
                onItemDateChange(item, date)
            }
        }

        setIsDragOver(false)
    }, [date, onDateChange, onItemDateChange, items])

    const handleAddClick = useCallback(() => {
        onAddContent?.(date)
    }, [date, onAddContent])

    const minHeight = viewMode === 'compact' ? 'min-h-[180px]' : viewMode === 'detailed' ? 'min-h-[600px]' : 'min-h-[450px]'

    const totalItemsCount = contents.length + items.filter(i => i.type !== 'content').length

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
                    {viewMode === 'compact' && totalItemsCount > 0 && (
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
                            {hasOtherItems && (
                                <span className="text-xs text-text-muted ml-1">
                                    +{items.filter(i => i.type !== 'content').length}
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
                {/* Content items (videos) */}
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

                {/* Divider between content and other items */}
                {contents.length > 0 && hasOtherItems && viewMode !== 'compact' && (
                    <div className="border-t border-border/50 my-2" />
                )}

                {/* Task items */}
                {groupedItems.task.map(item => (
                    <CalendarItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onClick={onItemClick}
                    />
                ))}

                {/* Interview items */}
                {groupedItems.interview.map(item => (
                    <CalendarItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onClick={onItemClick}
                    />
                ))}

                {/* Lead items */}
                {groupedItems.lead.map(item => (
                    <CalendarItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onClick={onItemClick}
                    />
                ))}

                {/* Milestone items */}
                {groupedItems.milestone.map(item => (
                    <CalendarItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onClick={onItemClick}
                    />
                ))}

                {/* Empty state */}
                {totalItemsCount === 0 && (
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
