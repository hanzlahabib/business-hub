import { useState, useCallback, useEffect, useMemo } from 'react'
import { Video, Smartphone, CheckSquare, Briefcase, Users, Target, type LucideIcon } from 'lucide-react'
import type { Content } from './useSchedule'
import { ENDPOINTS } from '../config/api'
import { useAuth } from './useAuth'

export interface CalendarFilters {
    contents: boolean
    tasks: boolean
    jobs: boolean
    leads: boolean
    milestones: boolean
}

// Default filter configuration - only contents enabled by default
const DEFAULT_FILTERS: CalendarFilters = {
    contents: true,
    tasks: false,
    jobs: false,
    leads: false,
    milestones: false
}

export interface CalendarItemTypeConfig {
    colorVar: string
    icon: LucideIcon
    label: string
    draggable: boolean
}

// Item type configuration for styling and behavior
export const CALENDAR_ITEM_TYPES: Record<string, CalendarItemTypeConfig> = {
    content: {
        colorVar: '--color-calendar-content',
        icon: Video,
        label: 'Content',
        draggable: true
    },
    task: {
        colorVar: '--color-calendar-task',
        icon: CheckSquare,
        label: 'Task',
        draggable: true
    },
    interview: {
        colorVar: '--color-calendar-interview',
        icon: Briefcase,
        label: 'Interview',
        draggable: false
    },
    lead: {
        colorVar: '--color-calendar-lead',
        icon: Users,
        label: 'Lead',
        draggable: true
    },
    milestone: {
        colorVar: '--color-calendar-milestone',
        icon: Target,
        label: 'Milestone',
        draggable: true
    }
}

export interface CalendarItem {
    id: string
    type: string
    subType?: string
    title: string
    date: string // YYYY-MM-DD
    draggable: boolean
    icon: LucideIcon
    sourceData: any
    module: string
    priority?: string
    boardId?: string
    jobId?: string
    pathId?: string
    pathName?: string
}

