import { useState, useEffect, useCallback } from 'react'
import { ENDPOINTS } from '../config/api'
import { useAuth } from './useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../utils/authHeaders'

export interface Comment {
    id: string
    text: string
    author: string
    createdAt: string
}

export interface Url {
    id: string
    type: 'youtube' | 'doc' | 'github' | 'other'
    url: string
    label: string
}

export interface Content {
    id: string
    type: 'short' | 'long'
    title: string
    topic: string
    status: 'idea' | 'scripting' | 'filming' | 'editing' | 'thumbnail' | 'published'
    scheduledDate: string | null
    publishedDate: string | null
    sourceVideoId: string | null
    hook: string
    notes: string
    createdAt: string
    comments: Comment[]
    urls: Url[]
    videoVariant?: string
    presentationReady?: boolean
    slideDetails?: any
    [key: string]: any
}

export interface WeeklyGoals {
    long: number
    shorts: number
}

export interface Settings {
    weeklyGoals: WeeklyGoals
    goalsEnabled?: boolean
    topics?: string[]
    videoVariants?: any[]
}

export interface ContentStats {
    totalContents: number
    weekLong: number
    weekShorts: number
    inPipeline: number
    published: number
    lateCount: number
    goals: WeeklyGoals
}

export function useSchedule() {
    const { user } = useAuth()
    const [contents, setContents] = useState<Content[]>([])
    const [settings, setSettings] = useState<Settings>({ weeklyGoals: { long: 2, shorts: 5 } })
    const [loading, setLoading] = useState(true)

    // Fetch all contents
    const fetchContents = useCallback(async () => {
        if (!user) return
        try {
            const data = await fetchGet(ENDPOINTS.CONTENTS)
            setContents(Array.isArray(data) ? data : [])
        } catch (err: any) {
            console.error('Failed to fetch contents:', err)
        }
    }, [user])

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        if (!user) return
        try {
            const data = await fetchGet(ENDPOINTS.SETTINGS)
            if (data) setSettings(data)
        } catch (err: any) {
            console.error('Failed to fetch settings:', err)
        }
    }, [user])

    // Initial load
    useEffect(() => {
        if (user) {
            Promise.all([fetchContents(), fetchSettings()]).then(() => setLoading(false))
        }
    }, [user, fetchContents, fetchSettings])

    const addContent = async (content: Partial<Content>) => {
        if (!user) return
        const newContent = {
            ...content,
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
            const data = await fetchMutation(ENDPOINTS.CONTENTS, 'POST', newContent)
            setContents(prev => [...prev, data])
            return data
        } catch (err: any) {
            console.error('Failed to add content:', err)
        }
    }

    const updateContent = async (id: string, updates: Partial<Content>) => {
        if (!user) return
        try {
            const data = await fetchMutation(`${ENDPOINTS.CONTENTS}/${id}`, 'PATCH', updates)
            setContents(prev => prev.map(c => c.id === id ? data : c))
        } catch (err: any) {
            console.error('Failed to update content:', err)
        }
    }

    const deleteContent = async (id: string) => {
        if (!user) return
        try {
            await fetchMutation(`${ENDPOINTS.CONTENTS}/${id}`, 'DELETE')
            setContents(prev => prev.filter(c => c.id !== id))
        } catch (err: any) {
            console.error('Failed to delete content:', err)
        }
    }

    const moveToStatus = (id: string, newStatus: Content['status']) => {
        updateContent(id, {
            status: newStatus,
            ...(newStatus === 'published' ? { publishedDate: new Date().toISOString() } : {})
        })
    }

    const scheduleContent = (id: string, date: string) => {
        updateContent(id, { scheduledDate: date })
    }

    const getContentsByDate = (date: string) => {
        return contents.filter(c => c.scheduledDate === date)
    }

    const getContentsByStatus = (status: Content['status']) => {
        return contents.filter(c => c.status === status)
    }

    const getWeekContents = (weekStart: string) => {
        const start = new Date(weekStart)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        return contents.filter(c => {
            if (!c.scheduledDate) return false
            const date = new Date(c.scheduledDate)
            return date >= start && date < end
        })
    }

    const getStats = (): ContentStats => {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
        weekStart.setHours(0, 0, 0, 0)

        const weekContents = getWeekContents(weekStart.toISOString().split('T')[0])

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
            .sort((a, b) => new Date(b.publishedDate!).getTime() - new Date(a.publishedDate!).getTime())

        if (published.length === 0) return 0

        let streak = 0
        let currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)

        for (const content of published) {
            const pubDate = new Date(content.publishedDate!)
            pubDate.setHours(0, 0, 0, 0)

            const diffDays = Math.floor((currentDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays <= 1) {
                streak++
                currentDate = pubDate
            } else {
                break
            }
        }

        return streak
    }

    const detectUrlType = (url: string): Url['type'] => {
        if (!url) return 'other'
        const lowerUrl = url.toLowerCase()
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
        if (lowerUrl.includes('docs.google.com') || lowerUrl.includes('notion.so') || lowerUrl.includes('notion.com')) return 'doc'
        if (lowerUrl.includes('github.com') || lowerUrl.includes('gist.github.com')) return 'github'
        return 'other'
    }

    const addUrl = async (contentId: string, urlData: { url: string; label?: string }) => {
        const content = contents.find(c => c.id === contentId)
        if (!content) return

        const newUrl: Url = {
            id: crypto.randomUUID(),
            type: detectUrlType(urlData.url),
            url: urlData.url,
            label: urlData.label || ''
        }
        const updatedUrls = [...(content.urls || []), newUrl]
        await updateContent(contentId, { urls: updatedUrls })
        return newUrl
    }

    const removeUrl = async (contentId: string, urlId: string) => {
        const content = contents.find(c => c.id === contentId)
        if (!content) return

        const updatedUrls = (content.urls || []).filter(u => u.id !== urlId)
        await updateContent(contentId, { urls: updatedUrls })
    }

    const addComment = async (contentId: string, text: string) => {
        const content = contents.find(c => c.id === contentId)
        if (!content) return

        const newComment: Comment = {
            id: crypto.randomUUID(),
            text,
            author: 'User',
            createdAt: new Date().toISOString()
        }
        const updatedComments = [...(content.comments || []), newComment]
        await updateContent(contentId, { comments: updatedComments })
        return newComment
    }

    const deleteComment = async (contentId: string, commentId: string) => {
        const content = contents.find(c => c.id === contentId)
        if (!content) return

        const updatedComments = (content.comments || []).filter(c => c.id !== commentId)
        await updateContent(contentId, { comments: updatedComments })
    }

    const updateSettings = async (newSettings: Partial<Settings>) => {
        if (!user) return
        try {
            const data = await fetchMutation(ENDPOINTS.SETTINGS, 'PATCH', newSettings)
            setSettings(data)
            return data
        } catch (err: any) {
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
        detectUrlType,
        addUrl,
        removeUrl,
        addComment,
        deleteComment,
        refetch: fetchContents
    }
}

