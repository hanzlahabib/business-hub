import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, ExternalLink, Briefcase, TrendingUp, Target, Calendar, AlertCircle } from 'lucide-react'
import { JobCard } from './JobCard'
import { useJobs } from '../hooks/useJobs'
import { JOB_STATUS_MAP } from '../constants/pipelineStages'
import { JobGlobalSearch } from './JobGlobalSearch'
import { LoadingSkeleton } from '../../../components/UI/LoadingSkeleton'
import { EmptyState } from '../../../components/UI/EmptyState'

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
      className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-bg-secondary rounded-xl border transition-colors ${
        isDragOver ? 'border-accent-primary bg-bg-tertiary' : 'border-border'
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
          <div className="text-center py-8 text-text-muted">
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
  onSearchClick
}) {
  const { jobs, jobsByStatus, loading, error, moveJob, getStats, fetchJobs } = useJobs()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredJobsByStatus = useMemo(() => {
    const grouped = {}
    Object.keys(JOB_STATUS_MAP).forEach(status => {
      grouped[status] = jobs.filter(j => j.status === status)
    })
    return grouped
  }, [jobs])

  const handleDrop = async (jobId, newStatus) => {
    await moveJob(jobId, newStatus)
  }

  const stats = getStats()

  // Show loading state
  if (loading && jobs.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-text-primary">Jobs Board</h2>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-x-auto">
          <div className="flex gap-4 h-full">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} variant="board" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Jobs"
          description={error}
          action={{
            label: 'Try Again',
            onClick: fetchJobs,
            variant: 'primary'
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-text-primary">Jobs Board</h2>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-text-muted">
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
          {/* Search Button (Ctrl+K) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-sm text-text-muted transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 bg-bg-tertiary rounded text-xs">Ctrl+K</kbd>
          </button>

          {/* Find Jobs */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Find Jobs
          </button>

          {/* Add Job */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
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

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <JobGlobalSearch
            jobs={jobs}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectJob={(job) => onJobClick(job)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default JobBoard
