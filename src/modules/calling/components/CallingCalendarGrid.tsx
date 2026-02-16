import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

// Demo event data matching the Stitch design
const DEMO_EVENTS = [
    // Monday
    { id: 'mon-sync', day: 0, topPx: 80, heightPx: 45, title: 'Weekly Sync', time: '09:00 - 09:45', color: 'purple', type: 'recurring' },
    // Tuesday
    { id: 'tue-proposal', day: 1, topPx: 160, heightPx: 80, title: 'Proposal Review', time: '10:00 - 11:00 AM', subtitle: 'Stark Industries', color: 'emerald', icon: 'description' },
    { id: 'tue-discovery', day: 1, topPx: 340, heightPx: 90, title: 'Discovery Call', time: '12:15 - 01:30 PM', subtitle: 'Acme Corp w/ J. Doe', color: 'cyan', hasAvatars: true },
    { id: 'tue-followup', day: 1, topPx: 520, heightPx: 40, title: 'Contract Follow-up', time: '14:30 - 15:00', color: 'amber' },
    // Wednesday
    { id: 'wed-sync', day: 2, topPx: 80, heightPx: 45, title: 'Weekly Sync', time: '09:00 - 09:45', color: 'purple', type: 'recurring' },
    { id: 'wed-workshop', day: 2, topPx: 280, heightPx: 120, title: 'Workshop: UX Audit', time: '11:30 - 01:00 PM', color: 'cyan', tags: ['Zoom', 'External'] },
    // Thursday — ghost slot
    { id: 'thu-ghost', day: 3, topPx: 400, heightPx: 60, title: '', time: '', color: 'ghost' },
    // Friday
    { id: 'fri-sync', day: 4, topPx: 80, heightPx: 45, title: 'Weekly Sync', time: '09:00 - 09:45', color: 'purple', type: 'recurring' },
    { id: 'fri-wrap', day: 4, topPx: 600, heightPx: 40, title: 'EOW Wrap Up', time: '15:30 - 16:00', color: 'slate' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_NUMBERS = [23, 24, 25, 26, 27, 28, 1]
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const COLOR_STYLES: Record<string, { border: string; bg: string; titleText: string; timeText: string; subtitleText: string }> = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-500/20', titleText: 'text-purple-200', timeText: 'text-purple-300', subtitleText: 'text-purple-200/70' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', titleText: 'text-emerald-100', timeText: 'text-emerald-300', subtitleText: 'text-emerald-200/70' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/20', titleText: 'text-cyan-100', timeText: 'text-cyan-300', subtitleText: 'text-cyan-200/70' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-500/20', titleText: 'text-amber-100', timeText: 'text-amber-300', subtitleText: 'text-amber-200/70' },
    slate: { border: 'border-slate-500', bg: 'bg-slate-600/20', titleText: 'text-slate-200', timeText: 'text-slate-400', subtitleText: 'text-slate-300/70' },
}

interface EventCardProps {
    event: typeof DEMO_EVENTS[0]
}

