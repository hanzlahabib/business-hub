import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Edit, Trash2, FileText, Eye, Save } from 'lucide-react'
import { useEmailTemplates } from '../../../shared/hooks/useEmailTemplates'

const categories = [
  { value: 'initial', label: 'Initial Outreach', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'followup', label: 'Follow-up', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'proposal', label: 'Proposal', color: 'bg-green-500/20 text-green-300' },
  { value: 'closing', label: 'Closing', color: 'bg-amber-500/20 text-amber-300' }
]

function TemplateCard({ template, onEdit, onDelete }) {
  const category = categories.find(c => c.value === template.category)

  return (
    <div className="p-4 bg-bg-secondary border border-border rounded-xl hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-text-primary">{template.name}</h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${category?.color || 'bg-gray-500/20 text-gray-300'}`}>
            {category?.label || template.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-2">
        Subject: {template.subject}
      </p>

      <p className="text-xs text-text-muted line-clamp-2">
        {template.body}
      </p>

      {template.variables && template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {template.variables.map(v => (
            <span key={v} className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px] text-text-muted">
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateEditor({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState(template || {
    name: '',
    subject: '',
    body: '',
    category: 'initial',
    variables: []
  })
  const [showPreview, setShowPreview] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Auto-detect variables
  const detectVariables = (text) => {
    const matches = text.match(/{{(\w+)}}/g) || []
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
  }

  const handleBodyChange = (value) => {
    handleChange('body', value)
    const vars = detectVariables(value + formData.subject)
    handleChange('variables', vars)
  }

  const handleSubjectChange = (value) => {
    handleChange('subject', value)
    const vars = detectVariables(value + formData.body)
    handleChange('variables', vars)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Template Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
            placeholder="e.g., Website Audit Offer"
          />
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Category</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-border-hover"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-text-secondary mb-2 block">Subject Line *</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
          placeholder="Quick question about {{company}}'s website"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-text-secondary">Email Body *</label>
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
            {formData.body || <span className="text-text-muted">No content</span>}
          </div>
        ) : (
          <textarea
            value={formData.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none font-mono text-sm"
            placeholder="Hi {{contactPerson}},&#10;&#10;I noticed {{company}}..."
          />
        )}
      </div>

      {/* Variables */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400 mb-2">
          Detected variables (auto-filled from lead data):
        </p>
        <div className="flex flex-wrap gap-2">
          {formData.variables.length > 0 ? (
            formData.variables.map(v => (
              <code key={v} className="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300">
                {`{{${v}}}`}
              </code>
            ))
          ) : (
            <span className="text-xs text-blue-300/50">No variables detected</span>
          )}
        </div>
        <p className="text-[10px] text-blue-400/50 mt-2">
          Available: company, contactPerson, email, industry, website
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          disabled={!formData.name || !formData.subject || !formData.body}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save Template
        </button>
      </div>
    </div>
  )
}

export function TemplateManager({ isOpen, onClose }) {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useEmailTemplates()
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleSave = async (formData) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, formData)
    } else {
      await createTemplate(formData)
    }
    setEditingTemplate(null)
    setIsCreating(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id)
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
          className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-bg-primary border border-border rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-text-primary">Email Templates</h2>
            </div>
            <div className="flex items-center gap-2">
              {!isCreating && !editingTemplate && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isCreating || editingTemplate ? (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSave}
                onCancel={() => {
                  setEditingTemplate(null)
                  setIsCreating(false)
                }}
              />
            ) : loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No templates yet</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-3 text-blue-400 hover:text-blue-300"
                >
                  Create your first template
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={setEditingTemplate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TemplateManager
