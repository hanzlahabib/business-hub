import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Briefcase, MapPin, DollarSign, Link2, Plus, Tag } from 'lucide-react'
import { JOB_SOURCES, EXPERIENCE_LEVELS, PRIORITY_LEVELS } from '../constants/pipelineStages'
import { LoadingSpinner } from '../../../components/ui/loading-spinner'
import { toast } from 'sonner'

const COMMON_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js',
  'Vue', 'Angular', 'Tailwind CSS', 'GraphQL', 'REST API',
  'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git'
]

export function AddJobModal({ isOpen, onClose, onSave, editJob = null }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: '',
    locationType: 'remote',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: '$',
    description: '',
    requirements: [],
    skills: [],
    experienceLevel: 'mid',
    source: 'linkedin',
    sourceUrl: '',
    contactPerson: '',
    contactEmail: '',
    priority: 'medium',
    deadline: '',
    notes: ''
  })

  const [newSkill, setNewSkill] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editJob) {
      setFormData({
        company: editJob.company || '',
        role: editJob.role || '',
        location: editJob.location || '',
        locationType: editJob.locationType || 'remote',
        salaryMin: editJob.salaryMin || '',
        salaryMax: editJob.salaryMax || '',
        salaryCurrency: editJob.salaryCurrency || '$',
        description: editJob.description || '',
        requirements: editJob.requirements || [],
        skills: editJob.skills || [],
        experienceLevel: editJob.experienceLevel || 'mid',
        source: editJob.source || 'linkedin',
        sourceUrl: editJob.sourceUrl || '',
        contactPerson: editJob.contactPerson || '',
        contactEmail: editJob.contactEmail || '',
        priority: editJob.priority || 'medium',
        deadline: editJob.deadline || '',
        notes: editJob.notes || ''
      })
    } else {
      setFormData({
        company: '',
        role: '',
        location: '',
        locationType: 'remote',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: '$',
        description: '',
        requirements: [],
        skills: [],
        experienceLevel: 'mid',
        source: 'linkedin',
        sourceUrl: '',
        contactPerson: '',
        contactEmail: '',
        priority: 'medium',
        deadline: '',
        notes: ''
      })
    }
  }, [editJob, isOpen])

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleAddSkill = useCallback(() => {
    const skill = newSkill.trim()
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))
      setNewSkill('')
    }
  }, [newSkill, formData.skills])

  const handleRemoveSkill = useCallback((skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }, [])

  const handleAddRequirement = useCallback(() => {
    const req = newRequirement.trim()
    if (req && !formData.requirements.includes(req)) {
      setFormData(prev => ({ ...prev, requirements: [...prev.requirements, req] }))
      setNewRequirement('')
    }
  }, [newRequirement, formData.requirements])

  const handleRemoveRequirement = useCallback((req) => {
    setFormData(prev => ({ ...prev, requirements: prev.requirements.filter(r => r !== req) }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave({
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null
      })
      toast.success(editJob ? 'Job updated successfully' : 'Job created successfully')
      onClose()
    } catch (error) {
      toast.error(`Failed to ${editJob ? 'update' : 'create'} job: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary">
              {editJob ? 'Edit Job' : 'Add New Job'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Company & Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Building2 className="w-4 h-4" />
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Vercel"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Briefcase className="w-4 h-4" />
                  Role *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <MapPin className="w-4 h-4" />
                  Location Type
                </label>
                <select
                  value={formData.locationType}
                  onChange={(e) => handleChange('locationType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Worldwide, US, Europe"
                />
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <DollarSign className="w-4 h-4" />
                Salary Range (Annual)
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={formData.salaryCurrency}
                  onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                  className="px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="$">$ USD</option>
                  <option value="€">€ EUR</option>
                  <option value="£">£ GBP</option>
                </select>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => handleChange('salaryMin', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="Min (e.g., 120000)"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => handleChange('salaryMax', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="Max (e.g., 180000)"
                />
              </div>
            </div>

            {/* Source & URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
                >
                  {JOB_SOURCES.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.icon} {source.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Link2 className="w-4 h-4" />
                  Job URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => handleChange('sourceUrl', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Experience & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.label} ({level.years} years)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {PRIORITY_LEVELS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleChange('priority', p.id)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${formData.priority === p.id
                        ? 'text-white'
                        : 'text-text-muted hover:text-text-secondary'
                        }`}
                      style={{
                        backgroundColor: formData.priority === p.id ? p.color + '40' : 'rgba(255,255,255,0.05)',
                        borderColor: formData.priority === p.id ? p.color : 'transparent',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <Tag className="w-4 h-4" />
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-lg flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Add skill..."
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Quick add common skills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_SKILLS.filter(s => !formData.skills.includes(s)).slice(0, 8).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))}
                    className="px-2 py-0.5 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-secondary rounded transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="Recruiter name"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Any additional notes about this job..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {editJob ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  editJob ? 'Save Changes' : 'Add Job'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AddJobModal
