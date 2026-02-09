import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, FileText, Eye, AlertCircle, CheckCircle, Loader2, Paperclip, Users, ChevronRight } from 'lucide-react'
import { useEmailService } from '../../../shared/hooks/useEmailService'
import { useEmailTemplates } from '../../../shared/hooks/useEmailTemplates'
import { useCV } from '../../../shared/hooks/useCV'

export function BulkEmailComposer({ isOpen, onClose, leads = [], onSuccess }) {
    const { templates, processTemplate } = useEmailTemplates()
    const { sendEmail } = useEmailService()
    const { cvFiles, fetchCvFiles } = useCV()

    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [selectedCvId, setSelectedCvId] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    // Sending State
    const [isSending, setIsSending] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 })
    const [results, setResults] = useState([]) // Array of { leadId, success, error? }

    // Load CVs when open
    useEffect(() => {
        if (isOpen) {
            fetchCvFiles().then(files => {
                const def = files.find(f => f.isDefault)
                if (def) setSelectedCvId(def.id)
            })
        }
    }, [isOpen, fetchCvFiles])

    // Apply template when selected (using first lead for preview)
    useEffect(() => {
        if (selectedTemplate && leads.length > 0) {
            // Preview with first lead to show example
            const processed = processTemplate(selectedTemplate, leads[0])
            setSubject(processed.subject)
            setBody(processed.body)
        }
    }, [selectedTemplate, leads, processTemplate])

    const handleSendBulk = async () => {
        if (leads.length === 0 || !subject || !body) return

        setIsSending(true)
        setProgress({ current: 0, total: leads.length, successes: 0, failures: 0 })
        setResults([])

        const newResults = []
        let successCount = 0
        let failureCount = 0

        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i]
            setProgress(prev => ({ ...prev, current: i + 1 }))

            // Re-process template for THIS specific lead to ensure variables are correct
            let finalSubject = subject;
            let finalBody = body;

            if (selectedTemplate) {
                const processed = processTemplate(selectedTemplate, lead)
                finalSubject = processed.subject
                finalBody = processed.body
            } else {
                // If manual, we should still try to basic replace if possible, 
                // but `processTemplate` requires a template object. 
                // If user manually typed {{name}}, we might need a helper, 
                // but for now assume manual = static or user knows what they are doing.
                // Ideally we pass a "dummy" template object with the current subject/body 
                // to `processTemplate` to handle variables even in manual mode.
                const dummyTemplate = { subject, body }
                const processed = processTemplate(dummyTemplate, lead)
                finalSubject = processed.subject
                finalBody = processed.body
            }

            const result = await sendEmail({
                to: lead.email,
                subject: finalSubject,
                body: finalBody,
                leadId: lead.id,
                templateId: selectedTemplate?.id,
                cvId: selectedCvId || undefined
            })

            if (result.success) {
                successCount++
            } else {
                failureCount++
            }

            newResults.push({ leadId: lead.id, name: lead.name, success: result.success, error: result.error })
            setResults([...newResults])

            // Small delay to prevent rate limiting if necessary, though backend handles it?
            // adding 500ms delay just in case
            await new Promise(r => setTimeout(r, 500))
        }

        setProgress({ current: leads.length, total: leads.length, successes: successCount, failures: failureCount })
        setIsSending(false)
    }

    const handleClose = () => {
        if (isSending) return // Prevent closing while sending
        setSelectedTemplate(null)
        setSubject('')
        setBody('')
        setResults([])
        setIsSending(false)
        onClose()
    }

    if (!isOpen) return null

    const isFinished = progress.total > 0 && progress.current === progress.total && !isSending

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
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                Bulk Email Composer
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                Sending to <span className="text-text-primary font-medium">{leads.length} recipients</span>
                            </p>
                        </div>
                        {!isSending && (
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">

                        {/* Progress View */}
                        {(isSending || isFinished) ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    {isSending ? (
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                                    ) : (
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                                    )}
                                    <h3 className="text-lg font-semibold text-text-primary">
                                        {isSending ? 'Sending Emails...' : 'Campaign Completed'}
                                    </h3>
                                    <p className="text-text-muted">
                                        {progress.current} / {progress.total} processed
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                                        <div className="text-2xl font-bold text-green-500">{progress.successes}</div>
                                        <div className="text-sm text-green-400">Sent</div>
                                    </div>
                                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                                        <div className="text-2xl font-bold text-red-500">{progress.failures}</div>
                                        <div className="text-sm text-red-400">Failed</div>
                                    </div>
                                </div>

                                {/* Log */}
                                <div className="max-h-[200px] overflow-y-auto bg-bg-secondary rounded-xl p-4 space-y-2">
                                    {results.map((res, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="text-text-secondary">{res.name}</span>
                                            {res.success ? (
                                                <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent</span>
                                            ) : (
                                                <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {isFinished && (
                                    <button
                                        onClick={() => {
                                            onSuccess?.()
                                            handleClose()
                                        }}
                                        className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                    >
                                        Close & Refresh
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
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
                                            {cvFiles.map(cv => (
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
                                        <label className="text-sm text-text-secondary">Message Template *</label>
                                        <div className="text-xs text-text-muted">
                                            Variables like {'{{name}}'} will be replaced for each lead.
                                        </div>
                                    </div>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none"
                                        placeholder="Write your message..."
                                    />
                                </div>

                                {/* Variable Help */}
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
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {!isSending && !isFinished && (
                        <div className="flex justify-between items-center p-6 border-t border-border">
                            <p className="text-xs text-text-muted">
                                Emails will be sent sequentially with a small delay.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendBulk}
                                    disabled={!subject || !body}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    Send {leads.length} Emails
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default BulkEmailComposer
