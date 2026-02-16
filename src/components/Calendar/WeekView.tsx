import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { CalendarSidebar } from './CalendarSidebar'
import { MonthGrid } from './MonthGrid'
import { DayGrid } from './DayGrid'
import { format, startOfWeek, startOfMonth, addDays, addMonths, isSameDay } from 'date-fns'
import { CalendarFilters as CalendarFiltersType, CalendarItem } from '../../hooks/useCalendarItems'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00–20:00
const SLOT_H = 80 // Fixed slot height matching Stitch design

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

// Color palette for event cards
const COLOR_MAP: Record<string, { border: string; bg: string; title: string; sub: string }> = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-500/20', title: 'text-purple-200', sub: 'text-purple-300' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', title: 'text-emerald-100', sub: 'text-emerald-300' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/20', title: 'text-cyan-100', sub: 'text-cyan-300' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-500/20', title: 'text-amber-100', sub: 'text-amber-300' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-500/20', title: 'text-indigo-100', sub: 'text-indigo-300' },
    pink: { border: 'border-pink-500', bg: 'bg-pink-500/20', title: 'text-pink-100', sub: 'text-pink-300' },
}
const PALETTE = ['purple', 'emerald', 'cyan', 'amber', 'indigo', 'pink']

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
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week')
    const slotH = SLOT_H
    const gridRef = useRef<HTMLDivElement>(null)
    const hasScrolled = useRef(false)

    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
    const today = useMemo(() => new Date(), [])

    const getContentsForDate = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return contents.filter(c => c.scheduledDate === dateStr)
    }, [contents])

    const getItemsForDate = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return items.filter(item => item.date === dateStr)
    }, [items])

    const goToPrev = useCallback(() => {
        setCurrentDate(prev => {
            if (viewMode === 'month') return addMonths(prev, -1)
            if (viewMode === 'day') return addDays(prev, -1)
            return addDays(prev, -7)
        })
    }, [viewMode])
    const goToNext = useCallback(() => {
        setCurrentDate(prev => {
            if (viewMode === 'month') return addMonths(prev, 1)
            if (viewMode === 'day') return addDays(prev, 1)
            return addDays(prev, 7)
        })
    }, [viewMode])
    const goToToday = useCallback(() => setCurrentDate(new Date()), [])

    const hasActiveFilters = useMemo(() => {
        return calendarFilters.tasks || calendarFilters.jobs || calendarFilters.leads || calendarFilters.milestones
    }, [calendarFilters])

    // Current time indicator
    const currentTimeTop = useMemo(() => {
        const now = new Date()
        const h = now.getHours(), m = now.getMinutes()
        if (h < 8 || h > 20) return null
        return ((h - 8) * slotH) + ((m / 60) * slotH)
    }, [slotH])
    const currentTimeLabel = useMemo(() => format(new Date(), 'HH:mm'), [])

    // Auto-scroll to morning area on mount (show 8-9am at top)
    useEffect(() => {
        if (gridRef.current && !hasScrolled.current) {
            gridRef.current.scrollTop = 0
            hasScrolled.current = true
        }
    }, [])

    const handleAddEvent = useCallback(() => {
        onAddContent?.(format(new Date(), 'yyyy-MM-dd'))
    }, [onAddContent])

    return (
        <div className="flex h-full overflow-hidden">
            {/* ── Left: Calendar Grid ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Toolbar */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
                    <div className="flex items-center gap-6">
                        {/* View Switcher */}
                        <div className="flex items-center bg-bg-secondary rounded-lg p-1 border border-border">
                            {(['month', 'week', 'day'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${viewMode === mode
                                        ? 'bg-accent-primary text-white shadow-sm'
                                        : 'text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={goToToday}
                                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-bg-secondary transition-colors font-medium text-text-secondary"
                            >
                                Today
                            </button>
                            <button onClick={goToPrev} className="p-1 rounded hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={goToNext} className="p-1 rounded hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
                                <ChevronRight size={16} />
                            </button>
                            <h2 className="text-lg font-bold text-text-primary ml-2">
                                {viewMode === 'month' ? format(startOfMonth(currentDate), 'MMMM yyyy')
                                    : viewMode === 'day' ? format(currentDate, 'EEEE, MMMM d, yyyy')
                                        : format(weekStart, 'MMMM yyyy')}
                            </h2>
                        </div>


                    </div>

                    <button
                        onClick={handleAddEvent}
                        className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-accent-primary/20"
                    >
                        <Plus size={16} />
                        Add Event
                    </button>
                </div>

                {/* Calendar Grid — switches based on viewMode */}
                {viewMode === 'month' ? (
                    <MonthGrid
                        currentDate={currentDate}
                        contents={contents}
                        items={items}
                        hasActiveFilters={hasActiveFilters}
                        onAddContent={onAddContent}
                        onOpenDetail={onOpenDetail}
                        onItemClick={onItemClick}
                    />
                ) : viewMode === 'day' ? (
                    <DayGrid
                        currentDate={currentDate}
                        contents={contents}
                        items={items}
                        hasActiveFilters={hasActiveFilters}
                        onAddContent={onAddContent}
                        onOpenDetail={onOpenDetail}
                        onItemClick={onItemClick}
                    />
                ) : (
                    /* Week Grid */
                    <div ref={gridRef} className="flex-1 overflow-auto relative">
                        {/* Sticky Day Headers */}
                        <div className="grid sticky top-0 z-30 bg-bg-primary border-b border-border" style={{ gridTemplateColumns: '60px 1fr' }}>
                            <div className="p-2 border-r border-border bg-bg-secondary/50" />
                            <div className="grid grid-cols-7 divide-x divide-border">
                                {weekDays.map((day, idx) => {
                                    const isDayToday = isSameDay(day, today)
                                    const isWeekend = idx >= 5
                                    return (
                                        <div key={idx} className={`p-3 text-center ${isDayToday ? 'bg-accent-primary/5' : ''} ${isWeekend ? 'bg-black/10' : ''}`}>
                                            <span className={`block text-xs font-medium uppercase tracking-wide ${isDayToday ? 'text-accent-primary' : 'text-text-muted'}`}>
                                                {DAY_NAMES[idx]}
                                            </span>
                                            {isDayToday ? (
                                                <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center mx-auto mt-1 text-sm font-bold shadow-md shadow-accent-primary/30">
                                                    {format(day, 'd')}
                                                </div>
                                            ) : (
                                                <span className={`block text-lg font-bold mt-1 ${isWeekend ? 'text-text-muted' : 'text-text-secondary'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Time Grid */}
                        <div className="grid relative" style={{ gridTemplateColumns: '60px 1fr', minHeight: `${HOURS.length * slotH}px` }}>
                            {/* Time Axis */}
                            <div className="border-r border-border bg-bg-secondary/30 text-xs text-text-muted font-medium text-right select-none">
                                {HOURS.map(hour => (
                                    <div key={hour} style={{ height: `${slotH}px` }} className="-mt-2.5 pr-2">
                                        {String(hour).padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Events Grid */}
                            <div className="relative grid grid-cols-7 divide-x divide-border">
                                {/* Hour lines */}
                                {HOURS.map((hour, idx) => (
                                    <div key={hour} className="absolute w-full border-t border-border/40 pointer-events-none" style={{ top: `${idx * slotH}px` }} />
                                ))}

                                {/* Current time red line */}
                                {currentTimeTop !== null && (
                                    <div className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                                        <div className="absolute -left-[65px] -top-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{currentTimeLabel}</div>
                                        <div className="absolute -left-1.5 -top-1 w-2 h-2 rounded-full bg-red-500" />
                                    </div>
                                )}

                                {/* Day columns with events */}
                                {weekDays.map((day, idx) => {
                                    const isCurrentDay = isSameDay(day, today)
                                    const isWeekend = idx >= 5
                                    const dayContents = getContentsForDate(day)
                                    const dayItems = hasActiveFilters ? getItemsForDate(day) : []

                                    const events = [
                                        ...dayContents.map((c, i) => ({
                                            id: c.id,
                                            title: c.title || 'Untitled',
                                            hour: 9 + i,
                                            minutes: 60,
                                            color: PALETTE[i % PALETTE.length],
                                            sub: c.status || '',
                                            onClick: () => onOpenDetail?.(c)
                                        })),
                                        ...dayItems.map((item, i) => ({
                                            id: item.id,
                                            title: item.title || 'Untitled',
                                            hour: 10 + dayContents.length + i,
                                            minutes: 60,
                                            color: PALETTE[(dayContents.length + i) % PALETTE.length],
                                            sub: item.type || '',
                                            onClick: () => onItemClick?.(item)
                                        }))
                                    ]

                                    return (
                                        <div
                                            key={idx}
                                            className={`relative ${isCurrentDay ? 'bg-white/[0.02]' : ''} ${isWeekend ? 'bg-black/10' : ''}`}
                                            style={{ minHeight: `${HOURS.length * slotH}px` }}
                                            onClick={() => onAddContent?.(format(day, 'yyyy-MM-dd'))}
                                        >
                                            {events.map(ev => {
                                                const top = (ev.hour - 8) * slotH
                                                const height = Math.max((ev.minutes / 60) * slotH, 24)
                                                const c = COLOR_MAP[ev.color] || COLOR_MAP.purple
                                                return (
                                                    <div
                                                        key={ev.id}
                                                        onClick={e => { e.stopPropagation(); ev.onClick?.() }}
                                                        className={`absolute left-1 right-2 rounded-md border-l-4 ${c.border} ${c.bg} backdrop-blur-sm cursor-pointer hover:scale-[1.02] transition-transform z-10 overflow-hidden shadow-lg`}
                                                        style={{ top: `${top}px`, height: `${height}px`, padding: height < 36 ? '2px 6px' : '8px' }}
                                                    >
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className={`text-[11px] font-bold ${c.title} truncate leading-tight`}>{ev.title}</div>
                                                        </div>
                                                        {height >= 36 && (
                                                            <div className={`text-[10px] ${c.sub} mt-px`}>
                                                                {String(ev.hour).padStart(2, '0')}:00 - {String(ev.hour + 1).padStart(2, '0')}:00
                                                            </div>
                                                        )}
                                                        {height >= 50 && ev.sub && (
                                                            <div className={`text-[10px] ${c.sub} opacity-70 truncate mt-0.5`}>{ev.sub}</div>
                                                        )}
                                                        {height >= 70 && (
                                                            <div className="mt-1.5 flex gap-1 flex-wrap">
                                                                <span className={`text-[9px] px-1.5 py-0.5 ${c.bg} rounded ${c.title} font-medium`}>Event</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}

                                            {/* Ghost add slot */}
                                            {events.length === 0 && !isWeekend && (
                                                <div
                                                    className="absolute left-1 right-2 rounded-md border border-dashed border-border/60 opacity-0 hover:opacity-100 cursor-pointer flex items-center justify-center transition-opacity group"
                                                    style={{ top: `${4 * slotH}px`, height: `${slotH * 0.75}px` }}
                                                >
                                                    <span className="text-[10px] text-text-muted group-hover:text-text-secondary">+ Suggest Time</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: Sidebar ── */}
            <div className="hidden xl:flex">
                <CalendarSidebar contents={contents} items={items} onAddContent={onAddContent} />
            </div>
        </div>
    )
})
