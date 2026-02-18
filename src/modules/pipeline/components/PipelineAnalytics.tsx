
import { memo } from 'react'
import {
  TrendingUp, AlertTriangle, Clock, Target,
  Zap, BarChart3, CheckCircle2
} from 'lucide-react'

const STAGE_LABELS = {
  idea: 'Ideas',
  script: 'Script',
  recording: 'Recording',
  editing: 'Editing',
  thumbnail: 'Thumbnail',
  published: 'Published'
}

export const PipelineAnalytics = memo(function PipelineAnalytics({
  healthScore,
  weeklyProgress,
  publishingVelocity,
  bottleneck,
  overdueItems,
  stuckItems
}: any) {
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Attention'
    return 'Critical'
  }

  const getHealthBadgeColor = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-500'
    if (score >= 60) return 'bg-amber-500/10 text-amber-500'
    return 'bg-orange-500/10 text-orange-500'
  }

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center gap-8">
      {/* Health Score */}
      <div className="flex items-center gap-3 pr-8 border-r border-border/30">
        <Zap size={18} className="text-amber-500" />
        <span className="text-xs font-medium text-text-muted">Health</span>
        <span className={`text-lg font-black ${getHealthColor(healthScore)}`}>
          {healthScore}<span className="text-text-muted text-xs font-medium">/100</span>
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${getHealthBadgeColor(healthScore)}`}>
          {getHealthLabel(healthScore)}
        </span>
      </div>

      {/* Weekly Goals */}
      <div className="flex items-center gap-4 pr-8 border-r border-border/30">
        <Target size={18} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-widest">Goals</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-muted">Long</span>
          <div className="w-16 h-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, weeklyProgress.long.percentage)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-text-primary">
            {weeklyProgress.long.current}/{weeklyProgress.long.goal}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-muted">Shorts</span>
          <div className="w-16 h-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, weeklyProgress.shorts.percentage)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-text-primary">
            {weeklyProgress.shorts.current}/{weeklyProgress.shorts.goal}
          </span>
        </div>
      </div>

      {/* Publishing Velocity */}
      <div className="flex items-center gap-4 pr-8 border-r border-border/30">
        <TrendingUp size={18} className="text-text-muted" />
        <span className="text-[10px] font-bold text-text-primary">Published</span>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-text-muted">
            <b className="text-text-primary">{publishingVelocity.last7Days}</b> 7d
          </span>
          <span className="text-[10px] font-bold text-text-muted">
            <b className="text-text-primary">{publishingVelocity.last14Days}</b> 14d
          </span>
          <span className="text-[10px] font-bold text-text-muted">
            <b className="text-text-primary">{publishingVelocity.last30Days}</b> 30d
          </span>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-widest">Alerts</span>
        <div className="flex items-center gap-2">
          {overdueItems.length > 0 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[9px] font-black rounded flex items-center gap-1">
              <Clock size={10} /> {overdueItems.length} OVERDUE
            </span>
          )}
          {stuckItems.length > 0 && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[9px] font-black rounded flex items-center gap-1">
              <BarChart3 size={10} /> {stuckItems.length} STUCK
            </span>
          )}
          {bottleneck && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[9px] font-black rounded">
              {STAGE_LABELS[bottleneck.stage]}
            </span>
          )}
          {overdueItems.length === 0 && stuckItems.length === 0 && !bottleneck && (
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <CheckCircle2 size={14} /> Clear
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

export default PipelineAnalytics
