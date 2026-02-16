import { CheckSquare } from 'lucide-react'

// Demo agenda data matching the Stitch design
const AGENDA_ITEMS = [
    {
        id: 'agenda-1',
        time: '09:30',
        title: 'Q1 Planning Sync',
        subtitle: 'Marketing Team • Room 402',
        dotColor: 'bg-purple-500',
        dotGlow: '',
        badge: null,
    },
    {
        id: 'agenda-2',
        time: '10:00',
        title: 'Proposal Review',
        subtitle: 'Stark Industries • Zoom',
        dotColor: 'bg-emerald-500',
        dotGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        badge: 'Now Happening',
    },
    {
        id: 'agenda-3',
        time: '12:15',
        title: 'Discovery Call',
        subtitle: 'Acme Corp',
        dotColor: 'bg-cyan-500',
        dotGlow: '',
        badge: null,
    },
]

const TASKS = [
    {
        id: 'task-1',
        title: 'Finalize Q2 Contract',
        assignee: 'Jordan Belfort',
        assigneeIcon: 'person',
        dueLabel: 'Due Today',
        priority: 'High',
        priorityDot: 'bg-red-500',
        priorityText: 'text-red-400',
    },
    {
        id: 'task-2',
        title: 'Update CRM Records',
        assignee: 'Wayne Ent.',
        assigneeIcon: 'domain',
        dueLabel: 'Tomorrow',
        priority: 'Low',
        priorityDot: 'bg-blue-500',
        priorityText: 'text-blue-400',
    },
    {
        id: 'task-3',
        title: 'Draft Welcome Email',
        assignee: 'Sarah Connor',
        assigneeIcon: 'person',
        dueLabel: 'Feb 26',
        priority: 'Med',
        priorityDot: 'bg-amber-500',
        priorityText: 'text-amber-400',
    },
]

export function CallingScheduleSidebar() {
    return (
        <div className="w-[380px] flex-shrink-0 bg-white dark:bg-[#161C24] border-l border-slate-200 dark:border-[#2D333B] flex flex-col z-20 shadow-xl">
            {/* Today's Agenda Widget */}
            <div className="p-6 border-b border-slate-200 dark:border-[#2D333B]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Today's Agenda
                    </h3>
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <span className="material-icons-round text-sm">more_horiz</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {AGENDA_ITEMS.map((item, idx) => (
                        <div key={item.id} className="flex gap-4 group">
                            {/* Time + vertical line */}
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-medium text-slate-400 w-[35px] text-right">{item.time}</span>
                                {idx < AGENDA_ITEMS.length - 1 && (
                                    <div className="w-[1px] h-full bg-slate-200 dark:bg-[#2D333B] my-1" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                                <div className="relative pl-4">
                                    {/* Dot */}
                                    <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${item.dotColor} ${item.dotGlow}`} />
                                    <h4 className={`text-sm font-semibold leading-tight ${item.badge ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                                    {item.badge && (
                                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Tasks Widget */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-black/20">
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Upcoming Tasks
                        </h3>
                        <button className="text-[#6464f2] text-xs font-medium hover:underline">View All</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar space-y-3">
                    {TASKS.map(task => (
                        <div
                            key={task.id}
                            className="bg-white dark:bg-[#0F1419] border border-slate-200 dark:border-[#2D333B] rounded-lg p-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-[#6464f2] focus:ring-[#6464f2]/50 w-4 h-4 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-[#6464f2] transition-colors">
                                            {task.title}
                                        </p>
                                        <span className={`w-2 h-2 rounded-full ${task.priorityDot} flex-shrink-0`} title={`${task.priority} Priority`} />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <span className="material-icons-round text-[10px]">{task.assigneeIcon}</span>
                                        {task.assignee}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] bg-slate-100 dark:bg-[#161C24] px-1.5 py-0.5 rounded text-slate-500">
                                            {task.dueLabel}
                                        </span>
                                        <span className={`text-[10px] ${task.priorityText} font-medium`}>{task.priority}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Add Input */}
                <div className="p-4 border-t border-slate-200 dark:border-[#2D333B] bg-white dark:bg-[#161C24]">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Add a task quickly..."
                            className="w-full bg-slate-100 dark:bg-[#0F1419] border border-transparent dark:border-[#2D333B] dark:focus:border-[#6464f2] rounded-lg py-2.5 pl-3 pr-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-[#6464f2] focus:bg-white dark:focus:bg-[#0F1419] transition-all shadow-inner"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-[#6464f2] hover:text-white transition-colors">
                            <span className="material-icons-round text-sm">subdirectory_arrow_left</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CallingScheduleSidebar
