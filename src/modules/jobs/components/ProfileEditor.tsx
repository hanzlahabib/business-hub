// @ts-nocheck
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Mail, Phone, Globe, Linkedin, Github,
  Briefcase, Code, Loader2, CheckCircle, AlertCircle, Plus
} from 'lucide-react'
import { ENDPOINTS } from '../../../config/api'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const stored = localStorage.getItem('auth_user')
    if (stored) { headers['x-user-id'] = JSON.parse(stored).id }
  } catch { }
  return headers
}

const EXPERIENCE_LEVELS = [
  { id: 'JUNIOR', label: 'Junior (0-2 years)' },
  { id: 'MID', label: 'Mid-Level (2-5 years)' },
  { id: 'MID_SENIOR', label: 'Mid-Senior (5-8 years)' },
  { id: 'SENIOR', label: 'Senior (8+ years)' },
  { id: 'STAFF', label: 'Staff/Principal (10+ years)' }
]

export function ProfileEditor({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    portfolioUrl: '',
    linkedInUrl: '',
    githubUrl: '',
    yearsExperience: 5,
    primarySkills: [],
    experienceLevel: 'MID_SENIOR',
    defaultCvId: null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<any>(null)
  const [newSkill, setNewSkill] = useState('')

  // Fetch profile
  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    }
  }, [isOpen])

  const fetchProfile = async () => {
    try {
      const res = await fetch(ENDPOINTS.USER_PROFILE, { headers: getAuthHeaders() })
      const data = await res.json()
      setProfile(data)
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(ENDPOINTS.USER_PROFILE, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' })
        setTimeout(() => onClose(), 1500)
      } else {
        setMessage({ type: 'error', text: 'Failed to save profile' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    const skill = newSkill.trim()
    if (skill && !profile.primarySkills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        primarySkills: [...prev.primarySkills, skill]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      primarySkills: prev.primarySkills.filter(s => s !== skillToRemove)
    }))
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
          className="w-full max-w-2xl max-h-[85vh] bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
                  <p className="text-sm text-text-muted">Update your details for email templates</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Online Presence
                  </h3>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Portfolio URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="url"
                        value={profile.portfolioUrl}
                        onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">LinkedIn URL</label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="url"
                          value={profile.linkedInUrl}
                          onChange={(e) => handleChange('linkedInUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/you"
                          className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">GitHub URL</label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="url"
                          value={profile.githubUrl}
                          onChange={(e) => handleChange('githubUrl', e.target.value)}
                          placeholder="https://github.com/you"
                          className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experience
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={profile.yearsExperience}
                        onChange={(e) => handleChange('yearsExperience', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Experience Level</label>
                      <select
                        value={profile.experienceLevel}
                        onChange={(e) => handleChange('experienceLevel', e.target.value)}
                        className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-green-500"
                      >
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level.id} value={level.id} className="bg-bg-primary">
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Primary Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.primarySkills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-400 transition-colors"
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
                      placeholder="Add a skill (e.g., React, TypeScript)"
                      className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={handleAddSkill}
                      disabled={!newSkill.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${message.type === 'success'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                    }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {message.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ProfileEditor
