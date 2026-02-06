import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Mail,
  Linkedin,
  ClipboardList,
  File,
  Tag,
  Folder,
  Hash
} from 'lucide-react'

const categories = [
  { value: 'linkedin', label: 'LinkedIn Post', icon: Linkedin, color: 'from-blue-500 to-cyan-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'from-red-500 to-orange-500' },
  { value: 'proposal', label: 'Proposal', icon: ClipboardList, color: 'from-green-500 to-emerald-500' },
  { value: 'document', label: 'Document', icon: FileText, color: 'from-amber-500 to-yellow-500' },
  { value: 'custom', label: 'Custom', icon: File, color: 'from-purple-500 to-pink-500' }
]

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

export function AddTemplateModal({
  isOpen,
  onClose,
  onSave,
  editTemplate = null,
  folders = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'linkedin',
    status: 'draft',
    description: '',
    subject: '',
    rawMarkdown: '',
    icon: 'file-text',
    folderId: null,
    tags: []
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (editTemplate) {
      setFormData({
        name: editTemplate.name || '',
        category: editTemplate.category || 'linkedin',
        status: editTemplate.status || 'draft',
        description: editTemplate.description || '',
        subject: editTemplate.subject || '',
        rawMarkdown: editTemplate.rawMarkdown || '',
        icon: editTemplate.icon || 'file-text',
        folderId: editTemplate.folderId || null,
        tags: editTemplate.tags || []
      })
    } else {
      setFormData({
        name: '',
        category: 'linkedin',
        status: 'draft',
        description: '',
        subject: '',
        rawMarkdown: '',
        icon: 'file-text',
        folderId: null,
        tags: []
      })
    }
    setTagInput('')
  }, [editTemplate, isOpen])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  // Extract variables from markdown
  const detectedVariables = useMemo(() => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = formData.rawMarkdown.match(regex) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }, [formData.rawMarkdown])

  // Convert markdown to basic block structure
  const convertToBlocks = (markdown) => {
    const lines = markdown.split('\n')
    const blocks = []

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      const blockId = `b${index + 1}`

      if (trimmed.startsWith('# ')) {
        blocks.push({ id: blockId, type: 'heading', level: 1, text: trimmed.slice(2) })
      } else if (trimmed.startsWith('## ')) {
        blocks.push({ id: blockId, type: 'heading', level: 2, text: trimmed.slice(3) })
      } else if (trimmed.startsWith('### ')) {
        blocks.push({ id: blockId, type: 'heading', level: 3, text: trimmed.slice(4) })
      } else if (trimmed === '---') {
        blocks.push({ id: blockId, type: 'divider' })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Find consecutive list items
        const existingList = blocks.find(b => b.type === 'list' && b.style === 'bullet')
        if (existingList && blocks[blocks.length - 1] === existingList) {
          existingList.items.push(trimmed.slice(2))
        } else {
          blocks.push({ id: blockId, type: 'list', style: 'bullet', items: [trimmed.slice(2)] })
        }
      } else if (/^\d+\.\s/.test(trimmed)) {
        const existingList = blocks.find(b => b.type === 'list' && b.style === 'numbered')
        if (existingList && blocks[blocks.length - 1] === existingList) {
          existingList.items.push(trimmed.replace(/^\d+\.\s/, ''))
        } else {
          blocks.push({ id: blockId, type: 'list', style: 'numbered', items: [trimmed.replace(/^\d+\.\s/, '')] })
        }
      } else {
        blocks.push({ id: blockId, type: 'paragraph', text: trimmed })
      }
    })

    return blocks.length > 0 ? blocks : [{ id: 'b1', type: 'paragraph', text: '' }]
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const templateData = {
      ...formData,
      variables: detectedVariables,
      content: {
        type: 'doc',
        blocks: convertToBlocks(formData.rawMarkdown)
      }
    }

    if (editTemplate) {
      onSave({ ...templateData, id: editTemplate.id })
    } else {
      onSave(templateData)
    }
    onClose()
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
              {editTemplate ? 'Edit Template' : 'Create New Template'}
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
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <FileText className="w-4 h-4" />
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                placeholder="e.g., LinkedIn Engagement Post"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">Category *</label>
              <div className="grid grid-cols-5 gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon
                  const isSelected = formData.category === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleChange('category', cat.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${cat.color} border-border-hover`
                          : 'bg-bg-secondary border-border hover:bg-bg-tertiary'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-text-secondary'}`} />
                      <span className={`text-xs ${isSelected ? 'text-white' : 'text-text-muted'}`}>
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status and Folder */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-border-hover"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                  <Folder className="w-4 h-4" />
                  Folder
                </label>
                <select
                  value={formData.folderId || ''}
                  onChange={(e) => handleChange('folderId', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-border-hover"
                >
                  <option value="">No folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject (for email) */}
            {formData.category === 'email' && (
              <div>
                <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                  <Mail className="w-4 h-4" />
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                  placeholder="e.g., Quick question about {{company}}"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                placeholder="Brief description of the template"
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">
                Content (Use {'{{variable}}'} for placeholders)
              </label>
              <textarea
                value={formData.rawMarkdown}
                onChange={(e) => handleChange('rawMarkdown', e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none font-mono text-sm"
                placeholder={`Hi {{name}},

I noticed {{observation}} and wanted to reach out...

Best,
{{signature}}`}
              />
            </div>

            {/* Detected Variables */}
            {detectedVariables.length > 0 && (
              <div className="p-3 bg-bg-secondary rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                  <Hash className="w-4 h-4" />
                  Detected Variables ({detectedVariables.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.map(v => (
                    <span
                      key={v}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                      className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white ml-1"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
              >
                {editTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AddTemplateModal
