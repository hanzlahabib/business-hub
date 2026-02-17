import { memo, useMemo, useRef, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00–20:00
const COLOR_MAP: Record<string, { border: string; bg: string; title: string; sub: string }> = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-500/20', title: 'text-purple-800 dark:text-purple-200', sub: 'text-purple-700 dark:text-purple-300' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', title: 'text-emerald-800 dark:text-emerald-100', sub: 'text-emerald-700 dark:text-emerald-300' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/20', title: 'text-cyan-800 dark:text-cyan-100', sub: 'text-cyan-700 dark:text-cyan-300' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-500/20', title: 'text-amber-800 dark:text-amber-100', sub: 'text-amber-700 dark:text-amber-300' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-500/20', title: 'text-indigo-800 dark:text-indigo-100', sub: 'text-indigo-700 dark:text-indigo-300' },
    pink: { border: 'border-pink-500', bg: 'bg-pink-500/20', title: 'text-pink-800 dark:text-pink-100', sub: 'text-pink-700 dark:text-pink-300' },
}
const PALETTE = ['purple', 'emerald', 'cyan', 'amber', 'indigo', 'pink']

interface DayGridProps {
    currentDate: Date
    contents: any[]
    items?: any[]
    hasActiveFilters: boolean
    onAddContent?: (date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: any) => void
}

export const DayGrid = memo(function DayGrid({
    currentDate,
    contents,
    items = [],
    hasActiveFilters,
    onAddContent,
    onOpenDetail,
    onItemClick
}: DayGridProps) {
    const gridRef = useRef<HTMLDivElement>(null)
    const hasScrolled = useRef(false)
    const slotH = 80 // Fixed 80px per hour for day view (more spacious)
    const today = useMemo(() => new Date(), [])
    const isDayToday = useMemo(() => isSameDay(currentDate, today), [currentDate, today])
    const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate])

    // Get events for this day
    const events = useMemo(() => {
        const dayContents = contents.filter(c => c.scheduledDate === dateStr)
        const dayItems = hasActiveFilters ? items.filter(item => item.date === dateStr) : []
        return [
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
    }, [contents, items, dateStr, hasActiveFilters, onOpenDetail, onItemClick])

    // Current time indicator
    const currentTimeTop = useMemo(() => {
        if (!isDayToday) return null
        const now = new Date()
        const h = now.getHours(), m = now.getMinutes()
        if (h < 8 || h > 20) return null
        return ((h - 8) * slotH) + ((m / 60) * slotH)
    }, [isDayToday, slotH])
    const currentTimeLabel = useMemo(() => format(new Date(), 'HH:mm'), [])

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (gridRef.current && currentTimeTop !== null && !hasScrolled.current) {
            const offset = Math.max(0, currentTimeTop - 200)
            gridRef.current.scrollTop = offset
            hasScrolled.current = true
        }
    }, [currentTimeTop])

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Day header */}
            <div className="border-b border-border bg-bg-primary px-6 py-4 flex items-center gap-4 shrink-0">
                <div className="grid" style={{ gridTemplateColumns: '60px 1fr' }}>
                    <div />
                    <div className="flex items-center gap-4">
                        {isDayToday ? (
                            <div className="w-12 h-12 rounded-full bg-accent-primary text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-accent-primary/30">
                                {format(currentDate, 'd')}
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-lg font-bold text-text-secondary">
                                {format(currentDate, 'd')}
                            </div>
                        )}
                        <div>
                            <h3 className={`text-lg font-bold ${isDayToday ? 'text-accent-primary' : 'text-text-primary'}`}>
                                {format(currentDate, 'EEEE')}
                            </h3>
                            <p className="text-xs text-text-muted">{format(currentDate, 'MMMM d, yyyy')}</p>
                        </div>
                        {isDayToday && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium ml-2">
                                Today
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Time grid */}
            <div ref={gridRef} className="flex-1 overflow-auto relative">
                <div className="grid relative" style={{ gridTemplateColumns: '60px 1fr', minHeight: `${HOURS.length * slotH}px` }}>
                    {/* Time Axis */}
                    <div className="border-r border-border bg-bg-secondary/30 text-xs text-text-muted font-medium text-right select-none pt-2">
                        {HOURS.map(hour => (
                            <div key={hour} style={{ height: `${slotH}px` }} className="-mt-2.5 pr-2">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Events column */}
                    <div
                        className="relative"
                        style={{ minHeight: `${HOURS.length * slotH}px` }}
                        onClick={() => onAddContent?.(dateStr)}
                    >
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

                        {/* Event cards — wider in day view */}
                        {events.map(ev => {
                            const top = (ev.hour - 8) * slotH
                            const height = Math.max((ev.minutes / 60) * slotH, 36)
                            const c = COLOR_MAP[ev.color] || COLOR_MAP.purple
                            return (
                                <div
                                    key={ev.id}
                                    onClick={e => { e.stopPropagation(); ev.onClick?.() }}
                                    className={`absolute left-2 right-4 rounded-md border-l-4 ${c.border} ${c.bg} backdrop-blur-sm cursor-pointer hover:scale-[1.01] transition-transform z-10 overflow-hidden shadow-lg p-3`}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-sm font-bold ${c.title} truncate leading-tight`}>{ev.title}</div>
                                    </div>
                                    <div className={`text-xs ${c.sub}`}>
                                        {String(ev.hour).padStart(2, '0')}:00 - {String(ev.hour + 1).padStart(2, '0')}:00
                                    </div>
                                    {ev.sub && (
                                        <div className={`text-xs ${c.sub} opacity-70 truncate mt-1`}>{ev.sub}</div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Ghost add slot when empty */}
                        {events.length === 0 && (
                            <div
                                className="absolute left-2 right-4 rounded-md border border-dashed border-border/60 opacity-0 hover:opacity-100 cursor-pointer flex items-center justify-center transition-opacity group"
                                style={{ top: `${4 * slotH}px`, height: `${slotH}px` }}
                            >
                                <span className="text-xs text-text-muted group-hover:text-text-secondary">+ Add Event</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

export default DayGrid
