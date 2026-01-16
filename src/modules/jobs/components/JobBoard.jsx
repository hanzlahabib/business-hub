import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, ExternalLink, Briefcase, TrendingUp, Target, Calendar } from 'lucide-react'
import { JobCard } from './JobCard'
import { useJobs } from '../hooks/useJobs'
import { JOB_STATUS_MAP } from '../constants/pipelineStages'

function StatusColumn({ status, jobs, onJobClick, onAddClick, onDrop }) {
  const config = JOB_STATUS_MAP[status]
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const jobId = e.dataTransfer.getData('jobId')
    if (jobId) {
      onDrop(jobId, status)
    }
  }

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-white/5 rounded-xl border transition-colors ${
        isDragOver ? 'border-white/30 bg-white/10' : 'border-white/10'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 bg-gradient-to-r ${config.gradient} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <h3 className="font-semibold text-white">{config.label}</h3>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
              {jobs.length}
            </span>
          </div>
          {status === 'saved' && (
            <button
              onClick={onAddClick}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
        <AnimatePresence>
          {jobs.map(job => (
            <div
              key={job.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('jobId', job.id)
              }}
            >
              <JobCard
                job={job}
                onClick={onJobClick}
              />
            </div>
          ))}
        </AnimatePresence>

        {jobs.length === 0 && (
          <div className="text-center py-8 text-white/30">
            <p className="text-sm">No jobs</p>
            {status === 'saved' && (
              <button
                onClick={onAddClick}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Add your first job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function JobBoard({
  onJobClick,
  onAddClick,
  onSearchClick,
  searchQuery = ''
}) {
  const { jobs, jobsByStatus, moveJob, getStats } = useJobs()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const filteredJobs = useMemo(() => {
    if (!localSearch) return jobs
    const q = localSearch.toLowerCase()
    return jobs.filter(j =>
      j.company?.toLowerCase().includes(q) ||
      j.role?.toLowerCase().includes(q) ||
      j.skills?.some(s => s.toLowerCase().includes(q)) ||
      j.location?.toLowerCase().includes(q)
    )
  }, [jobs, localSearch])

  const filteredJobsByStatus = useMemo(() => {
    const grouped = {}
    Object.keys(JOB_STATUS_MAP).forEach(status => {
      grouped[status] = filteredJobs.filter(j => j.status === status)
    })
    return grouped
  }, [filteredJobs])

  const handleDrop = async (jobId, newStatus) => {
    await moveJob(jobId, newStatus)
  }

  const stats = getStats()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Jobs Board</h2>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-400" />
              <span>{stats.total} total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>{stats.appliedThisWeek} applied this week</span>
            </div>
            {stats.interviewsScheduled > 0 && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{stats.interviewsScheduled} interviews</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 w-64"
            />
          </div>

          {/* Find Jobs */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Find Jobs
          </button>

          {/* Add Job */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {Object.keys(JOB_STATUS_MAP).map(status => (
            <StatusColumn
              key={status}
              status={status}
              jobs={filteredJobsByStatus[status]}
              onJobClick={onJobClick}
              onAddClick={onAddClick}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default JobBoard
