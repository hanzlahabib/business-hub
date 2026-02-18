import { useState, useCallback, useEffect, useMemo } from 'react'
import { JOB_STATUSES } from '../constants/pipelineStages'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../../utils/authHeaders'

export interface Job {
  id: string
  title: string
  company: string
  location?: string
  status: string
  skills: string[]
  requirements: string[]
  interviewDates: string[]
  notes: string
  salaryMin?: number
  salaryMax?: number
  appliedAt?: string
  createdAt: string
  updatedAt: string
  source?: string
  priority?: string
}

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGet(ENDPOINTS.JOBS)
      setJobs(Array.isArray(data) ? data : [])
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  const createJob = useCallback(async (jobData: Partial<Job>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const newJob = {
        ...jobData,
        status: jobData.status || 'saved',
        skills: jobData.skills || [],
        requirements: jobData.requirements || [],
        interviewDates: [],
        notes: jobData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const data = await fetchMutation(ENDPOINTS.JOBS, 'POST', newJob)
      setJobs(prev => [...prev, data])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateJob = useCallback(async (id: string, updates: Partial<Job>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.JOBS}/${id}`, 'PATCH', {
          ...updates,
          updatedAt: new Date().toISOString()
        })
      setJobs(prev => prev.map(j => j.id === id ? data : j))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteJob = useCallback(async (id: string) => {
    if (!user) return false
    setLoading(true)
    setError(null)
    try {
      await fetchMutation(`${ENDPOINTS.JOBS}/${id}`, 'DELETE')
      setJobs(prev => prev.filter(j => j.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const moveJob = useCallback(async (id: string, newStatus: string) => {
    const updates: Partial<Job> = { status: newStatus }

    if (newStatus === 'applied') {
      updates.appliedAt = new Date().toISOString()
    }

    return updateJob(id, updates)
  }, [updateJob])

  const addInterviewDate = useCallback(async (id: string, interviewDate: string) => {
    const job = jobs.find(j => j.id === id)
    if (!job) return null

    const newDates = [...(job.interviewDates || []), interviewDate]
    return updateJob(id, { interviewDates: newDates })
  }, [jobs, updateJob])

  const jobsByStatus = useMemo(() => {
    const grouped: Record<string, Job[]> = {}
    JOB_STATUSES.forEach(status => {
      grouped[status.id] = jobs.filter(j => j.status === status.id)
    })
    return grouped
  }, [jobs])

  const getStats = useCallback(() => {
    const stats: any = {
      total: jobs.length,
      byStatus: {},
      bySource: {},
      byPriority: {},
      appliedThisWeek: 0,
      interviewsScheduled: 0
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    JOB_STATUSES.forEach(status => {
      stats.byStatus[status.id] = jobs.filter(j => j.status === status.id).length
    })

    jobs.forEach(job => {
      if (job.source) {
        stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1
      }
      if (job.priority) {
        stats.byPriority[job.priority] = (stats.byPriority[job.priority] || 0) + 1
      }

      if (job.appliedAt && new Date(job.appliedAt) > oneWeekAgo) {
        stats.appliedThisWeek++
      }

      if (job.status === 'interview' && job.interviewDates?.length > 0) {
        const futureInterviews = job.interviewDates.filter(d => new Date(d) > new Date())
        stats.interviewsScheduled += futureInterviews.length
      }
    })

    return stats
  }, [jobs])

  const searchJobs = useCallback((query: string) => {
    const q = query.toLowerCase()
    return jobs.filter(j =>
      j.company?.toLowerCase().includes(q) ||
      j.title?.toLowerCase().includes(q) ||
      j.skills?.some(s => s.toLowerCase().includes(q)) ||
      j.location?.toLowerCase().includes(q)
    )
  }, [jobs])

  const filterBySkills = useCallback((skills: string[]) => {
    if (!skills || skills.length === 0) return jobs
    return jobs.filter(j =>
      skills.some(skill => j.skills?.includes(skill))
    )
  }, [jobs])

  const filterBySalary = useCallback((minSalary: number) => {
    return jobs.filter(j => (j.salaryMin || 0) >= minSalary || (j.salaryMax || 0) >= minSalary)
  }, [jobs])

  const getDaysSinceApplied = useCallback((job: Job) => {
    if (!job.appliedAt) return null
    const appliedDate = new Date(job.appliedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - appliedDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    jobsByStatus,
    loading,
    error,
    statuses: JOB_STATUSES,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    moveJob,
    addInterviewDate,
    searchJobs,
    filterBySkills,
    filterBySalary,
    getStats,
    getDaysSinceApplied
  }
}


export default useJobs
