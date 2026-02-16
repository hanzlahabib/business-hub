import { memo, useMemo, useState, useCallback } from 'react'
import { format, isToday, parseISO, addDays } from 'date-fns'
import { MoreHorizontal, CornerDownLeft } from 'lucide-react'
import { toast } from 'sonner'

interface CalendarSidebarProps {
    contents: any[]
    items?: any[]
    onAddTask?: (title: string) => void
    onAddContent?: (date: string) => void
}

const PRIORITY_DOT: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-500' }
const PRIORITY_TEXT: Record<string, { label: string; color: string }> = {
    high: { label: 'High', color: 'text-red-400' },
    medium: { label: 'Med', color: 'text-amber-400' },
    low: { label: 'Low', color: 'text-blue-400' }
}
const EVENT_COLORS = ['#a855f7', '#10b981', '#06b6d4', '#f59e0b', '#6366f1', '#ec4899']

export const CalendarSidebar = memo(function CalendarSidebar({
    contents,
    items = [],
    onAddTask,
    onAddContent
}: CalendarSidebarProps) {
    const [quickTask, setQuickTask] = useState('')
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

    // Determine current hour for "Now Happening"
    const currentHour = useMemo(() => new Date().getHours(), [])

    const agendaEvents = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const todayContents = contents.filter(c => c.scheduledDate === todayStr)
        const todayItems = items.filter(item => item.date === todayStr)

        return [
            ...todayContents.map((c, i) => {
                const hour = 9 + i
                return {
                    id: c.id,
                    title: c.title || 'Untitled',
                    time: `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
                    hour,
                    subtitle: c.status || '',
                    color: EVENT_COLORS[i % EVENT_COLORS.length],
                    isNow: currentHour === hour
                }
            }),
            ...todayItems.map((item, i) => {
                const hour = 10 + contents.filter(c => c.scheduledDate === format(new Date(), 'yyyy-MM-dd')).length + i
                return {
                    id: item.id,
                    title: item.title || 'Untitled',
                    time: `${String(hour).padStart(2, '0')}:00`,
                    hour,
                    subtitle: item.type || '',
                    color: EVENT_COLORS[(contents.filter(c => c.scheduledDate === format(new Date(), 'yyyy-MM-dd')).length + i) % EVENT_COLORS.length],
                    isNow: currentHour === hour
                }
            })
        ]
    }, [contents, items, currentHour])

    const upcomingTasks = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd')

        const taskItems = items
            .filter(item => item.type === 'task' && item.date && item.date >= todayStr && item.date <= weekEnd)
            .slice(0, 5)
            .map(item => {
                const dueDate = parseISO(item.date)
                let dueLabel = format(dueDate, 'MMM d')
                if (isToday(dueDate)) dueLabel = 'Due Today'
                else if (format(addDays(new Date(), 1), 'yyyy-MM-dd') === item.date) dueLabel = 'Tomorrow'
                return {
                    id: item.id,
                    title: item.title,
                    subtitle: item.sourceData?.assignee || item.sourceData?.company || '',
                    subtitleIcon: item.sourceData?.company ? 'domain' : 'person',
                    dueLabel,
                    priority: (item.priority || 'medium') as 'high' | 'medium' | 'low'
                }
            })

        if (taskItems.length === 0) {
            return contents
                .filter(c => c.scheduledDate && c.scheduledDate >= todayStr)
                .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate))
                .slice(0, 3)
                .map(c => ({
                    id: c.id,
                    title: c.title || 'Untitled Content',
                    subtitle: '',
                    subtitleIcon: 'person' as string,
                    dueLabel: isToday(parseISO(c.scheduledDate)) ? 'Due Today' : format(parseISO(c.scheduledDate), 'MMM d'),
                    priority: 'medium' as const
                }))
        }
        return taskItems
    }, [items, contents])

    const handleQuickAdd = useCallback(() => {
        const text = quickTask.trim()
        if (!text) return
        if (onAddTask) {
            onAddTask(text)
        } else if (onAddContent) {
            onAddContent(format(new Date(), 'yyyy-MM-dd'))
            toast.success(`Opening add form for: ${text}`)
        } else {
            toast.info('Quick add submitted')
        }
        setQuickTask('')
    }, [quickTask, onAddTask, onAddContent])

    const toggleTask = useCallback((taskId: string, title: string) => {
        setCompletedTasks(prev => {
            const next = new Set(prev)
            if (next.has(taskId)) {
                next.delete(taskId)
            } else {
                next.add(taskId)
                toast.success(`"${title}" completed`)
            }
            return next
        })
    }, [])

    return (
        <div className="w-[380px] flex-shrink-0 h-full flex flex-col bg-bg-primary border-l border-border shadow-xl z-20">
            {/* ── Today's Agenda Widget ── */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Today's Agenda</h3>
                    <button
                        onClick={() => toast.info('Agenda options coming soon')}
                        className="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {agendaEvents.length > 0 ? (
                    <div className="space-y-4">
                        {agendaEvents.map((event, idx) => (
                            <div key={event.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-medium text-text-muted w-[35px] text-right">{event.time}</span>
                                    {idx < agendaEvents.length - 1 && <div className="w-[1px] flex-1 bg-border my-1" />}
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="relative pl-4">
                                        <div
                                            className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${event.isNow ? 'animate-pulse' : ''}`}
                                            style={{
                                                backgroundColor: event.color,
                                                ...(event.isNow ? { boxShadow: `0 0 8px ${event.color}` } : {})
                                            }}
                                        />
                                        <h4 className={`text-sm font-semibold leading-tight ${event.isNow ? 'text-white' : 'text-text-secondary'}`}>
                                            {event.title}
                                        </h4>
                                        {event.subtitle && (
                                            <p className="text-xs text-text-muted mt-0.5">{event.subtitle}</p>
                                        )}
                                        {event.isNow && (
                                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                                Now Happening
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-muted text-center py-4">No events today</p>
                )}
            </div>

            {/* ── Upcoming Tasks Widget ── */}
            <div className="flex-1 flex flex-col min-h-0 bg-black/20">
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Upcoming Tasks</h3>
                        <button
                            onClick={() => toast.info('Full task view coming soon')}
                            className="text-accent-primary text-xs font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar space-y-3">
                    {upcomingTasks.length > 0 ? upcomingTasks.map(task => {
                        const isDone = completedTasks.has(task.id)
                        return (
                            <div key={task.id} className={`bg-[#0F1419] border border-border rounded-lg p-3 hover:border-text-muted/30 transition-colors group ${isDone ? 'opacity-50' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={isDone}
                                            onChange={() => toggleTask(task.id, task.title)}
                                            className="rounded border-border bg-transparent text-accent-primary focus:ring-accent-primary/50 w-4 h-4 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-medium truncate transition-colors ${isDone ? 'line-through text-text-muted' : 'text-text-secondary group-hover:text-accent-primary'}`}>
                                                {task.title}
                                            </p>
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} title={`${task.priority} priority`} />
                                        </div>
                                        {task.subtitle && (
                                            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                                                <span className="material-icons-round text-[10px]">{task.subtitleIcon}</span>
                                                {task.subtitle}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] bg-bg-secondary px-1.5 py-0.5 rounded text-text-muted">{task.dueLabel}</span>
                                            <span className={`text-[10px] font-medium ${PRIORITY_TEXT[task.priority].color}`}>
                                                {PRIORITY_TEXT[task.priority].label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-xs text-text-muted text-center py-4">No upcoming tasks</p>
                    )}
                </div>
            </div>

            {/* ── Quick Add Input ── */}
            <div className="p-4 border-t border-border bg-bg-primary">
                <div className="relative group">
                    <input
                        type="text"
                        value={quickTask}
                        onChange={e => setQuickTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                        placeholder="Add a task quickly..."
                        className="w-full bg-[#0F1419] border border-border focus:border-accent-primary rounded-lg py-2.5 pl-3 pr-10 text-sm text-text-primary placeholder-text-muted focus:ring-1 focus:ring-accent-primary focus:bg-[#0F1419] transition-all shadow-inner"
                    />
                    <button
                        onClick={handleQuickAdd}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded bg-bg-tertiary text-text-muted hover:bg-accent-primary hover:text-white transition-colors"
                    >
                        <CornerDownLeft size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
})

export default CalendarSidebar
