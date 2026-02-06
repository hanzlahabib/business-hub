import { useState, useCallback, useEffect, useMemo } from 'react'
import { Video, Smartphone, CheckSquare, Briefcase, Users, Target } from 'lucide-react'

const JSON_SERVER = 'http://localhost:3005'

// Default filter configuration - only contents enabled by default
const DEFAULT_FILTERS = {
  contents: true,
  tasks: false,
  jobs: false,
  leads: false,
  milestones: false
}

// Item type configuration for styling and behavior
export const CALENDAR_ITEM_TYPES = {
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

export function useCalendarItems(filters = DEFAULT_FILTERS) {
  const [contents, setContents] = useState([])
  const [tasks, setTasks] = useState([])
  const [jobs, setJobs] = useState([])
  const [leads, setLeads] = useState([])
  const [skillMasteryData, setSkillMasteryData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch data based on enabled filters
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const promises = []
      const fetchMap = []

      if (filters.contents) {
        promises.push(fetch(`${JSON_SERVER}/contents`).then(r => r.json()))
        fetchMap.push('contents')
      }
      if (filters.tasks) {
        promises.push(fetch(`${JSON_SERVER}/tasks`).then(r => r.json()))
        fetchMap.push('tasks')
      }
      if (filters.jobs) {
        promises.push(fetch(`${JSON_SERVER}/jobs`).then(r => r.json()))
        fetchMap.push('jobs')
      }
      if (filters.leads) {
        promises.push(fetch(`${JSON_SERVER}/leads`).then(r => r.json()))
        fetchMap.push('leads')
      }
      if (filters.milestones) {
        promises.push(fetch(`${JSON_SERVER}/skillMastery`).then(r => r.json()))
        fetchMap.push('skillMastery')
      }

      const results = await Promise.all(promises)

      results.forEach((data, index) => {
        const type = fetchMap[index]
        if (type === 'contents') setContents(data)
        if (type === 'tasks') setTasks(data)
        if (type === 'jobs') setJobs(data)
        if (type === 'leads') setLeads(data)
        if (type === 'skillMastery') setSkillMasteryData(data)
      })
    } catch (err) {
      console.error('Failed to fetch calendar items:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.contents, filters.tasks, filters.jobs, filters.leads, filters.milestones])

  // Refetch when filters change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Transform all data into unified CalendarItem format
  const items = useMemo(() => {
    const result = []

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
          job.interviewDates.forEach((interviewDate, index) => {
            const dateOnly = interviewDate.split('T')[0]
            result.push({
              id: `${job.id}-interview-${index}`,
              type: 'interview',
              title: `${job.company} - Interview`,
              date: dateOnly,
              draggable: false, // Interviews are not draggable
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
            icon: Users,
            sourceData: lead,
            module: 'leads'
          })
        }
      })
    }

    // Add skill mastery milestones with target dates
    if (filters.milestones && skillMasteryData?.paths) {
      skillMasteryData.paths.forEach(path => {
        if (path.milestones) {
          path.milestones.forEach(milestone => {
            if (milestone.targetDate && !milestone.completed) {
              const dateOnly = milestone.targetDate.split('T')[0]
              result.push({
                id: milestone.id,
                type: 'milestone',
                title: `${path.icon} ${milestone.title}`,
                date: dateOnly,
                draggable: true,
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
  const getItemsForDate = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    return items.filter(item => item.date === dateStr)
  }, [items])

  // Reschedule an item - routes to correct update function
  const rescheduleItem = useCallback(async (item, newDate) => {
    const dateStr = typeof newDate === 'string' ? newDate : newDate.toISOString().split('T')[0]

    try {
      switch (item.type) {
        case 'content': {
          await fetch(`${JSON_SERVER}/contents/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduledDate: dateStr })
          })
          setContents(prev => prev.map(c => c.id === item.id ? { ...c, scheduledDate: dateStr } : c))
          break
        }
        case 'task': {
          await fetch(`${JSON_SERVER}/tasks/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dueDate: dateStr + 'T00:00:00Z' })
          })
          setTasks(prev => prev.map(t => t.id === item.id ? { ...t, dueDate: dateStr + 'T00:00:00Z' } : t))
          break
        }
        case 'lead': {
          await fetch(`${JSON_SERVER}/leads/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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
              paths: skillMasteryData.paths.map(path => ({
                ...path,
                milestones: path.milestones?.map(m =>
                  m.id === item.sourceData.milestone.id
                    ? { ...m, targetDate: dateStr }
                    : m
                ) || []
              }))
            }
            await fetch(`${JSON_SERVER}/skillMastery`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newData)
            })
            setSkillMasteryData(newData)
          }
          break
        }
        // Interviews are not draggable, so no case needed
      }
      return true
    } catch (err) {
      console.error('Failed to reschedule item:', err)
      return false
    }
  }, [skillMasteryData])

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
