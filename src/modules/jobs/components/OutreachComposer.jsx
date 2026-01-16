import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { X, Send, FileText, User, Building2, Mail, ChevronDown, Check, Loader2, Eye, Paperclip, FileIcon } from 'lucide-react'
import { JSON_SERVER, API_SERVER } from '../../../config/api'

export function OutreachComposer({ isOpen, onClose, job }) {
  const [templates, setTemplates] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [cvFiles, setCvFiles] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedCvId, setSelectedCvId] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCvSelector, setShowCvSelector] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  })

  // Fetch templates, user profile, and CV files
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, profileRes, cvsRes] = await Promise.all([
          fetch(`${JSON_SERVER}/jobTemplates`),
          fetch(`${JSON_SERVER}/userProfile`),
          fetch(`${API_SERVER}/api/cvs`)
        ])
        const templatesData = await templatesRes.json()
        const profileData = await profileRes.json()
        const cvsData = await cvsRes.json()

        setTemplates(templatesData)
        setUserProfile(profileData)
        setCvFiles(cvsData)

        // Set default CV if available
        const defaultCv = cvsData.find(cv => cv.isDefault)
        if (defaultCv) {
          setSelectedCvId(defaultCv.id)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) {
      fetchData()
      setSendResult(null)
    }
  }, [isOpen])

  // Set initial form data from job
  useEffect(() => {
    if (job) {
      setFormData(prev => ({
        ...prev,
        to: job.contactEmail || ''
      }))
    }
  }, [job])

  // Process template variables
  const processTemplate = (template) => {
    if (!template || !job) return { subject: '', body: '' }

    const variables = {
      // Job variables
      role: job.role || '',
      company: job.company || '',
      contactPerson: job.contactPerson || 'Hiring Manager',
      skills: job.skills?.join(', ') || 'React, TypeScript, Node.js',

      // User profile variables
      yourName: userProfile?.name || 'Your Name',
      experienceLevel: userProfile?.experienceLevel === 'MID_SENIOR' ? 'Mid-Senior' : userProfile?.experienceLevel || 'Senior',
      yearsExperience: userProfile?.yearsExperience || '5',
      portfolioUrl: userProfile?.portfolioUrl || 'https://yourportfolio.com',
      linkedInUrl: userProfile?.linkedInUrl || 'https://linkedin.com/in/you',
      githubUrl: userProfile?.githubUrl || 'https://github.com/you',
      skillsList: userProfile?.primarySkills?.map(s => `• ${s}`).join('\n') || '• React\n• TypeScript\n• Node.js',

      // Dynamic variables
      applicationDate: job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : new Date().toLocaleDateString(),
      customParagraph: '[Add your custom paragraph here]',
      companyReason: '[What excites you about this company]',
      interviewerName: job.contactPerson || 'Hiring Manager',
      discussedTopic: '[Topics from your interview]',
      specificPoint: '[Specific point from your conversation]'
    }

    let subject = template.subject
    let body = template.body

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    return { subject, body }
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setShowTemplates(false)

    const processed = processTemplate(template)
    setFormData(prev => ({
      ...prev,
      subject: processed.subject,
      body: processed.body
    }))
  }

  const selectedCv = cvFiles.find(cv => cv.id === selectedCvId)

  const handleSend = async () => {
    if (!formData.to || !formData.subject || !formData.body) {
      setSendResult({ success: false, message: 'Please fill in all fields' })
      return
    }

    setSending(true)
    setSendResult(null)

    try {
      const res = await fetch(`${API_SERVER}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          cvId: selectedCvId || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        setSendResult({ success: true, message: 'Email sent successfully!' })

        // Save to outreach history
        try {
          await fetch(`${JSON_SERVER}/jobOutreachHistory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              jobId: job?.id,
              templateId: selectedTemplate?.id,
              cvId: selectedCvId || null,
              to: formData.to,
              subject: formData.subject,
              body: formData.body,
              status: 'sent',
              sentAt: new Date().toISOString()
            })
          })
        } catch (err) {
          console.error('Failed to save outreach history:', err)
        }

        // Close after delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setSendResult({ success: false, message: data.message || 'Failed to send email' })
      }
    } catch {
      setSendResult({ success: false, message: 'Failed to connect to email service. Make sure the server is running.' })
    } finally {
      setSending(false)
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
          className="w-full max-w-2xl max-h-[90vh] bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Send Email</h2>
                  {job && (
                    <p className="text-sm text-white/50">
                      {job.role} at {job.company}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Template Selector */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <FileText className="w-4 h-4" />
                    Email Template
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <span className={selectedTemplate ? 'text-white' : 'text-white/40'}>
                      {selectedTemplate ? selectedTemplate.name : 'Select a template...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                  </button>

                  {showTemplates && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{template.name}</p>
                              <p className="text-xs text-white/40 mt-0.5">{template.category}</p>
                            </div>
                            {selectedTemplate?.id === template.id && (
                              <Check className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* CV Attachment Selector */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <Paperclip className="w-4 h-4" />
                    Attach CV
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCvSelector(!showCvSelector)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <span className={selectedCv ? 'text-white' : 'text-white/40'}>
                      {selectedCv ? (
                        <span className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-blue-400" />
                          {selectedCv.name}
                        </span>
                      ) : (
                        'No CV attached'
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showCvSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {showCvSelector && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedCvId(null)
                          setShowCvSelector(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">No attachment</span>
                          {!selectedCvId && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                      </button>
                      {cvFiles.length === 0 ? (
                        <div className="px-4 py-3 text-white/40 text-sm">
                          No CVs uploaded. Use CV Manager to add CVs.
                        </div>
                      ) : (
                        cvFiles.map(cv => (
                          <button
                            key={cv.id}
                            onClick={() => {
                              setSelectedCvId(cv.id)
                              setShowCvSelector(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileIcon className="w-4 h-4 text-blue-400" />
                                <div>
                                  <p className="text-white font-medium">{cv.name}</p>
                                  <p className="text-xs text-white/40 mt-0.5">
                                    {cv.type === 'uploaded' ? 'Local file' : 'Cloud link'}
                                    {cv.isDefault && ' • Default'}
                                  </p>
                                </div>
                              </div>
                              {selectedCvId === cv.id && (
                                <Check className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* To Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <Mail className="w-4 h-4" />
                    To
                  </label>
                  <input
                    type="email"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
                    placeholder="recipient@company.com"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
                    placeholder="Email subject..."
                  />
                </div>

                {/* Body Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/60">Message</label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="w-3 h-3" />
                      {showPreview ? 'Edit' : 'Preview'}
                    </button>
                  </div>

                  {showPreview ? (
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg min-h-[200px]">
                      <div className="text-white whitespace-pre-wrap">{formData.body}</div>
                    </div>
                  ) : (
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      rows={10}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Write your message..."
                    />
                  )}
                </div>

                {/* Result Message */}
                {sendResult && (
                  <div className={`p-4 rounded-lg ${
                    sendResult.success
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {sendResult.message}
                  </div>
                )}

                {/* User Profile Warning */}
                {(!userProfile?.name || !userProfile?.email) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
                    <p className="font-medium">Complete your profile for better emails</p>
                    <p className="text-xs text-amber-300/70 mt-1">
                      Update your user profile in the database to auto-fill your name, portfolio, and skills.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !formData.to || !formData.subject || !formData.body}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OutreachComposer
