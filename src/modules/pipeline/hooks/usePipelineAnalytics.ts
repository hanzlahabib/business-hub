import { useMemo } from 'react'
import { differenceInDays, differenceInHours, parseISO, isPast, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

const STAGES = ['idea', 'script', 'recording', 'editing', 'thumbnail', 'published']

export function usePipelineAnalytics(contents = [], settings = {}) {
  // Calculate time in current stage for each content
  const contentWithAge = useMemo(() => {
    if (!contents || contents.length === 0) return []
    const now = new Date()
    return contents.map(content => {
      const createdAt = content.createdAt ? parseISO(content.createdAt) : now
      const statusChangedAt = content.statusChangedAt ? parseISO(content.statusChangedAt) : createdAt

      const daysInStage = differenceInDays(now, statusChangedAt)
      const hoursInStage = differenceInHours(now, statusChangedAt)
      const totalDaysInPipeline = differenceInDays(now, createdAt)

      const isOverdue = content.scheduledDate && content.status !== 'published'
        ? isPast(parseISO(content.scheduledDate + 'T23:59:59'))
        : false

      return {
        ...content,
        daysInStage,
        hoursInStage,
        totalDaysInPipeline,
        isOverdue
      }
    })
  }, [contents])

  // Bottleneck detection - which stage has most items stuck (>3 days)
  const bottleneck = useMemo(() => {
    if (!contentWithAge || contentWithAge.length === 0) return null

    const stageCounts = {}
    STAGES.forEach(stage => {
      stageCounts[stage] = contentWithAge.filter(
        c => c.status === stage && c.daysInStage > 3 && stage !== 'published'
      ).length
    })

    const maxStage = Object.entries(stageCounts)
      .filter(([stage]) => stage !== 'published')
      .sort((a, b) => b[1] - a[1])[0]

    return maxStage && maxStage[1] > 0 ? { stage: maxStage[0], count: maxStage[1] } : null
  }, [contentWithAge])

  // Average time per stage (from published content history)
  const avgTimePerStage = useMemo(() => {
    // This would need status history tracking for accurate calculation
    // For now, estimate based on current content ages
    const stageAvgs = {}
    STAGES.forEach(stage => {
      const stageItems = contentWithAge.filter(c => c.status === stage)
      if (stageItems.length > 0) {
        const totalDays = stageItems.reduce((sum, c) => sum + c.daysInStage, 0)
        stageAvgs[stage] = Math.round(totalDays / stageItems.length)
      } else {
        stageAvgs[stage] = 0
      }
    })
    return stageAvgs
  }, [contentWithAge])

  // Publishing velocity - content published in last 7, 14, 30 days
  const publishingVelocity = useMemo(() => {
    if (!contents || contents.length === 0) return { last7Days: 0, last14Days: 0, last30Days: 0 }

    const now = new Date()
    const published = contents.filter(c => c.status === 'published' && c.publishedDate)

    const last7Days = published.filter(c => {
      try {
        const pubDate = parseISO(c.publishedDate)
        return differenceInDays(now, pubDate) <= 7
      } catch { return false }
    }).length

    const last14Days = published.filter(c => {
      try {
        const pubDate = parseISO(c.publishedDate)
        return differenceInDays(now, pubDate) <= 14
      } catch { return false }
    }).length

    const last30Days = published.filter(c => {
      try {
        const pubDate = parseISO(c.publishedDate)
        return differenceInDays(now, pubDate) <= 30
      } catch { return false }
    }).length

    return { last7Days, last14Days, last30Days }
  }, [contents])

  // Weekly goals progress
  const weeklyProgress = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const weeklyPublished = (contents || []).filter(c => {
      if (!c.publishedDate || c.status !== 'published') return false
      try {
        const pubDate = parseISO(c.publishedDate)
        return isWithinInterval(pubDate, { start: weekStart, end: weekEnd })
      } catch { return false }
    })

    const longCount = weeklyPublished.filter(c => c.type === 'long').length
    const shortsCount = weeklyPublished.filter(c => c.type === 'short').length

    const goals = settings?.weeklyGoals || { long: 2, shorts: 5 }
    const longGoal = goals.long || 1
    const shortsGoal = goals.shorts || 1

    return {
      long: { current: longCount, goal: goals.long || 2, percentage: Math.min(100, Math.round((longCount / longGoal) * 100)) },
      shorts: { current: shortsCount, goal: goals.shorts || 5, percentage: Math.min(100, Math.round((shortsCount / shortsGoal) * 100)) }
    }
  }, [contents, settings])

  // Stage distribution
  const stageDistribution = useMemo(() => {
    return STAGES.map(stage => ({
      stage,
      count: (contents || []).filter(c => c.status === stage).length,
      overdueCount: (contentWithAge || []).filter(c => c.status === stage && c.isOverdue).length,
      avgDays: avgTimePerStage?.[stage] || 0
    }))
  }, [contents, contentWithAge, avgTimePerStage])

  // Overdue items
  const overdueItems = useMemo(() => {
    if (!contentWithAge || contentWithAge.length === 0) return []
    return contentWithAge.filter(c => c.isOverdue).sort((a, b) => {
      try {
        const aDate = parseISO(a.scheduledDate)
        const bDate = parseISO(b.scheduledDate)
        return aDate - bDate
      } catch { return 0 }
    })
  }, [contentWithAge])

  // Items stuck (>5 days in same stage, not published)
  const stuckItems = useMemo(() => {
    if (!contentWithAge || contentWithAge.length === 0) return []
    return contentWithAge
      .filter(c => c.daysInStage > 5 && c.status !== 'published')
      .sort((a, b) => b.daysInStage - a.daysInStage)
  }, [contentWithAge])

  // Overall health score (0-100)
  const healthScore = useMemo(() => {
    let score = 100

    // Deduct for overdue items (-5 per item, max -30)
    score -= Math.min(30, overdueItems.length * 5)

    // Deduct for stuck items (-3 per item, max -20)
    score -= Math.min(20, stuckItems.length * 3)

    // Deduct if bottleneck exists (-10)
    if (bottleneck) score -= 10

    // Bonus for publishing velocity (+10 if published 3+ this week)
    if (publishingVelocity.last7Days >= 3) score += 10

    // Bonus for meeting goals
    if (weeklyProgress.long.percentage >= 100) score += 5
    if (weeklyProgress.shorts.percentage >= 100) score += 5

    return Math.max(0, Math.min(100, score))
  }, [overdueItems, stuckItems, bottleneck, publishingVelocity, weeklyProgress])

  return {
    contentWithAge,
    bottleneck,
    avgTimePerStage,
    publishingVelocity,
    weeklyProgress,
    stageDistribution,
    overdueItems,
    stuckItems,
    healthScore
  }
}
