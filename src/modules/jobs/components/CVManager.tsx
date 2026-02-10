import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, FileText, Link2, Star, Trash2, Loader2,
  CheckCircle, AlertCircle, Cloud, HardDrive, ExternalLink
} from 'lucide-react'
import { API_SERVER } from '../../../config/api'

export function CVManager({ isOpen, onClose }) {
  const [cvFiles, setCvFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [linkForm, setLinkForm] = useState({ name: '', cloudUrl: '' })
  const [message, setMessage] = useState<any>(null)
  const fileInputRef = useRef<any>(null)

  // Fetch CVs
  useEffect(() => {
    if (isOpen) {
      fetchCvFiles()
    }
  }, [isOpen])

  const fetchCvFiles = async () => {
    try {
      const res = await fetch(`${API_SERVER}/api/cvs`)
      const data = await res.json()
      setCvFiles(data)
    } catch {
      setMessage({ type: 'error', text: 'Failed to load CVs' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('cv', file)
      formData.append('name', file.name.replace('.pdf', ''))
      formData.append('isDefault', cvFiles.length === 0 ? 'true' : 'false')

      const res = await fetch(`${API_SERVER}/api/upload/cv`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'CV uploaded successfully!' })
        fetchCvFiles()
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload CV' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddLink = async () => {
    if (!linkForm.name || !linkForm.cloudUrl) {
      setMessage({ type: 'error', text: 'Please fill in both fields' })
      return
    }

    setAddingLink(true)
    setMessage(null)

    try {
      const res = await fetch(`${API_SERVER}/api/cvs/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...linkForm,
          isDefault: cvFiles.length === 0
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Cloud link added!' })
        setLinkForm({ name: '', cloudUrl: '' })
        fetchCvFiles()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add link' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add cloud link' })
    } finally {
      setAddingLink(false)
    }
  }

  const handleSetDefault = async (cvId) => {
    try {
      await fetch(`${API_SERVER}/api/cvs/${cvId}/default`, {
        method: 'PATCH'
      })
      fetchCvFiles()
    } catch {
      setMessage({ type: 'error', text: 'Failed to set default' })
    }
  }

  const handleDelete = async (cvId) => {
    if (!confirm('Are you sure you want to delete this CV?')) return

    try {
      await fetch(`${API_SERVER}/api/cvs/${cvId}`, {
        method: 'DELETE'
      })
      setMessage({ type: 'success', text: 'CV deleted' })
      fetchCvFiles()
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete CV' })
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">CV Manager</h2>
                  <p className="text-sm text-text-muted">Upload and manage your CVs</p>
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
            {/* Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload CV (PDF)
              </h3>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className={`flex items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    uploading
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-border-hover hover:border-blue-500/50 hover:bg-bg-secondary'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                      <span className="text-blue-400">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-6 h-6 text-text-muted" />
                      <span className="text-text-secondary">Click to upload PDF (max 5MB)</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Cloud Link Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Add Cloud Link (Google Drive, Dropbox, etc.)
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CV Name"
                  value={linkForm.name}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                />
                <input
                  type="url"
                  placeholder="Cloud URL"
                  value={linkForm.cloudUrl}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, cloudUrl: e.target.value }))}
                  className="flex-[2] px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddLink}
                  disabled={addingLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {addingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success'
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

            {/* CV List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary">Your CVs</h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : cvFiles.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  No CVs uploaded yet. Upload your first CV above.
                </div>
              ) : (
                <div className="space-y-2">
                  {cvFiles.map((cv) => (
                    <div
                      key={cv.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                        cv.isDefault
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-bg-secondary border-border hover:bg-bg-tertiary'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        cv.type === 'uploaded' ? 'bg-blue-500/20' : 'bg-cyan-500/20'
                      }`}>
                        {cv.type === 'uploaded' ? (
                          <FileText className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Cloud className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-text-primary font-medium truncate">{cv.name}</p>
                          {cv.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-blue-500/30 text-blue-300 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">
                          {cv.type === 'uploaded' ? (
                            <>Uploaded {formatFileSize(cv.size)}</>
                          ) : (
                            <>Cloud link</>
                          )}
                          {' • '}
                          {new Date(cv.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {cv.cloudUrl && (
                          <a
                            href={cv.cloudUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {!cv.isDefault && (
                          <button
                            onClick={() => handleSetDefault(cv.id)}
                            className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-yellow-400 transition-colors"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(cv.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CVManager
