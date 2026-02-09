import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, User, Mail, Phone, Globe, Tag, FileText, Briefcase, MapPin } from 'lucide-react'
import { Select } from '../../../components/ui/select'
import { LoadingSpinner } from '../../../components/ui/loading-spinner'
import { toast } from 'sonner'

const industries = [
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'salon', label: 'Salon/Spa', emoji: '💇' },
  { value: 'gym', label: 'Gym/Fitness', emoji: '🏋️' },
  { value: 'realestate', label: 'Real Estate', emoji: '🏠' },
  { value: 'retail', label: 'Retail', emoji: '🛍️' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'technology', label: 'Technology', emoji: '💻' },
  { value: 'other', label: 'Other', emoji: '📌' }
]

const sources = [
  { value: 'google', label: 'Google Search', emoji: '🔍' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'upwork', label: 'Upwork', emoji: '💚' },
  { value: 'referral', label: 'Referral', emoji: '🤝' },
  { value: 'cold-call', label: 'Cold Call', emoji: '📞' },
  { value: 'manual', label: 'Manual', emoji: '✏️' }
]

const websiteIssues = [
  { value: 'outdated', label: 'Outdated Design' },
  { value: 'slow', label: 'Slow Loading' },
  { value: 'no-mobile', label: 'Not Mobile Friendly' },
  { value: 'no-seo', label: 'Poor SEO' },
  { value: 'no-booking', label: 'No Booking System' },
  { value: 'broken', label: 'Broken Links/Elements' },
  { value: 'no-ssl', label: 'No SSL/HTTPS' }
]

export function AddLeadModal({ isOpen, onClose, onSave, editLead = null }) {
  const [formData, setFormData] = useState(editLead || {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    source: 'manual',
    notes: '',
    websiteIssues: [],
    tags: []
  })

  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleWebsiteIssue = (issue) => {
    setFormData(prev => ({
      ...prev,
      websiteIssues: prev.websiteIssues.includes(issue)
        ? prev.websiteIssues.filter(i => i !== issue)
        : [...prev.websiteIssues, issue]
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
      toast.success(editLead ? 'Lead updated successfully' : 'Lead created successfully')
      onClose()
    } catch (error) {
      toast.error(`Failed to ${editLead ? 'update' : 'create'} lead: ${error.message}`)
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
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-primary border border-border rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary">
              {editLead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Building2 className="w-4 h-4" />
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <User className="w-4 h-4" />
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Globe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                placeholder="https://company.com"
              />
            </div>

            {/* Industry & Source */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Industry"
                icon={Briefcase}
                value={formData.industry}
                onChange={(val) => handleChange('industry', val)}
                placeholder="Select industry"
                options={industries}
              />

              <Select
                label="Source"
                icon={MapPin}
                value={formData.source}
                onChange={(val) => handleChange('source', val)}
                options={sources}
              />
            </div>

            {/* Website Issues */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">Website Issues</label>
              <div className="flex flex-wrap gap-2">
                {websiteIssues.map(issue => (
                  <button
                    key={issue.value}
                    type="button"
                    onClick={() => toggleWebsiteIssue(issue.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${formData.websiteIssues.includes(issue.value)
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-bg-secondary text-text-muted border border-border hover:bg-bg-tertiary'
                      }`}
                  >
                    {issue.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover text-sm"
                  placeholder="Add tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-bg-tertiary rounded-lg text-text-secondary hover:bg-bg-tertiary/80 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-text-primary"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <FileText className="w-4 h-4" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none"
                placeholder="Additional notes about this lead..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {editLead ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  editLead ? 'Save Changes' : 'Add Lead'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AddLeadModal