export function useCalendarItems(filters: CalendarFilters = DEFAULT_FILTERS) {
    const { user } = useAuth()
    const [contents, setContents] = useState<Content[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [jobs, setJobs] = useState<any[]>([])
    const [leads, setLeads] = useState<any[]>([])
    const [skillMasteryData, setSkillMasteryData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Fetch data based on enabled filters
    const fetchData = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const promises: Promise<any>[] = []
            const fetchMap: string[] = []

            const headers = { 'x-user-id': user.id }

            if (filters.contents) {
                promises.push(fetch(ENDPOINTS.CONTENTS, { headers }).then(r => r.json()))
                fetchMap.push('contents')
            }
            if (filters.tasks) {
                promises.push(fetch(ENDPOINTS.TEMPLATES.replace('templates', 'tasks'), { headers }).then(r => r.json()))
                fetchMap.push('tasks')
            }
            if (filters.jobs) {
                promises.push(fetch(ENDPOINTS.JOBS, { headers }).then(r => r.json()))
                fetchMap.push('jobs')
            }
            if (filters.leads) {
                promises.push(fetch(ENDPOINTS.LEADS, { headers }).then(r => r.json()))
                fetchMap.push('leads')
            }
            if (filters.milestones) {
                promises.push(fetch(ENDPOINTS.SETTINGS.replace('resources/settings', 'skillmastery'), { headers }).then(r => r.json()))
                fetchMap.push('skillMastery')
            }

            const results = await Promise.all(promises)

            results.forEach((data, index) => {
                const type = fetchMap[index]
                if (type === 'contents') setContents(Array.isArray(data) ? data : [])
                if (type === 'tasks') setTasks(Array.isArray(data) ? data : [])
                if (type === 'jobs') setJobs(Array.isArray(data) ? data : [])
                if (type === 'leads') setLeads(Array.isArray(data) ? data : [])
                if (type === 'skillMastery') setSkillMasteryData(data)
            })
        } catch (err: any) {
            console.error('Failed to fetch calendar items:', err)
        } finally {
            setLoading(false)
        }
    }, [user, filters])

    // Refetch when filters or user changes
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Transform all data into unified CalendarItem format
    const items = useMemo(() => {
        const result: CalendarItem[] = []

        // Add contents
        if (filters.contents) {
            contents.forEach(content => {
                if (content.scheduledDate) {
                    result.push({
                        id: content.id,
                        type: 'content',
                        subType: content.type, // 'long' or 'short'
                        title: content.title || 'Untitled',
                        date: content.scheduledDate,
                        draggable: true,
                        icon: content.type === 'long' ? Video : Smartphone,
                        sourceData: content,
                        module: 'schedule'
                    })
                }
            })
        }

        // Add tasks with due dates
        if (filters.tasks) {
            tasks.forEach(task => {
                if (task.dueDate) {
                    // Normalize date format (remove time if present)
                    const dateOnly = task.dueDate.split('T')[0]
                    result.push({
                        id: task.id,
                        type: 'task',
                        title: task.title || 'Untitled Task',
                        date: dateOnly,
                        draggable: true,
                        // @ts-ignore
                        icon: CheckSquare,
                        priority: task.priority,
                        boardId: task.boardId,
                        sourceData: task,
                        module: 'taskboards'
                    })
                }
            })
        }

        // Add job interviews
        if (filters.jobs) {
            jobs.forEach(job => {
                if (job.interviewDates && job.interviewDates.length > 0) {
                    job.interviewDates.forEach((interviewDate: string, index: number) => {
                        const dateOnly = interviewDate.split('T')[0]
                        result.push({
                            id: `${job.id}-interview-${index}`,
                            type: 'interview',
                            title: `${job.company} - Interview`,
                            date: dateOnly,
                            draggable: false, // Interviews are not draggable
                            // @ts-ignore
                            icon: Briefcase,
                            jobId: job.id,
                            sourceData: job,
                            module: 'jobs'
                        })
                    })
                }
            })
        }

        // Add leads with follow-up dates
        if (filters.leads) {
            leads.forEach(lead => {
                if (lead.followUpDate) {
                    const dateOnly = lead.followUpDate.split('T')[0]
                    result.push({
                        id: lead.id,
                        type: 'lead',
                        title: `Follow up: ${lead.name || lead.contactPerson || 'Lead'}`,
                        date: dateOnly,
                        draggable: true,
                        // @ts-ignore
                        icon: Users,
                        sourceData: lead,
                        module: 'leads'
                    })
                }
            })
        }

        // Add skill mastery milestones with target dates
        if (filters.milestones && skillMasteryData?.paths) {
            skillMasteryData.paths.forEach((path: any) => {
                if (path.milestones) {
                    path.milestones.forEach((milestone: any) => {
                        if (milestone.targetDate && !milestone.completed) {
                            const dateOnly = milestone.targetDate.split('T')[0]
                            result.push({
                                id: milestone.id,
                                type: 'milestone',
                                title: `${path.icon} ${milestone.title}`,
                                date: dateOnly,
                                draggable: true,
                                // @ts-ignore
                                icon: Target,
                                pathId: path.id,
                                pathName: path.name,
                                sourceData: { milestone, path },
                                module: 'skillmastery'
                            })
                        }
                    })
                }
            })
        }

        return result
    }, [contents, tasks, jobs, leads, skillMasteryData, filters])

    // Get items for a specific date
    const getItemsForDate = useCallback((date: string | Date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
        return items.filter(item => item.date === dateStr)
    }, [items])

    // Reschedule an item - routes to correct update function
    const rescheduleItem = useCallback(async (item: CalendarItem, newDate: string | Date) => {
        if (!user) return false
        const dateStr = typeof newDate === 'string' ? newDate : newDate.toISOString().split('T')[0]
        const headers = {
            'Content-Type': 'application/json',
            'x-user-id': user.id
        }

        try {
            switch (item.type) {
                case 'content': {
                    await fetch(`${ENDPOINTS.CONTENTS}/${item.id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ scheduledDate: dateStr })
                    })
                    setContents(prev => prev.map(c => c.id === item.id ? { ...c, scheduledDate: dateStr } : c))
                    break
                }
                case 'task': {
                    await fetch(`${ENDPOINTS.TEMPLATES.replace('templates', 'tasks')}/${item.id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ dueDate: dateStr + 'T00:00:00Z' })
                    })
                    setTasks(prev => prev.map(t => t.id === item.id ? { ...t, dueDate: dateStr + 'T00:00:00Z' } : t))
                    break
                }
                case 'lead': {
                    await fetch(`${ENDPOINTS.LEADS}/${item.id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ followUpDate: dateStr })
                    })
                    setLeads(prev => prev.map(l => l.id === item.id ? { ...l, followUpDate: dateStr } : l))
                    break
                }
                case 'milestone': {
                    // Milestones are nested in skillMastery paths, need to update the whole structure
                    if (skillMasteryData) {
                        const newData = {
                            ...skillMasteryData,
                            paths: skillMasteryData.paths.map((path: any) => ({
                                ...path,
                                milestones: path.milestones?.map((m: any) =>
                                    m.id === item.sourceData.milestone.id
                                        ? { ...m, targetDate: dateStr }
                                        : m
                                ) || []
                            }))
                        }
                        await fetch(ENDPOINTS.SETTINGS.replace('resources/settings', 'skillmastery'), {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify(newData)
                        })
                        setSkillMasteryData(newData)
                    }
                    break
                }
                // Interviews are not draggable, so no case needed
            }
            return true
        } catch (err: any) {
            console.error('Failed to reschedule item:', err)
            return false
        }
    }, [skillMasteryData, user])

    return {
        items,
        loading,
        getItemsForDate,
        rescheduleItem,
        refetch: fetchData,
        // Expose raw data for components that need it
        contents,
        tasks,
        jobs,
        leads,
        skillMasteryData
    }
}


export default useCalendarItems
