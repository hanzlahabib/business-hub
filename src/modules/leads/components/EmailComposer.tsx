import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, FileText, Eye, AlertCircle, CheckCircle, Loader2, Paperclip } from 'lucide-react'
import { useEmailService } from '../../../shared/hooks/useEmailService'
import { useEmailTemplates } from '../../../shared/hooks/useEmailTemplates'
import { useCV } from '../../../shared/hooks/useCV'

export function EmailComposer({ isOpen, onClose, lead, onSuccess }) {
  const { templates, processTemplate } = useEmailTemplates()
  const { sendEmail, sending, error: sendError } = useEmailService()
  const { cvFiles, fetchCvFiles, getDefaultCv } = useCV()

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [selectedCvId, setSelectedCvId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)

  // Load CVs when open
  useEffect(() => {
    if (isOpen) {
      fetchCvFiles().then(files => {
        const def = files.find(f => f.isDefault)
        if (def) setSelectedCvId(def.id)
      })
    }
  }, [isOpen, fetchCvFiles])

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate && lead) {
      const processed = processTemplate(selectedTemplate, lead)
      setSubject(processed.subject)
      setBody(processed.body)
    }
  }, [selectedTemplate, lead, processTemplate])

  const handleSend = async () => {
    if (!lead?.email || !subject || !body) return

    const result = await sendEmail({
      to: lead.email,
      subject,
      body,
      leadId: lead.id,
      templateId: selectedTemplate?.id,
      cvId: selectedCvId || undefined
    })

    setSendResult(result)

    if (result.success) {
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1500)
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setSubject('')
    setBody('')
    setShowPreview(false)
    setSendResult(null)
    onClose()
  }

  if (!isOpen || !lead) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-bg-primary border border-border rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Compose Email</h2>
              <p className="text-sm text-text-muted mt-1">
                To: {lead.contactPerson || lead.name} &lt;{lead.email}&gt;
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Template Selection */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <FileText className="w-4 h-4" />
                  Use Template
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value)
                    setSelectedTemplate(template || null)
                  }}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-border-hover"
                >
                  <option value="">No template (compose manually)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* CV Attachment */}
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Paperclip className="w-4 h-4" />
                  Attach CV / Document
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-border-hover"
                >
                  <option value="">No attachment</option>
                  {Array.isArray(cvFiles) && cvFiles.map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} {cv.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                placeholder="Email subject..."
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-secondary">Message *</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Eye className="w-3 h-3" />
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>

              {showPreview ? (
                <div className="w-full min-h-[200px] px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary whitespace-pre-wrap">
                  {body || <span className="text-text-muted">No content</span>}
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none"
                  placeholder="Write your message..."
                />
              )}
            </div>

            {/* Variable Help */}
            {selectedTemplate && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-400 mb-1">Available variables:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{company}}', '{{contactPerson}}', '{{email}}', '{{industry}}', '{{website}}'].map(v => (
                    <code key={v} className="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300">
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {sendError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{sendError}</p>
              </div>
            )}

            {/* Success */}
            {sendResult?.success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">Email sent successfully!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-border">
            <p className="text-xs text-text-muted">
              Email will be sent via configured SMTP provider
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject || !body || sendResult?.success}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmailComposer
