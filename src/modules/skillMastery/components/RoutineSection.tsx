// @ts-nocheck
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isSameDay, parseISO, subDays } from 'date-fns'
import { Check, Flame, Calendar as CalendarIcon, Trophy } from 'lucide-react'

export function RoutineSection({ plant, onLog }) {
    const [selectedDate, setSelectedDate] = useState(new Date())

    // Get logs for selected date
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const daysLog = plant.logs?.[dateKey] || {}
    const completedHabits = daysLog.habitsCompleted || []

    const toggleHabit = (habitId) => {
        const isCompleted = completedHabits.includes(habitId)
        let newCompleted = []

        if (isCompleted) {
            newCompleted = completedHabits.filter(id => id !== habitId)
        } else {
            newCompleted = [...completedHabits, habitId]
        }

        onLog(dateKey, { habitsCompleted: newCompleted })
    }

    // Calculate stats
    const progress = Math.round((completedHabits.length / (plant.habits?.length || 1)) * 100)

    // Get last 7 days for mini calendar
    const last7Days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i)
            const dKey = format(d, 'yyyy-MM-dd')
            const log = plant.logs?.[dKey]
            const percent = log?.habitsCompleted?.length
                ? (log.habitsCompleted.length / (plant.habits?.length || 1))
                : 0
            return { date: d, percent, isToday: isSameDay(d, new Date()) }
        })
    }, [plant.logs, plant.habits])

    if (!plant.habits || plant.habits.length === 0) {
        return (
            <div className="text-center py-12 text-text-muted">
                <p>No habits defined for this skill path.</p>
                <p className="text-sm">You can add habits in settings.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-secondary p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                        <Flame size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-muted uppercase font-bold tracking-wider">Current Streak</p>
                        <p className="text-2xl font-black text-text-primary">{plant.streak?.current || 0} Days</p>
                    </div>
                </div>

                <div className="bg-bg-secondary p-4 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Check size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-muted uppercase font-bold tracking-wider">Today's Progress</p>
                        <p className="text-2xl font-black text-text-primary">{progress}%</p>
                    </div>
                </div>

                <div className="bg-bg-secondary p-4 rounded-2xl border border-border flex items-center justify-between">
                    {last7Days.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="text-[10px] text-text-muted font-bold uppercase">
                                {format(d.date, 'EEEEE')}
                            </div>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${d.isToday ? 'border-text-primary' : 'border-transparent'
                                    }`}
                                style={{
                                    backgroundColor: d.percent > 0
                                        ? `rgba(16, 185, 129, ${0.2 + (d.percent * 0.8)})`
                                        : 'var(--bg-tertiary)',
                                    color: d.percent > 0 ? '#065f46' : 'var(--text-muted)'
                                }}
                            >
                                {d.percent > 0 ? Math.round(d.percent * 100) : '-'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Habits List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
                    Daily Requirements • {format(selectedDate, 'MMMM d, yyyy')}
                </h3>

                {plant.habits.map((habit) => {
                    const isCompleted = completedHabits.includes(habit.id)

                    return (
                        <motion.button
                            key={habit.id}
                            onClick={() => toggleHabit(habit.id)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                    : 'bg-bg-secondary border-transparent hover:border-border'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-bg-tertiary text-text-muted'
                                }`}>
                                {isCompleted ? <Check size={16} strokeWidth={4} /> : (habit.icon || '○')}
                            </div>

                            <div className="flex-1">
                                <p className={`font-bold transition-colors ${isCompleted ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-text-primary'
                                    }`}>
                                    {habit.name}
                                </p>
                                {habit.description && (
                                    <p className="text-xs text-text-muted">{habit.description}</p>
                                )}
                            </div>

                            {isCompleted && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-emerald-500 text-sm font-bold uppercase tracking-wider"
                                >
                                    Done
                                </motion.div>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {progress === 100 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30 text-center"
                >
                    <Trophy className="mx-auto text-amber-500 mb-2" size={32} />
                    <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">All Habits Completed!</h3>
                    <p className="text-sm text-text-muted">You're building incredible momentum. Keep it up!</p>
                </motion.div>
            )}

        </div>
    )
}
