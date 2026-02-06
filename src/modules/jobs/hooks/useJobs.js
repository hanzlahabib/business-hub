import { useState, useCallback, useEffect, useMemo } from 'react'
import { JOB_STATUSES } from '../constants/pipelineStages'

const JSON_SERVER = 'http://localhost:3005'

export function useJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/jobs`)
      const data = await res.json()
      setJobs(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createJob = useCallback(async (jobData) => {
    setLoading(true)
    setError(null)
    try {
      const newJob = {
        ...jobData,
        id: crypto.randomUUID(),
        status: jobData.status || 'saved',
        skills: jobData.skills || [],
        requirements: jobData.requirements || [],
        interviewDates: [],
        notes: jobData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const res = await fetch(`${JSON_SERVER}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      })
      const data = await res.json()
      setJobs(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateJob = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date().toISOString()
        })
      })
      const data = await res.json()
      setJobs(prev => prev.map(j => j.id === id ? data : j))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteJob = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${JSON_SERVER}/jobs/${id}`, {
        method: 'DELETE'
      })
      setJobs(prev => prev.filter(j => j.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const moveJob = useCallback(async (id, newStatus) => {
    const updates = { status: newStatus }

    // Auto-set appliedAt when moving to applied
    if (newStatus === 'applied') {
      updates.appliedAt = new Date().toISOString()
    }

    return updateJob(id, updates)
  }, [updateJob])

  const addInterviewDate = useCallback(async (id, interviewDate) => {
    const job = jobs.find(j => j.id === id)
    if (!job) return null

    const newDates = [...(job.interviewDates || []), interviewDate]
    return updateJob(id, { interviewDates: newDates })
  }, [jobs, updateJob])

  // Computed data
  const jobsByStatus = useMemo(() => {
    const grouped = {}
    JOB_STATUSES.forEach(status => {
      grouped[status.id] = jobs.filter(j => j.status === status.id)
    })
    return grouped
  }, [jobs])

  const getStats = useCallback(() => {
    const stats = {
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

      // Applied this week
      if (job.appliedAt && new Date(job.appliedAt) > oneWeekAgo) {
        stats.appliedThisWeek++
      }

      // Interviews scheduled
      if (job.status === 'interview' && job.interviewDates?.length > 0) {
        const futureInterviews = job.interviewDates.filter(d => new Date(d) > new Date())
        stats.interviewsScheduled += futureInterviews.length
      }
    })

    return stats
  }, [jobs])

  const searchJobs = useCallback((query) => {
    const q = query.toLowerCase()
    return jobs.filter(j =>
      j.company?.toLowerCase().includes(q) ||
      j.role?.toLowerCase().includes(q) ||
      j.skills?.some(s => s.toLowerCase().includes(q)) ||
      j.location?.toLowerCase().includes(q)
    )
  }, [jobs])

  const filterBySkills = useCallback((skills) => {
    if (!skills || skills.length === 0) return jobs
    return jobs.filter(j =>
      skills.some(skill => j.skills?.includes(skill))
    )
  }, [jobs])

  const filterBySalary = useCallback((minSalary) => {
    return jobs.filter(j => j.salaryMin >= minSalary || j.salaryMax >= minSalary)
  }, [jobs])

  const getDaysSinceApplied = useCallback((job) => {
    if (!job.appliedAt) return null
    const appliedDate = new Date(job.appliedAt)
    const now = new Date()
    const diffTime = Math.abs(now - appliedDate)
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
