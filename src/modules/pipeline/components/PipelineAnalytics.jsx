import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, AlertTriangle, Clock, Target,
  Zap, BarChart3, CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const STAGE_LABELS = {
  idea: 'Ideas',
  script: 'Script',
  recording: 'Recording',
  editing: 'Editing',
  thumbnail: 'Thumbnail',
  published: 'Published'
}

const STAGE_COLORS = {
  idea: 'bg-slate-500',
  script: 'bg-blue-500',
  recording: 'bg-amber-500',
  editing: 'bg-purple-500',
  thumbnail: 'bg-orange-500',
  published: 'bg-green-500'
}

export const PipelineAnalytics = memo(function PipelineAnalytics({
  healthScore,
  weeklyProgress,
  publishingVelocity,
  bottleneck,
  overdueItems,
  stuckItems
}) {
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Attention'
    return 'Critical'
  }

  return (
    <Card className="bg-bg-secondary/50 border-border">
      <CardContent className="p-3">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Health Score */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Health</span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={healthScore}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-xl font-bold ${getHealthColor(healthScore)}`}
              >
                {healthScore}
              </motion.span>
              <span className="text-text-muted text-xs">/100</span>
            </div>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${healthScore >= 60 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}
            >
              {getHealthLabel(healthScore)}
            </Badge>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Weekly Goals - Compact */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Goals</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Long</span>
                <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, weeklyProgress.long.percentage)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary">
                  {weeklyProgress.long.current}/{weeklyProgress.long.goal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Shorts</span>
                <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, weeklyProgress.shorts.percentage)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary">
                  {weeklyProgress.shorts.current}/{weeklyProgress.shorts.goal}
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Publishing Velocity - Compact */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Published</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-primary">{publishingVelocity.last7Days}</span>
              <span className="text-[10px] text-text-muted">7d</span>
              <span className="text-sm text-text-muted">{publishingVelocity.last14Days}</span>
              <span className="text-[10px] text-text-muted">14d</span>
              <span className="text-sm text-text-muted">{publishingVelocity.last30Days}</span>
              <span className="text-[10px] text-text-muted">30d</span>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Alerts - Compact */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              {overdueItems.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {overdueItems.length} overdue
                </Badge>
              )}
              {stuckItems.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 gap-1">
                  <BarChart3 className="w-2.5 h-2.5" />
                  {stuckItems.length} stuck
                </Badge>
              )}
              {bottleneck && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-500">
                  {STAGE_LABELS[bottleneck.stage]}
                </Badge>
              )}
              {overdueItems.length === 0 && stuckItems.length === 0 && !bottleneck && (
                <span className="flex items-center gap-1 text-green-500 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clear
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default PipelineAnalytics
