import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const API_URL = 'http://localhost:3005'

export function useSchedule() {
  const [contents, setContents] = useState([])
  const [settings, setSettings] = useState({ weeklyGoals: { long: 2, shorts: 5 } })
  const [loading, setLoading] = useState(true)

  // Fetch all contents
  const fetchContents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/contents`)
      const data = await res.json()
      setContents(data)
    } catch (err) {
      console.error('Failed to fetch contents:', err)
    }
  }, [])

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/settings`)
      const data = await res.json()
      setSettings(data)
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    Promise.all([fetchContents(), fetchSettings()]).then(() => setLoading(false))
  }, [fetchContents, fetchSettings])

  const addContent = async (content) => {
    const newContent = {
      id: uuidv4(),
      type: content.type || 'short',
      title: content.title || '',
      topic: content.topic || '',
      status: content.status || 'idea',
      scheduledDate: content.scheduledDate || null,
      publishedDate: null,
      sourceVideoId: content.sourceVideoId || null,
      hook: content.hook || '',
      notes: content.notes || '',
      createdAt: new Date().toISOString(),
      comments: content.comments || [],
      urls: content.urls || []
    }

    try {
      const res = await fetch(`${API_URL}/contents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      })
      const data = await res.json()
      setContents(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Failed to add content:', err)
    }
  }

  const updateContent = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/contents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      setContents(prev => prev.map(c => c.id === id ? data : c))
    } catch (err) {
      console.error('Failed to update content:', err)
    }
  }

  const deleteContent = async (id) => {
    try {
      await fetch(`${API_URL}/contents/${id}`, { method: 'DELETE' })
      setContents(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete content:', err)
    }
  }

  const moveToStatus = (id, newStatus) => {
    updateContent(id, {
      status: newStatus,
      ...(newStatus === 'published' ? { publishedDate: new Date().toISOString() } : {})
    })
  }

  const scheduleContent = (id, date) => {
    updateContent(id, { scheduledDate: date })
  }

  const getContentsByDate = (date) => {
    return contents.filter(c => c.scheduledDate === date)
  }

  const getContentsByStatus = (status) => {
    return contents.filter(c => c.status === status)
  }

  const getWeekContents = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    return contents.filter(c => {
      if (!c.scheduledDate) return false
      const date = new Date(c.scheduledDate)
      return date >= start && date < end
    })
  }

  const getStats = () => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)

    const weekContents = getWeekContents(weekStart.toISOString().split('T')[0])

    // Count late items (scheduled date passed but not published)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const lateCount = contents.filter(c => {
      if (!c.scheduledDate || c.status === 'published') return false
      const scheduledDate = new Date(c.scheduledDate + 'T23:59:59')
      return scheduledDate < today
    }).length

    return {
      totalContents: contents.length,
      weekLong: weekContents.filter(c => c.type === 'long').length,
      weekShorts: weekContents.filter(c => c.type === 'short').length,
      inPipeline: contents.filter(c => c.status !== 'published').length,
      published: contents.filter(c => c.status === 'published').length,
      lateCount,
      goals: settings.weeklyGoals || { long: 2, shorts: 5 }
    }
  }

  const getStreak = () => {
    const published = contents
      .filter(c => c.publishedDate)
      .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))

    if (published.length === 0) return 0

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const content of published) {
      const pubDate = new Date(content.publishedDate)
      pubDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate - pubDate) / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        streak++
        currentDate = pubDate
      } else {
        break
      }
    }

    return streak
  }

  // URL type detection helper
  const detectUrlType = (url) => {
    if (!url) return 'other'
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
    if (lowerUrl.includes('docs.google.com') || lowerUrl.includes('notion.so') || lowerUrl.includes('notion.com')) return 'doc'
    if (lowerUrl.includes('github.com') || lowerUrl.includes('gist.github.com')) return 'github'
    return 'other'
  }

  // Add URL to content
  const addUrl = async (contentId, urlData) => {
    const content = contents.find(c => c.id === contentId)
    if (!content) return

    const newUrl = {
      id: uuidv4(),
      type: detectUrlType(urlData.url),
      url: urlData.url,
      label: urlData.label || ''
    }
    const updatedUrls = [...(content.urls || []), newUrl]
    await updateContent(contentId, { urls: updatedUrls })
    return newUrl
  }

  // Remove URL from content
  const removeUrl = async (contentId, urlId) => {
    const content = contents.find(c => c.id === contentId)
    if (!content) return

    const updatedUrls = (content.urls || []).filter(u => u.id !== urlId)
    await updateContent(contentId, { urls: updatedUrls })
  }

  // Add comment to content
  const addComment = async (contentId, text) => {
    const content = contents.find(c => c.id === contentId)
    if (!content) return

    const newComment = {
      id: uuidv4(),
      text,
      author: 'User', // Prepared for multi-user
      createdAt: new Date().toISOString()
    }
    const updatedComments = [...(content.comments || []), newComment]
    await updateContent(contentId, { comments: updatedComments })
    return newComment
  }

  // Delete comment from content
  const deleteComment = async (contentId, commentId) => {
    const content = contents.find(c => c.id === contentId)
    if (!content) return

    const updatedComments = (content.comments || []).filter(c => c.id !== commentId)
    await updateContent(contentId, { comments: updatedComments })
  }

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      const data = await res.json()
      setSettings(data)
      return data
    } catch (err) {
      console.error('Failed to update settings:', err)
    }
  }

  return {
    contents,
    settings,
    loading,
    addContent,
    updateContent,
    deleteContent,
    moveToStatus,
    scheduleContent,
    getContentsByDate,
    getContentsByStatus,
    getWeekContents,
    getStats,
    getStreak,
    updateSettings,
    // URL functions
    detectUrlType,
    addUrl,
    removeUrl,
    // Comment functions
    addComment,
    deleteComment,
    refetch: fetchContents
  }
}
