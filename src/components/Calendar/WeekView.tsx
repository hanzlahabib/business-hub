import { useState, useMemo, useCallback, memo } from 'react'
import { ChevronLeft, ChevronRight, List, Grid3X3, LayoutList } from 'lucide-react'
import { DayColumn } from './DayColumn'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { CalendarFilters as CalendarFiltersType, CalendarItem } from '../../hooks/useCalendarItems'

const VIEW_MODES = {
    compact: { icon: List, label: 'Compact' },
    default: { icon: Grid3X3, label: 'Default' },
    detailed: { icon: LayoutList, label: 'Detailed' }
}

interface WeekViewProps {
    contents: any[]
    items?: CalendarItem[]
    calendarFilters?: CalendarFiltersType
    onAddContent?: (date: string) => void
    onEditContent?: (content: any) => void
    onDeleteContent?: (id: string) => void
    onDateChange?: (id: string, date: string) => void
    onItemDateChange?: (item: CalendarItem, date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: CalendarItem) => void
}

export const WeekView = memo(function WeekView({
    contents,
    items = [],
    calendarFilters = { contents: true, tasks: false, jobs: false, leads: false, milestones: false },
    onAddContent,
    onEditContent,
    onDeleteContent,
    onDateChange,
    onItemDateChange,
    onOpenDetail,
    onItemClick
}: WeekViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState('default')

    const weekStart = useMemo(() => {
        return startOfWeek(currentDate, { weekStartsOn: 1 })
    }, [currentDate])

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }, [weekStart])

    const today = useMemo(() => new Date(), [])

    const getContentsForDate = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return contents.filter(c => c.scheduledDate === dateStr)
    }, [contents])

    const getItemsForDate = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return items.filter(item => item.date === dateStr)
    }, [items])

    const goToPrevWeek = useCallback(() => {
        setCurrentDate(prev => addDays(prev, -7))
    }, [])

    const goToNextWeek = useCallback(() => {
        setCurrentDate(prev => addDays(prev, 7))
    }, [])

    const goToToday = useCallback(() => {
        setCurrentDate(new Date())
    }, [])

    const handleViewModeChange = useCallback((mode: string) => {
        setViewMode(mode)
    }, [])

    // Check if any non-content filters are active
    const hasActiveFilters = useMemo(() => {
        return calendarFilters.tasks || calendarFilters.jobs || calendarFilters.leads || calendarFilters.milestones
    }, [calendarFilters])

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevWeek}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-border transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={goToNextWeek}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-border transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-border text-sm transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Date range title */}
                <h2 className="text-lg font-semibold text-text-primary">
                    {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </h2>

                {/* View mode toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-bg-secondary rounded-lg border border-border p-1">
                        {Object.entries(VIEW_MODES).map(([mode, { icon: Icon, label }]) => (
                            <button
                                key={mode}
                                onClick={() => handleViewModeChange(mode)}
                                title={label}
                                className={`p-2 rounded-md transition-colors ${viewMode === mode
                                        ? 'bg-accent-primary text-white'
                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                                    }`}
                            >
                                <Icon size={16} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-3 flex-1">
                {weekDays.map(day => (
                    <DayColumn
                        key={day.toISOString()}
                        date={format(day, 'yyyy-MM-dd')}
                        contents={getContentsForDate(day)}
                        items={hasActiveFilters ? getItemsForDate(day) : []}
                        isToday={isSameDay(day, today)}
                        viewMode={viewMode}
                        onAddContent={onAddContent}
                        onEditContent={onEditContent}
                        onDeleteContent={onDeleteContent}
                        onDateChange={onDateChange}
                        onItemDateChange={onItemDateChange}
                        onOpenDetail={onOpenDetail}
                        onItemClick={onItemClick}
                    />
                ))}
            </div>
        </div>
    )
})
