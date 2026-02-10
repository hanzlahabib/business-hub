// @ts-nocheck
import { useState, useMemo, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Video, Smartphone } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isToday, isBefore } from 'date-fns'
import { Content } from '@/components/Calendar/ContentCard'

const RANGE_OPTIONS = [
    { value: 7, label: '1 Week' },
    { value: 14, label: '2 Weeks' },
    { value: 28, label: '4 Weeks' }
]

const STATUS_COLORS: Record<string, string> = {
    idea: 'bg-gray-500/80',
    script: 'bg-blue-500/80',
    recording: 'bg-yellow-500/80',
    editing: 'bg-orange-500/80',
    thumbnail: 'bg-pink-500/80',
    published: 'bg-green-500/80'
}

interface TimelineViewProps {
    contents: Content[]
    onEdit?: (content: Content) => void
    onSchedule?: (contentId: string, date: string) => void
    onOpenDetail?: (content: Content) => void
}

export const TimelineView = memo(function TimelineView({ contents, onEdit, onSchedule, onOpenDetail }: TimelineViewProps) {
    const [range, setRange] = useState(14)
    const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
    const scrollRef = useRef<HTMLDivElement>(null)

    const dates = useMemo(() => {
        const result = []
        for (let i = 0; i < range; i++) {
            result.push(addDays(startDate, i))
        }
        return result
    }, [startDate, range])

    const contentsByDate = useMemo(() => {
        const map = new Map<string, Content[]>()
        dates.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            map.set(dateStr, contents.filter(c => c.scheduledDate === dateStr))
        })
        return map
    }, [contents, dates])

    const handlePrev = useCallback(() => {
        setStartDate(prev => addWeeks(prev, -1))
    }, [])

    const handleNext = useCallback(() => {
        setStartDate(prev => addWeeks(prev, 1))
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
        e.preventDefault()
        const contentId = e.dataTransfer.getData('contentId')
        if (contentId && onSchedule) {
            onSchedule(contentId, format(date, 'yyyy-MM-dd'))
        }
    }, [onSchedule])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }, [])

    return (
        <div className="p-4 space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrev}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-text-primary min-w-[180px] text-center">
                        {format(startDate, 'MMM d')} - {format(addDays(startDate, range - 1), 'MMM d, yyyy')}
                    </span>
                    <button
                        onClick={handleNext}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${range === opt.value
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={scrollRef}
                className="overflow-x-auto pb-4"
            >
                <div className="inline-flex gap-2 min-w-full">
                    {dates.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const dayContents = contentsByDate.get(dateStr) || []
                        const isPast = isBefore(date, new Date()) && !isToday(date)

                        return (
                            <div
                                key={dateStr}
                                onDrop={(e) => handleDrop(e, date)}
                                onDragOver={handleDragOver}
                                className={`flex-shrink-0 w-[140px] rounded-xl border transition-colors ${isToday(date)
                                        ? 'border-accent-primary bg-accent-primary/5'
                                        : isPast
                                            ? 'border-border/50 bg-bg-tertiary/30'
                                            : 'border-border bg-bg-secondary'
                                    }`}
                            >
                                {/* Date Header */}
                                <div className={`p-2 border-b text-center ${isToday(date) ? 'border-accent-primary/30' : 'border-border/50'
                                    }`}>
                                    <p className={`text-xs ${isToday(date) ? 'text-accent-primary font-medium' : 'text-text-muted'}`}>
                                        {format(date, 'EEE')}
                                    </p>
                                    <p className={`text-lg font-semibold ${isToday(date) ? 'text-accent-primary' : 'text-text-primary'
                                        }`}>
                                        {format(date, 'd')}
                                    </p>
                                </div>

                                {/* Content slots */}
                                <div className="p-2 space-y-2 min-h-[200px]">
                                    {dayContents.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-xs text-text-muted/50">Drop here</p>
                                        </div>
                                    ) : (
                                        dayContents.map(content => (
                                            <TimelineCard
                                                key={content.id}
                                                content={content}
                                                onEdit={onEdit}
                                                onOpenDetail={onOpenDetail}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
                <span className="font-medium">Status:</span>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <span key={status} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="capitalize">{status}</span>
                    </span>
                ))}
            </div>
        </div>
    )
})

const TimelineCard = memo(function TimelineCard({ content, onEdit, onOpenDetail }: { content: Content, onEdit?: (content: Content) => void, onOpenDetail?: (content: Content) => void }) {
    const isLong = content.type === 'long'
    const Icon = isLong ? Video : Smartphone

    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.dataTransfer.setData('contentId', content.id)
        e.dataTransfer.effectAllowed = 'move'
    }, [content.id])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            draggable
            onDragStart={handleDragStart}
            onClick={() => onOpenDetail?.(content)}
            className={`p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] ${isLong
                    ? 'bg-accent-secondary/10 border-accent-secondary/30'
                    : 'bg-accent-primary/10 border-accent-primary/30'
                }`}
        >
            <div className="flex items-start gap-1.5">
                <Icon size={12} className={isLong ? 'text-accent-secondary' : 'text-accent-primary'} />
                <p className="text-xs font-medium text-text-primary line-clamp-2 flex-1">
                    {content.title || 'Untitled'}
                </p>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[content.status]}`} />
                <span className="text-[10px] text-text-muted capitalize">{content.status}</span>
            </div>
        </motion.div>
    )
})
