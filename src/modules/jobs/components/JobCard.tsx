// @ts-nocheck
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, DollarSign, Clock, Star, ExternalLink } from 'lucide-react'
import { JOB_SOURCES, PRIORITY_LEVELS } from '../constants/pipelineStages'

function JobCardComponent({ job, onClick }) {
  const source = useMemo(() =>
    JOB_SOURCES.find(s => s.id === job.source) || JOB_SOURCES.find(s => s.id === 'other'),
    [job.source]
  )

  const priority = useMemo(() =>
    PRIORITY_LEVELS.find(p => p.id === job.priority),
    [job.priority]
  )

  const daysSinceCreated = useMemo(() => {
    if (!job.createdAt) return null
    const created = new Date(job.createdAt)
    const now = new Date()
    return Math.ceil((now - created) / (1000 * 60 * 60 * 24))
  }, [job.createdAt])

  const daysSinceApplied = useMemo(() => {
    if (!job.appliedAt) return null
    const applied = new Date(job.appliedAt)
    const now = new Date()
    return Math.ceil((now - applied) / (1000 * 60 * 60 * 24))
  }, [job.appliedAt])

  const salaryDisplay = useMemo(() => {
    if (!job.salaryMin && !job.salaryMax) return null
    const currency = job.salaryCurrency || '$'
    const formatSalary = (val) => {
      if (val >= 1000) return `${Math.round(val / 1000)}k`
      return val
    }
    if (job.salaryMin && job.salaryMax) {
      return `${currency}${formatSalary(job.salaryMin)} - ${currency}${formatSalary(job.salaryMax)}`
    }
    if (job.salaryMin) return `${currency}${formatSalary(job.salaryMin)}+`
    if (job.salaryMax) return `Up to ${currency}${formatSalary(job.salaryMax)}`
  }, [job.salaryMin, job.salaryMax, job.salaryCurrency])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onClick(job)}
      className="p-3 bg-bg-secondary hover:bg-bg-tertiary rounded-lg border border-border hover:border-border-hover cursor-pointer transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary truncate group-hover:text-blue-400 transition-colors">
            {job.role || 'Untitled Position'}
          </h4>
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{job.company || 'Unknown Company'}</span>
          </div>
        </div>

        {/* Priority indicator */}
        {priority && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: priority.color }}
            title={priority.label}
          />
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2 text-xs">
        {/* Location */}
        {job.location && (
          <span className="flex items-center gap-1 text-text-muted">
            <MapPin className="w-3 h-3" />
            {job.locationType === 'remote' ? '🌍 Remote' : job.location}
          </span>
        )}

        {/* Salary */}
        {salaryDisplay && (
          <span className="flex items-center gap-1 text-green-400/80">
            <DollarSign className="w-3 h-3" />
            {salaryDisplay}
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.skills.slice(0, 4).map(skill => (
            <span
              key={skill}
              className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded border border-blue-500/20"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-1.5 py-0.5 text-text-muted text-xs">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          {/* Source */}
          <span className="text-xs" title={source?.name}>
            {source?.icon}
          </span>

          {/* Experience level */}
          {job.experienceLevel && (
            <span className="text-xs text-text-muted px-1.5 py-0.5 bg-bg-tertiary rounded">
              {job.experienceLevel}
            </span>
          )}
        </div>

        {/* Time indicator */}
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Clock className="w-3 h-3" />
          {job.status === 'saved' && daysSinceCreated !== null && (
            <span>{daysSinceCreated}d saved</span>
          )}
          {job.status !== 'saved' && daysSinceApplied !== null && (
            <span>{daysSinceApplied}d ago</span>
          )}
          {daysSinceCreated === null && daysSinceApplied === null && (
            <span>Just added</span>
          )}
        </div>
      </div>

      {/* Source URL indicator */}
      {job.sourceUrl && (
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-all"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  )
}

export const JobCard = memo(JobCardComponent)
export default JobCard