function EventCard({ event }: EventCardProps) {
    if (event.color === 'ghost') {
        return (
            <div
                className="absolute left-1 right-2 rounded-md border border-dashed border-slate-600 bg-transparent p-2 opacity-50 hover:opacity-100 cursor-pointer flex items-center justify-center group transition-opacity"
                style={{ top: event.topPx, height: event.heightPx }}
            >
                <span className="text-xs text-slate-500 group-hover:text-slate-300">+ Suggest Time</span>
            </div>
        )
    }

    const colors = COLOR_STYLES[event.color] || COLOR_STYLES.slate
    const isSmall = event.heightPx <= 45

    return (
        <div
            className={`absolute left-1 right-2 rounded-md border-l-4 ${colors.border} ${colors.bg} backdrop-blur-sm cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:z-10 ${!isSmall ? 'shadow-lg' : ''}`}
            style={{ top: event.topPx, height: event.heightPx }}
        >
            {isSmall ? (
                <div className="p-1.5">
                    <div className={`text-xs font-semibold ${colors.titleText} truncate`}>{event.title}</div>
                    <div className={`text-[10px] ${colors.timeText}`}>{event.time}</div>
                </div>
            ) : (
                <div className="p-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-bold ${colors.titleText} truncate`}>{event.title}</div>
                        {event.icon && (
                            <span className={`material-icons-round text-[10px] ${colors.timeText}`}>{event.icon}</span>
                        )}
                        {event.hasAvatars && (
                            <div className="flex -space-x-1">
                                <div className="w-4 h-4 rounded-full bg-slate-600 border border-slate-700" />
                                <div className="w-4 h-4 rounded-full bg-slate-500 border border-slate-700" />
                            </div>
                        )}
                    </div>
                    <div className={`text-[10px] ${colors.timeText} mb-1`}>{event.time}</div>
                    {event.subtitle && (
                        <div className={`text-[10px] ${colors.subtitleText} truncate`}>{event.subtitle}</div>
                    )}
                    {event.tags && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                            {event.tags.map(tag => (
                                <span key={tag} className="text-[9px] px-1 py-0.5 bg-cyan-500/30 rounded text-cyan-100">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

interface CallingCalendarGridProps {
    onAddEvent?: () => void
}

export function CallingCalendarGrid({ onAddEvent }: CallingCalendarGridProps) {
    const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week')

    // Group events by day column
    const eventsByDay = useMemo(() => {
        const grouped: Record<number, typeof DEMO_EVENTS> = {}
        for (const event of DEMO_EVENTS) {
            if (!grouped[event.day]) grouped[event.day] = []
            grouped[event.day].push(event)
        }
        return grouped
    }, [])

    // Current time position (percentage of grid — 10:42 is about 34% through 08:00-20:00)
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    // Each hour row = 80px, starting at 08:00
    const currentTimePx = Math.max(0, (hours - 8 + minutes / 60) * 80)

    return (
        <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-[#2D333B] bg-white dark:bg-[#0F1419] min-w-0">
            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#2D333B]">
                <div className="flex items-center gap-6">
                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-[#161C24] rounded-lg p-1 border border-slate-200 dark:border-[#2D333B]">
                        {(['month', 'week', 'day'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setActiveView(v)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${activeView === v
                                        ? 'bg-white dark:bg-[#6464f2] text-[#6464f2] dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 text-sm border border-slate-200 dark:border-[#2D333B] rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium">
                            Today
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white ml-2">February 2026</h2>
                    </div>
                </div>

                <button
                    onClick={onAddEvent}
                    className="flex items-center gap-2 bg-[#6464f2] hover:bg-[#6464f2]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-[#6464f2]/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Event
                </button>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-[#0F1419]">
                {/* Header Row (Days) */}
                <div className="grid grid-cols-[60px_1fr] sticky top-0 z-30 bg-white dark:bg-[#0F1419] border-b border-slate-200 dark:border-[#2D333B]">
                    <div className="p-2 border-r border-slate-200 dark:border-[#2D333B] bg-slate-50 dark:bg-[#161C24]/50" />
                    <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-[#2D333B]">
                        {DAYS.map((day, i) => {
                            const isToday = i === 1 // Tuesday highlighted as per design
                            return (
                                <div key={day} className={`p-3 text-center ${isToday ? 'bg-[#6464f2]/5' : ''}`}>
                                    <span className={`block text-xs font-medium uppercase tracking-wide ${isToday ? 'text-[#6464f2]' : 'text-slate-400'}`}>
                                        {day}
                                    </span>
                                    {isToday ? (
                                        <div className="w-8 h-8 rounded-full bg-[#6464f2] text-white flex items-center justify-center mx-auto mt-1 text-sm font-bold shadow-md shadow-[#6464f2]/30">
                                            {DAY_NUMBERS[i]}
                                        </div>
                                    ) : (
                                        <span className="block text-lg font-bold mt-1 text-slate-700 dark:text-slate-300">
                                            {DAY_NUMBERS[i]}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Time Grid Body */}
                <div className="grid grid-cols-[60px_1fr] relative" style={{ minHeight: HOURS.length * 80 }}>
                    {/* Time Axis */}
                    <div className="border-r border-slate-200 dark:border-[#2D333B] bg-slate-50 dark:bg-[#161C24]/30 text-xs text-slate-400 font-medium text-right select-none">
                        {HOURS.map(hour => (
                            <div key={hour} className="h-20 -mt-2.5 pr-2">{hour}</div>
                        ))}
                    </div>

                    {/* Grid Lines & Events Layer */}
                    <div className="relative grid grid-cols-7 divide-x divide-slate-200 dark:divide-[#2D333B]">
                        {/* Current Time Line */}
                        {currentTimePx > 0 && (
                            <div
                                className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none"
                                style={{ top: currentTimePx }}
                            >
                                <div className="absolute -left-[65px] -top-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                    {timeLabel}
                                </div>
                                <div className="absolute -left-1.5 -top-1 w-2 h-2 rounded-full bg-red-500" />
                            </div>
                        )}

                        {/* Day Columns */}
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                            const isToday = dayIndex === 1
                            const isWeekend = dayIndex >= 5
                            const dayEvents = eventsByDay[dayIndex] || []

                            return (
                                <div
                                    key={dayIndex}
                                    className={`relative h-full ${isToday ? 'bg-slate-50/50 dark:bg-white/[0.01]' : ''
                                        } ${isWeekend ? 'bg-slate-50/20 dark:bg-black/20' : ''}`}
                                    style={{ minHeight: HOURS.length * 80 }}
                                >
                                    {/* Hour grid lines */}
                                    {HOURS.map((_, hi) => (
                                        <div
                                            key={hi}
                                            className="absolute w-full border-b border-slate-100 dark:border-white/[0.03]"
                                            style={{ top: hi * 80 + 80 }}
                                        />
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CallingCalendarGrid
