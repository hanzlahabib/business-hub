import { motion } from 'framer-motion'
import { Video, Smartphone, Flame, TrendingUp, CheckCircle, AlertTriangle, Target, Zap, Settings } from 'lucide-react'
import { useMemo, memo } from 'react'

export const ContentStats = memo(function ContentStats({ stats, streak, onOpenSettings, goalsEnabled = true }) {
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
    const items = []

    // Only show goal stats if enabled
    if (goalsEnabled) {
      items.push({
        icon: Video,
        label: 'Long (Week)',
        value: stats.weekLong,
        goal: stats.goals.long,
        progress: insights.longProgress,
        color: 'text-accent-secondary',
        bgColor: 'bg-accent-secondary/20'
      })
      items.push({
        icon: Smartphone,
        label: 'Shorts (Week)',
        value: stats.weekShorts,
        goal: stats.goals.shorts,
        progress: insights.shortsProgress,
        color: 'text-accent-primary',
        bgColor: 'bg-accent-primary/20'
      })
    }

    items.push({
      icon: TrendingUp,
      label: 'Pending',
      value: stats.inPipeline,
      subtext: stats.lateCount > 0 ? `${stats.lateCount} overdue` : 'on track',
      color: stats.lateCount > 0 ? 'text-accent-danger' : 'text-accent-warning',
      bgColor: stats.lateCount > 0 ? 'bg-accent-danger/20' : 'bg-accent-warning/20'
    })
    items.push({
      icon: CheckCircle,
      label: 'Published',
      value: stats.published,
      subtext: `of ${stats.totalContents} total`,
      color: 'text-accent-success',
      bgColor: 'bg-accent-success/20'
    })
    items.push({
      icon: Flame,
      label: 'Streak',
      value: streak,
      suffix: streak === 1 ? 'day' : 'days',
      color: streak >= 3 ? 'text-orange-500' : streak > 0 ? 'text-accent-warning' : 'text-text-muted',
      bgColor: streak >= 3 ? 'bg-orange-500/20' : streak > 0 ? 'bg-accent-warning/20' : 'bg-bg-tertiary'
    })

    return items
  }, [stats, streak, insights, goalsEnabled])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {/* Progress Insight Banner - Only show when goals enabled */}
      {goalsEnabled ? (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          insights.isAhead
            ? 'bg-accent-success/10 border-accent-success/30'
            : insights.isBehind
              ? 'bg-accent-danger/10 border-accent-danger/30'
              : 'bg-accent-primary/10 border-accent-primary/30'
        }`}>
          {insights.isAhead ? (
            <>
              <Zap size={20} className="text-accent-success" />
              <div>
                <p className="text-sm font-medium text-accent-success">On track!</p>
                <p className="text-xs text-text-muted">Weekly goals achieved - keep the momentum!</p>
              </div>
            </>
          ) : insights.isBehind ? (
            <>
              <AlertTriangle size={20} className="text-accent-danger" />
              <div>
                <p className="text-sm font-medium text-accent-danger">Behind schedule</p>
                <p className="text-xs text-text-muted">
                  {stats.goals.long - stats.weekLong > 0 && `${stats.goals.long - stats.weekLong} long videos `}
                  {stats.goals.shorts - stats.weekShorts > 0 && `${stats.goals.shorts - stats.weekShorts} shorts `}
                  remaining this week
                </p>
              </div>
            </>
          ) : (
            <>
              <Target size={20} className="text-accent-primary" />
              <div>
                <p className="text-sm font-medium text-text-primary">Week Progress: {insights.overallProgress}%</p>
                <p className="text-xs text-text-muted">
                  {stats.goals.long - stats.weekLong} long, {stats.goals.shorts - stats.weekShorts} shorts to go
                </p>
              </div>
            </>
          )}

          {/* Mini Progress Bar & Settings */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    insights.isAhead ? 'bg-accent-success' : insights.isBehind ? 'bg-accent-danger' : 'bg-accent-primary'
                  }`}
                  style={{ width: `${Math.min(100, insights.overallProgress)}%` }}
                />
              </div>
              <span className="text-xs text-text-muted font-medium">{insights.overallProgress}%</span>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
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

      {/* Stats Cards */}
      <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border overflow-x-auto">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-bg-tertiary/50 min-w-fit relative"
          >
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon size={18} className={item.color} />
            </div>
            <div>
              <p className="text-xs text-text-muted">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-lg font-bold ${item.color}`}>
                  {item.value}
                  {item.goal && <span className="text-text-muted font-normal text-sm">/{item.goal}</span>}
                  {item.suffix && <span className="text-sm font-normal ml-0.5">{item.suffix}</span>}
                </p>
              </div>
              {item.subtext && (
                <p className={`text-[10px] ${item.color === 'text-accent-danger' ? 'text-accent-danger' : 'text-text-muted/70'}`}>
                  {item.subtext}
                </p>
              )}
            </div>
            {/* Progress indicator for goal items */}
            {item.progress !== undefined && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-tertiary rounded-b-lg overflow-hidden">
                <div
                  className={`h-full ${item.progress >= 100 ? 'bg-accent-success' : item.bgColor.replace('/20', '')}`}
                  style={{ width: `${Math.min(100, item.progress)}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
})

export default ContentStats
