import { useState, useCallback, useEffect } from 'react'
import { JSON_SERVER } from '../../../config/api'
import { SKILL_TEMPLATES } from '../data/templates'

export function useSkillMastery() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${JSON_SERVER}/skillMastery`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save data
  const saveData = useCallback(async (newData) => {
    try {
      await fetch(`${JSON_SERVER}/skillMastery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      setData(newData)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // Create new skill path (plant)
  const createPath = useCallback(async (pathData) => {
    if (!data) return

    const template = SKILL_TEMPLATES.find(t => t.id === pathData.templateId) || SKILL_TEMPLATES[0]

    const newPath = {
      id: `path-${Date.now()}`,
      name: pathData.name,
      description: pathData.description || '',
      icon: pathData.icon || template.icon || '🌱',
      templateId: template.id,
      totalXP: 0,
      level: 1,
      levelThresholds: [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500],
      streak: { current: 0, best: 0, lastPracticeDate: null },
      vocabulary: [],
      resources: [],
      milestones: template.milestones ? [...template.milestones] : [],
      habits: template.habits ? [...template.habits] : [],
      logs: {}, // Dates as keys: "2023-01-01": { habits: [], journal: {}, mood: 5 }
      createdAt: new Date().toISOString()
    }

    const newData = { ...data, paths: [...(data.paths || []), newPath] }
    await saveData(newData)
  }, [data, saveData])

  // Delete path
  const deletePath = useCallback(async (pathId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.filter(p => p.id !== pathId)
    }
    await saveData(newData)
  }, [data, saveData])

  // Update path
  const updatePath = useCallback(async (pathId, updates) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => p.id === pathId ? { ...p, ...updates } : p)
    }
    await saveData(newData)
  }, [data, saveData])

  // Water plant (update streak)
  const waterPlant = useCallback(async (pathId) => {
    if (!data) return

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p

        const lastDate = p.streak?.lastPracticeDate?.split('T')[0]
        if (lastDate === today) return p

        let newCurrent = 1
        if (lastDate === yesterday) {
          newCurrent = (p.streak?.current || 0) + 1
        }

        return {
          ...p,
          totalXP: p.totalXP + 10, // Bonus XP for watering
          streak: {
            current: newCurrent,
            best: Math.max(p.streak?.best || 0, newCurrent),
            lastPracticeDate: new Date().toISOString()
          }
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Reset progress
  const resetProgress = useCallback(async (pathId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return {
          ...p,
          totalXP: 0,
          level: 1,
          streak: { current: 0, best: p.streak?.best || 0, lastPracticeDate: null },
          vocabulary: p.vocabulary?.map(v => ({ ...v, learned: false })) || [],
          resources: p.resources?.map(r => ({ ...r, completed: false })) || [],
          milestones: p.milestones?.map(m => ({ ...m, completed: false })) || []
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Add vocabulary
  const addVocabulary = useCallback(async (pathId, wordData) => {
    if (!data) return

    const newWord = {
      id: `vocab-${Date.now()}`,
      word: wordData.word,
      meaning: wordData.meaning,
      example: wordData.example || '',
      learned: false,
      createdAt: new Date().toISOString()
    }

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, vocabulary: [...(p.vocabulary || []), newWord] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Remove vocabulary
  const removeVocabulary = useCallback(async (pathId, wordId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, vocabulary: p.vocabulary?.filter(v => v.id !== wordId) || [] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Toggle vocabulary learned
  const toggleVocabularyLearned = useCallback(async (pathId, wordId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p

        const word = p.vocabulary?.find(v => v.id === wordId)
        const wasLearned = word?.learned || false

        return {
          ...p,
          totalXP: wasLearned ? p.totalXP - 5 : p.totalXP + 5,
          vocabulary: p.vocabulary?.map(v =>
            v.id === wordId ? { ...v, learned: !v.learned } : v
          ) || []
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Add resource
  const addResource = useCallback(async (pathId, resourceData) => {
    if (!data) return

    const newResource = {
      id: `resource-${Date.now()}`,
      title: resourceData.title,
      type: resourceData.type || 'book',
      url: resourceData.url || '',
      notes: resourceData.notes || '',
      completed: false,
      createdAt: new Date().toISOString()
    }

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, resources: [...(p.resources || []), newResource] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Remove resource
  const removeResource = useCallback(async (pathId, resourceId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, resources: p.resources?.filter(r => r.id !== resourceId) || [] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Toggle resource completed
  const toggleResourceCompleted = useCallback(async (pathId, resourceId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p

        const resource = p.resources?.find(r => r.id === resourceId)
        const wasCompleted = resource?.completed || false

        return {
          ...p,
          totalXP: wasCompleted ? p.totalXP - 20 : p.totalXP + 20,
          resources: p.resources?.map(r =>
            r.id === resourceId ? { ...r, completed: !r.completed } : r
          ) || []
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Add milestone
  const addMilestone = useCallback(async (pathId, title) => {
    if (!data) return

    const newMilestone = {
      id: `milestone-${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    }

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, milestones: [...(p.milestones || []), newMilestone] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Toggle milestone
  const toggleMilestone = useCallback(async (pathId, milestoneId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p

        const milestone = p.milestones?.find(m => m.id === milestoneId)
        const wasCompleted = milestone?.completed || false

        return {
          ...p,
          totalXP: wasCompleted ? p.totalXP - 50 : p.totalXP + 50,
          milestones: p.milestones?.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ) || []
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Remove milestone
  const removeMilestone = useCallback(async (pathId, milestoneId) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p
        return { ...p, milestones: p.milestones?.filter(m => m.id !== milestoneId) || [] }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Log daily activity (habits, journal, mood)
  const logDailyActivity = useCallback(async (pathId, date, activity) => {
    if (!data) return

    const newData = {
      ...data,
      paths: data.paths.map(p => {
        if (p.id !== pathId) return p

        const existingLog = p.logs?.[date] || {}
        const newLog = { ...existingLog, ...activity }

        // Calculate XP gain (simplistic for now)
        let xpGain = 0
        if (activity.habitsCompleted && activity.habitsCompleted.length > (existingLog.habitsCompleted?.length || 0)) {
          xpGain += 10 // 10 XP per new habit
        }
        if (activity.journal && !existingLog.journal) {
          xpGain += 20 // 20 XP for journaling
        }

        return {
          ...p,
          totalXP: p.totalXP + xpGain,
          logs: {
            ...(p.logs || {}),
            [date]: newLog
          }
        }
      })
    }
    await saveData(newData)
  }, [data, saveData])

  // Get level info
  const getLevelInfo = useCallback((level) => {
    const levels = [
      { name: 'Novice', icon: '🌱' },
      { name: 'Beginner', icon: '🌿' },
      { name: 'Developing', icon: '🌳' },
      { name: 'Intermediate', icon: '🌲' },
      { name: 'Advanced', icon: '⭐' },
      { name: 'Proficient', icon: '🌟' },
      { name: 'Expert', icon: '✨' },
      { name: 'Master', icon: '💫' },
      { name: 'Elite', icon: '👑' },
      { name: 'Legendary', icon: '🏆' }
    ]
    return levels[Math.min(level - 1, 9)] || levels[0]
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    paths: data?.paths || [],
    fetchData,
    createPath,
    deletePath,
    updatePath,
    waterPlant,
    resetProgress,
    addVocabulary,
    removeVocabulary,
    toggleVocabularyLearned,
    addResource,
    removeResource,
    toggleResourceCompleted,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    logDailyActivity,
    getLevelInfo
  }
}

export default useSkillMastery
