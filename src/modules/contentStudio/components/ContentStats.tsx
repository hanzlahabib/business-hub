import { motion } from 'framer-motion'
import { Video, Smartphone, Flame, TrendingUp, CheckCircle, AlertTriangle, Target, Zap, Settings, LucideIcon } from 'lucide-react'
import { useMemo, memo } from 'react'

interface Stats {
    weekLong: number
    weekShorts: number
    goals: {
        long: number
        shorts: number
    }
    inPipeline: number
    published: number
    totalContents: number
    lateCount?: number
}

interface ContentStatsProps {
    stats: Stats
    streak: number
    onOpenSettings: () => void
    goalsEnabled?: boolean
}

export const ContentStats = memo(function ContentStats({ stats, streak, onOpenSettings, goalsEnabled = true }: ContentStatsProps) {
    const insights = useMemo(() => {
        if (!goalsEnabled) {
            return {
                longProgress: 0,
                shortsProgress: 0,
                overallProgress: 0,
                lateCount: stats.lateCount || 0,
                completionRate: stats.totalContents > 0 ? Math.round((stats.published / stats.totalContents) * 100) : 0,
                isAhead: false,
                isBehind: false
            }
        }

        const longProgress = stats.goals.long > 0 ? (stats.weekLong / stats.goals.long) * 100 : 0
        const shortsProgress = stats.goals.shorts > 0 ? (stats.weekShorts / stats.goals.shorts) * 100 : 0
        const overallProgress = Math.round((longProgress + shortsProgress) / 2)

        const lateCount = stats.lateCount || 0
        const completionRate = stats.totalContents > 0
            ? Math.round((stats.published / stats.totalContents) * 100)
            : 0

        return {
            longProgress: Math.min(100, Math.round(longProgress)),
            shortsProgress: Math.min(100, Math.round(shortsProgress)),
            overallProgress,
            lateCount,
            completionRate,
            isAhead: overallProgress >= 100,
            isBehind: overallProgress < 50 && stats.weekLong + stats.weekShorts > 0
        }
    }, [stats, goalsEnabled])

    const statItems = useMemo(() => {
        const items: Array<{
            icon: LucideIcon
            label: string
            value: number
            goal?: number
            progress?: number
            subtext?: string
            suffix?: string
            color: string
            iconBg: string
            borderAccent?: string
        }> = []

        if (goalsEnabled) {
            items.push({
                icon: Video,
                label: 'Long (Week)',
                value: stats.weekLong,
                goal: stats.goals.long,
                progress: insights.longProgress,
                color: 'text-blue-400',
                iconBg: 'bg-blue-500/10 text-blue-400',
                borderAccent: insights.longProgress >= 100 ? 'border-l-4 border-l-emerald-500' : undefined
            })
            items.push({
                icon: Smartphone,
                label: 'Shorts (Week)',
                value: stats.weekShorts,
                goal: stats.goals.shorts,
                progress: insights.shortsProgress,
                color: 'text-blue-300',
                iconBg: 'bg-blue-400/10 text-blue-300'
            })
        }

        items.push({
            icon: TrendingUp,
            label: 'Pending',
            value: stats.inPipeline,
            subtext: stats.lateCount && stats.lateCount > 0 ? `${stats.lateCount} overdue` : undefined,
            color: stats.lateCount && stats.lateCount > 0 ? 'text-red-400' : 'text-amber-400',
            iconBg: stats.lateCount && stats.lateCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
            borderAccent: stats.lateCount && stats.lateCount > 0 ? 'border-l-4 border-l-red-500' : undefined
        })
        items.push({
            icon: CheckCircle,
            label: 'Published',
            value: stats.published,
            subtext: `of ${stats.totalContents} total`,
            color: 'text-emerald-400',
            iconBg: 'bg-emerald-500/10 text-emerald-400'
        })
        items.push({
            icon: Flame,
            label: 'Streak',
            value: streak,
            suffix: streak === 1 ? 'day' : 'days',
            color: streak >= 3 ? 'text-orange-400' : streak > 0 ? 'text-amber-400' : 'text-text-muted',
            iconBg: streak >= 3 ? 'bg-orange-500/10 text-orange-400' : streak > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-bg-tertiary text-text-muted'
        })

        return items
    }, [stats, streak, insights, goalsEnabled])

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
        >
            {/* Progress Insight Banner */}
            {goalsEnabled ? (
                <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-full flex items-center justify-center border ${insights.isAhead
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : insights.isBehind
                                    ? 'bg-red-500/10 border-red-500/20'
                                    : 'bg-blue-500/10 border-blue-500/20'
                            }`}>
                            {insights.isAhead ? (
                                <Zap size={20} className="text-emerald-500" />
                            ) : insights.isBehind ? (
                                <AlertTriangle size={20} className="text-red-500" />
                            ) : (
                                <Target size={20} className="text-blue-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-primary">
                                {insights.isAhead
                                    ? 'On track!'
                                    : insights.isBehind
                                        ? 'Behind schedule'
                                        : `Week Progress: ${insights.overallProgress}%`
                                }
                            </h3>
                            <p className="text-[10px] text-text-muted">
                                {insights.isAhead
                                    ? 'Weekly goals achieved - keep the momentum!'
                                    : `${stats.goals.long - stats.weekLong > 0 ? `${stats.goals.long - stats.weekLong} long` : ''} ${stats.goals.shorts - stats.weekShorts > 0 ? `${stats.goals.shorts - stats.weekShorts} shorts` : ''} to go`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-1 max-w-xs mx-12">
                        <div className="flex-1 bg-bg-tertiary h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${insights.isAhead ? 'bg-emerald-500' : insights.isBehind ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(100, insights.overallProgress)}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted">{insights.overallProgress}%</span>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-end px-4 py-2">
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            )}

            {/* Stats Cards — 5-column grid with glass-panel cards */}
            <div className="grid grid-cols-5 gap-4">
                {statItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-panel p-4 rounded-xl ${item.borderAccent || ''}`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`size-8 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{item.label}</div>
                                <div className="text-xl font-black text-text-primary">
                                    {item.value}
                                    {item.goal !== undefined && <span className="text-text-muted text-sm font-medium ml-1">/{item.goal}</span>}
                                    {item.suffix && <span className="text-text-muted text-xs font-medium ml-1">{item.suffix}</span>}
                                </div>
                                {item.subtext && (
                                    <div className={`text-[10px] font-bold ${item.subtext.includes('overdue') ? 'text-red-500' : 'text-text-muted'
                                        }`}>{item.subtext}</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
})

export default ContentStats
