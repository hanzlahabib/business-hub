import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useLeadTypes } from '../hooks/useLeadTypes'

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'manual', label: 'Manual' },
  { value: 'csv-import', label: 'CSV Import' },
]

interface ToggleField {
  enabled: boolean
  value: string
}

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onSave: (updates: Record<string, any>) => void
}

export function BulkEditModal({ isOpen, onClose, selectedCount, onSave }: BulkEditModalProps) {
  const { leadTypes } = useLeadTypes()

  const [fields, setFields] = useState<Record<string, ToggleField>>({
    typeId: { enabled: false, value: '' },
    status: { enabled: false, value: '' },
    source: { enabled: false, value: '' },
    industry: { enabled: false, value: '' },
    company: { enabled: false, value: '' },
  })

  const toggleField = (key: string) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }))
  }

  const setFieldValue = (key: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }))
  }

  const handleSave = () => {
    const updates: Record<string, any> = {}
    Object.entries(fields).forEach(([key, field]) => {
      if (field.enabled && field.value) {
        updates[key] = field.value
      }
    })
    if (Object.keys(updates).length === 0) return
    onSave(updates)
  }

  const enabledCount = Object.values(fields).filter(f => f.enabled && f.value).length

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-bg-primary border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Bulk Edit</h2>
                  <p className="text-sm text-text-muted mt-0.5">{selectedCount} leads selected</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-text-muted">Toggle fields to include in the update. Only enabled fields will be changed.</p>

                {/* Lead Type */}
                <FieldRow
                  label="Lead Type"
                  enabled={fields.typeId.enabled}
                  onToggle={() => toggleField('typeId')}
                >
                  <select
                    value={fields.typeId.value}
                    onChange={e => setFieldValue('typeId', e.target.value)}
                    disabled={!fields.typeId.enabled}
                    className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option value="">Select type...</option>
                    {leadTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </FieldRow>

                {/* Status */}
                <FieldRow
                  label="Status"
                  enabled={fields.status.enabled}
                  onToggle={() => toggleField('status')}
                >
                  <select
                    value={fields.status.value}
                    onChange={e => setFieldValue('status', e.target.value)}
                    disabled={!fields.status.enabled}
                    className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option value="">Select status...</option>
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FieldRow>

                {/* Source */}
                <FieldRow
                  label="Source"
                  enabled={fields.source.enabled}
                  onToggle={() => toggleField('source')}
                >
                  <select
                    value={fields.source.value}
                    onChange={e => setFieldValue('source', e.target.value)}
                    disabled={!fields.source.enabled}
                    className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  >
                    <option value="">Select source...</option>
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FieldRow>

                {/* Industry */}
                <FieldRow
                  label="Industry"
                  enabled={fields.industry.enabled}
                  onToggle={() => toggleField('industry')}
                >
                  <input
                    type="text"
                    value={fields.industry.value}
                    onChange={e => setFieldValue('industry', e.target.value)}
                    disabled={!fields.industry.enabled}
                    placeholder="e.g. restaurant, salon, retail..."
                    className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </FieldRow>

                {/* Company */}
                <FieldRow
                  label="Company"
                  enabled={fields.company.enabled}
                  onToggle={() => toggleField('company')}
                >
                  <input
                    type="text"
                    value={fields.company.value}
                    onChange={e => setFieldValue('company', e.target.value)}
                    disabled={!fields.company.enabled}
                    placeholder="Company name..."
                    className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </FieldRow>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-secondary/50">
                <span className="text-xs text-text-muted">
                  {enabledCount} field{enabledCount !== 1 ? 's' : ''} will be updated
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={enabledCount === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Update {selectedCount} Leads
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FieldRow({ label, enabled, onToggle, children }: {
  label: string
  enabled: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${enabled ? 'border-accent-primary/30 bg-accent-primary/5' : 'border-border bg-bg-secondary/30'}`}>
      <button
        onClick={onToggle}
        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${enabled ? 'bg-accent-primary border-accent-primary' : 'border-border hover:border-text-muted'}`}
      >
        {enabled && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-text-primary mb-1.5 block cursor-pointer" onClick={onToggle}>
          {label}
        </label>
        {children}
      </div>
    </div>
  )
}

export default BulkEditModal
