import { memo, useMemo, useCallback } from 'react'
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, isSameMonth, isSameDay, isToday
} from 'date-fns'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const COLOR_DOTS = ['bg-purple-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500', 'bg-pink-500']

interface MonthGridProps {
    currentDate: Date
    contents: any[]
    items?: any[]
    hasActiveFilters: boolean
    onAddContent?: (date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: any) => void
}

export const MonthGrid = memo(function MonthGrid({
    currentDate,
    contents,
    items = [],
    hasActiveFilters,
    onAddContent,
    onOpenDetail,
    onItemClick
}: MonthGridProps) {
    const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
    const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
    const calStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart])
    const calEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd])

    // Build all day cells for the month grid
    const weeks = useMemo(() => {
        const result: Date[][] = []
        let day = calStart
        while (day <= calEnd) {
            const week: Date[] = []
            for (let i = 0; i < 7; i++) {
                week.push(day)
                day = addDays(day, 1)
            }
            result.push(week)
        }
        return result
    }, [calStart, calEnd])

    const getEventsForDate = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayContents = contents.filter(c => c.scheduledDate === dateStr)
        const dayItems = hasActiveFilters ? items.filter(item => item.date === dateStr) : []
        return [...dayContents.map(c => ({ id: c.id, title: c.title || 'Untitled', type: 'content' as const, source: c })),
        ...dayItems.map(item => ({ id: item.id, title: item.title || 'Untitled', type: 'item' as const, source: item }))]
    }, [contents, items, hasActiveFilters])

    const today = useMemo(() => new Date(), [])

    return (
        <div className="flex-1 overflow-auto relative">
            {/* Day name headers */}
            <div className="grid grid-cols-7 border-b border-border sticky top-0 z-20 bg-bg-primary">
                {DAY_NAMES.map((name, idx) => (
                    <div key={name} className={`py-3 text-center text-xs font-medium uppercase tracking-wide ${idx >= 5 ? 'text-text-muted/50 bg-bg-secondary/20' : 'text-text-muted'}`}>
                        {name}
                    </div>
                ))}
            </div>

            {/* Week rows */}
            <div className="grid auto-rows-fr" style={{ minHeight: 'calc(100% - 40px)' }}>
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 border-b border-border/40">
                        {week.map((day, dIdx) => {
                            const inMonth = isSameMonth(day, monthStart)
                            const isDayToday = isSameDay(day, today)
                            const isWeekend = dIdx >= 5
                            const events = getEventsForDate(day)
                            const dateStr = format(day, 'yyyy-MM-dd')

                            return (
                                <div
                                    key={dIdx}
                                    onClick={() => onAddContent?.(dateStr)}
                                    className={`min-h-[100px] p-2 border-r border-border/30 cursor-pointer transition-colors hover:bg-accent-primary/5 group
                                        ${!inMonth ? 'opacity-30' : ''}
                                        ${isWeekend ? 'bg-bg-secondary/20' : ''}
                                        ${isDayToday ? 'bg-accent-primary/5' : ''}`}
                                >
                                    {/* Day number */}
                                    <div className="flex items-center justify-between mb-1">
                                        {isDayToday ? (
                                            <div className="w-7 h-7 rounded-full bg-accent-primary text-white flex items-center justify-center text-xs font-bold shadow-md shadow-accent-primary/30">
                                                {format(day, 'd')}
                                            </div>
                                        ) : (
                                            <span className={`text-sm font-medium ${inMonth ? 'text-text-secondary' : 'text-text-muted'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        )}
                                        {events.length > 0 && (
                                            <span className="text-[9px] text-text-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                +
                                            </span>
                                        )}
                                    </div>

                                    {/* Event pills */}
                                    <div className="space-y-0.5">
                                        {events.slice(0, 3).map((ev, eIdx) => (
                                            <div
                                                key={ev.id}
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    if (ev.type === 'content') onOpenDetail?.(ev.source)
                                                    else onItemClick?.(ev.source)
                                                }}
                                                className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all hover:scale-[1.02]
                                                    ${COLOR_DOTS[eIdx % COLOR_DOTS.length]}/20 border-l-2 ${COLOR_DOTS[eIdx % COLOR_DOTS.length]}`}
                                            >
                                                <span className="text-text-primary/80 font-medium">{ev.title}</span>
                                            </div>
                                        ))}
                                        {events.length > 3 && (
                                            <div className="text-[9px] text-text-muted pl-1 font-medium">
                                                +{events.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
})

export default MonthGrid
