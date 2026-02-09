import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, MapPin, DollarSign, Calendar, Clock, Link2, Mail,
  User, Edit2, Trash2, Send, ExternalLink, Plus, Check
} from 'lucide-react'
import { JOB_STATUS_MAP, JOB_SOURCES, PRIORITY_LEVELS } from '../constants/pipelineStages'
import { format, formatDistanceToNow } from 'date-fns'

export function JobDetailPanel({
  job,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onSendEmail,
  onAddInterview
}) {
  const [newInterviewDate, setNewInterviewDate] = useState('')

  const status = useMemo(() =>
    job ? JOB_STATUS_MAP[job.status] : null,
    [job?.status]
  )

  const source = useMemo(() =>
    job ? JOB_SOURCES.find(s => s.id === job.source) : null,
    [job?.source]
  )

  const priority = useMemo(() =>
    job ? PRIORITY_LEVELS.find(p => p.id === job.priority) : null,
    [job?.priority]
  )

  const salaryDisplay = useMemo(() => {
    if (!job?.salaryMin && !job?.salaryMax) return null
    const currency = job.salaryCurrency || '$'
    const formatSalary = (val) => val?.toLocaleString()
    if (job.salaryMin && job.salaryMax) {
      return `${currency}${formatSalary(job.salaryMin)} - ${currency}${formatSalary(job.salaryMax)}`
    }
    if (job.salaryMin) return `${currency}${formatSalary(job.salaryMin)}+`
    if (job.salaryMax) return `Up to ${currency}${formatSalary(job.salaryMax)}`
  }, [job?.salaryMin, job?.salaryMax, job?.salaryCurrency])

  const handleAddInterview = () => {
    if (newInterviewDate && onAddInterview) {
      onAddInterview(job.id, newInterviewDate)
      setNewInterviewDate('')
    }
  }

  if (!isOpen || !job) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg h-full bg-bg-primary border-l border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: status?.color + '30', color: status?.color }}
                  >
                    {status?.emoji} {status?.label}
                  </span>
                  {priority && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ backgroundColor: priority.color + '30', color: priority.color }}
                    >
                      {priority.label}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-primary">{job.role}</h2>
                <div className="flex items-center gap-2 text-text-muted mt-1">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(job)}
                className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              {job.contactEmail && (
                <button
                  onClick={() => onSendEmail(job)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 hover:bg-blue-500/30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Email
                </button>
              )}
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Job
                </a>
              )}
              <button
                onClick={() => onDelete(job)}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Change */}
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-3">Move to Stage</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(JOB_STATUS_MAP).map(s => (
                  <button
                    key={s.id}
                    onClick={() => onStatusChange(job.id, s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${job.status === s.id
                        ? 'ring-2 ring-offset-2 ring-offset-bg-primary'
                        : 'hover:opacity-80'
                      }`}
                    style={{
                      backgroundColor: s.color + '30',
                      color: s.color,
                      ringColor: job.status === s.id ? s.color : 'transparent'
                    }}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-muted">Details</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </div>
                  <p className="text-text-primary text-sm">
                    {job.locationType === 'remote' ? '🌍 Remote' : job.location || 'Not specified'}
                  </p>
                </div>

                {/* Salary */}
                <div className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                    <DollarSign className="w-3 h-3" />
                    Salary
                  </div>
                  <p className="text-green-400 text-sm font-medium">
                    {salaryDisplay || 'Not specified'}
                  </p>
                </div>

                {/* Source */}
                <div className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                    <Link2 className="w-3 h-3" />
                    Source
                  </div>
                  <p className="text-text-primary text-sm">
                    {source?.icon} {source?.name}
                  </p>
                </div>

                {/* Experience */}
                <div className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                    <User className="w-3 h-3" />
                    Level
                  </div>
                  <p className="text-text-primary text-sm capitalize">
                    {job.experienceLevel || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3 bg-bg-secondary rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Calendar className="w-3 h-3" />
                  Timeline
                </div>
                <div className="space-y-1 text-sm">
                  {job.createdAt && (
                    <p className="text-text-muted">
                      Saved: {format(new Date(job.createdAt), 'MMM d, yyyy')}
                    </p>
                  )}
                  {job.appliedAt && (
                    <p className="text-blue-400">
                      Applied: {format(new Date(job.appliedAt), 'MMM d, yyyy')} ({formatDistanceToNow(new Date(job.appliedAt), { addSuffix: true })})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-sm rounded-lg border border-blue-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {(job.contactPerson || job.contactEmail) && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">Contact</h3>
                <div className="p-3 bg-bg-secondary rounded-lg space-y-2">
                  {job.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-text-muted" />
                      <span className="text-text-primary text-sm">{job.contactPerson}</span>
                    </div>
                  )}
                  {job.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <a
                        href={`mailto:${job.contactEmail}`}
                        className="text-blue-400 text-sm hover:underline"
                      >
                        {job.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interview Dates */}
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-3">Interview Schedule</h3>
              <div className="space-y-2">
                {job.interviewDates && job.interviewDates.length > 0 ? (
                  job.interviewDates.map((date, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                    >
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 text-sm">
                        {format(new Date(date), 'MMM d, yyyy h:mm a')}
                      </span>
                      {new Date(date) > new Date() && (
                        <span className="text-xs text-amber-400/60">
                          ({formatDistanceToNow(new Date(date), { addSuffix: true })})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted text-sm">No interviews scheduled</p>
                )}

                {/* Add Interview */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="datetime-local"
                    value={newInterviewDate}
                    onChange={(e) => setNewInterviewDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleAddInterview}
                    disabled={!newInterviewDate}
                    className="px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            {job.notes && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">Notes</h3>
                <div className="p-3 bg-bg-secondary rounded-lg">
                  <p className="text-text-secondary text-sm whitespace-pre-wrap">{job.notes}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default JobDetailPanel
