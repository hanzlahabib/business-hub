
import { useState } from 'react'
import { Plus, Trash2, Copy, Check, Pencil, Webhook, Phone, Mail, X, ChevronDown, ChevronRight, Code } from 'lucide-react'
import { useLeadTypes, LeadType } from '../hooks/useLeadTypes'
import { API_SERVER } from '../../../config/api'
import { toast } from 'sonner'

function LeadTypeForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<LeadType>
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    autoCallEnabled: initial?.autoCallEnabled ?? true,
    autoCallDelay: initial?.autoCallDelay ?? 30000,
    emailFollowUp: initial?.emailFollowUp ?? true,
    webhookSecret: initial?.webhookSecret || '',
    agentConfig: {
      agentName: initial?.agentConfig?.agentName || '',
      businessName: initial?.agentConfig?.businessName || '',
      businessWebsite: initial?.agentConfig?.businessWebsite || '',
      industry: initial?.agentConfig?.industry || '',
      systemPromptContext: initial?.agentConfig?.systemPromptContext || '',
      qualifyingQuestions: initial?.agentConfig?.qualifyingQuestions || [''],
    }
  })

  const updateQuestion = (idx: number, value: string) => {
    const qs = [...form.agentConfig.qualifyingQuestions]
    qs[idx] = value
    setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, qualifyingQuestions: qs } }))
  }

  const addQuestion = () => {
    setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, qualifyingQuestions: [...f.agentConfig.qualifyingQuestions, ''] } }))
  }

  const removeQuestion = (idx: number) => {
    const qs = form.agentConfig.qualifyingQuestions.filter((_, i) => i !== idx)
    setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, qualifyingQuestions: qs } }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      agentConfig: {
        ...form.agentConfig,
        qualifyingQuestions: form.agentConfig.qualifyingQuestions.filter(q => q.trim()),
      }
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Type Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. EV Charger Installer"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Description</label>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Internal description"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Agent Config */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-text-primary">AI Agent Configuration</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Agent Name</label>
            <input
              value={form.agentConfig.agentName}
              onChange={e => setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, agentName: e.target.value } }))}
              placeholder="Alex"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Business Name</label>
            <input
              value={form.agentConfig.businessName}
              onChange={e => setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, businessName: e.target.value } }))}
              placeholder="Henderson EV Solutions"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Business Website</label>
            <input
              value={form.agentConfig.businessWebsite}
              onChange={e => setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, businessWebsite: e.target.value } }))}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Industry</label>
            <input
              value={form.agentConfig.industry}
              onChange={e => setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, industry: e.target.value } }))}
              placeholder="EV Charging / Solar / Plumbing"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">System Prompt Context</label>
          <textarea
            value={form.agentConfig.systemPromptContext}
            onChange={e => setForm(f => ({ ...f, agentConfig: { ...f.agentConfig, systemPromptContext: e.target.value } }))}
            placeholder="Additional context injected into the AI agent's system prompt..."
            rows={3}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none resize-none"
          />
        </div>

        {/* Qualifying Questions */}
        <div>
          <label className="block text-xs text-text-muted mb-1">Qualifying Questions</label>
          <div className="space-y-2">
            {form.agentConfig.qualifyingQuestions.map((q, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={q}
                  onChange={e => updateQuestion(i, e.target.value)}
                  placeholder={`Question ${i + 1}`}
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
                />
                {form.agentConfig.qualifyingQuestions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300 p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="text-xs text-accent-primary hover:text-accent-primary/80">
              + Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-text-primary">Settings</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoCallEnabled}
              onChange={e => setForm(f => ({ ...f, autoCallEnabled: e.target.checked }))}
              className="rounded border-border"
            />
            <Phone className="w-4 h-4" />
            Auto-call enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.emailFollowUp}
              onChange={e => setForm(f => ({ ...f, emailFollowUp: e.target.checked }))}
              className="rounded border-border"
            />
            <Mail className="w-4 h-4" />
            Email follow-up
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Auto-call delay (seconds)</label>
            <input
              type="number"
              value={form.autoCallDelay / 1000}
              onChange={e => setForm(f => ({ ...f, autoCallDelay: Number(e.target.value) * 1000 }))}
              min={5}
              max={300}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Webhook Secret (optional)</label>
            <input
              value={form.webhookSecret}
              onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))}
              placeholder="Leave empty for global secret"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          {initial?.id ? 'Save Changes' : 'Create Type'}
        </button>
      </div>
    </form>
  )
}

function WebhookUrlDisplay({ typeId }: { typeId: string }) {
  const { getWebhookUrl } = useLeadTypes()
  const [webhookData, setWebhookData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const fetchUrl = async () => {
    const data = await getWebhookUrl(typeId)
    setWebhookData(data)
  }

  const copyUrl = () => {
    if (webhookData?.webhookUrl) {
      navigator.clipboard.writeText(webhookData.webhookUrl)
      setCopied(true)
      toast.success('Webhook URL copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!webhookData) {
    return (
      <button onClick={fetchUrl} className="text-xs text-accent-primary hover:underline flex items-center gap-1">
        <Webhook className="w-3 h-3" /> Show Webhook URL
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <code className="text-xs bg-bg-tertiary px-2 py-1 rounded border border-border text-text-muted flex-1 truncate">
        {webhookData.webhookUrl}
      </code>
      <button onClick={copyUrl} className="p-1 text-text-muted hover:text-text-primary">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

function WebhookCodeExample({ slug, secret }: { slug: string; secret?: string | null }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const code = `curl -X POST ${API_SERVER}/api/webhooks/leads/${slug} \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${secret || 'YOUR_WEBHOOK_SECRET'}" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+96812345678",
    "service": "EV Charger Installation",
    "message": "Interested in home charging setup",
    "source": "website"
  }'`

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button onClick={() => setShow(!show)} className="text-xs text-accent-primary hover:underline flex items-center gap-1">
        <Code className="w-3 h-3" />
        {show ? 'Hide' : 'Show'} Code Example
      </button>
      {show && (
        <div className="mt-2 relative group">
          <button
            onClick={copyCode}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-bg-tertiary/80 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <pre className="text-xs bg-bg-tertiary border border-border rounded-lg p-3 overflow-x-auto text-text-secondary font-mono leading-relaxed">
            {code}
          </pre>
        </div>
      )}
    </div>
  )
}

export function LeadTypeManager() {
  const { leadTypes, loading, createLeadType, updateLeadType, deleteLeadType } = useLeadTypes()
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<LeadType | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleCreate = async (data) => {
    try {
      await createLeadType(data)
      toast.success('Lead type created')
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create')
    }
  }

  const handleUpdate = async (data) => {
    if (!editingType) return
    try {
      await updateLeadType(editingType.id, data)
      toast.success('Lead type updated')
      setEditingType(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteLeadType(id)
    if (ok) toast.success('Lead type deleted')
    else toast.error('Failed to delete')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Lead Types</h3>
          <p className="text-sm text-text-muted">Configure different lead sources with unique webhook URLs and AI agent settings</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingType(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Type
        </button>
      </div>

      {/* Create Form */}
      {showForm && !editingType && (
        <div className="border border-accent-primary/30 rounded-xl p-4 bg-accent-primary/5">
          <LeadTypeForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* List */}
      {loading && leadTypes.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">Loading...</div>
      ) : leadTypes.length === 0 && !showForm ? (
        <div className="text-center py-12 border border-border rounded-xl border-dashed">
          <Webhook className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No lead types yet</p>
          <p className="text-xs text-text-muted mt-1">Create one to get a unique webhook URL for each business type</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leadTypes.map(type => (
            <div key={type.id} className="border border-border rounded-xl overflow-hidden bg-bg-secondary">
              {editingType?.id === type.id ? (
                <div className="p-4">
                  <LeadTypeForm initial={type} onSubmit={handleUpdate} onCancel={() => setEditingType(null)} />
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedId === type.id ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{type.name}</span>
                          <span className="px-2 py-0.5 bg-bg-tertiary text-text-muted rounded text-xs font-mono">/{type.slug}</span>
                          <span className="text-xs text-text-muted">{type._count?.leads || 0} leads</span>
                        </div>
                        {type.description && (
                          <p className="text-xs text-text-muted mt-0.5">{type.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {type.autoCallEnabled && <Phone className="w-4 h-4 text-green-400" />}
                      {type.emailFollowUp && <Mail className="w-4 h-4 text-blue-400" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingType(type) }}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(type.id) }}
                        className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedId === type.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-border space-y-3">
                      {/* Webhook URL */}
                      <div className="pt-3">
                        <label className="text-xs text-text-muted font-medium">Webhook URL</label>
                        <WebhookUrlDisplay typeId={type.id} />
                      </div>

                      {/* Code Example */}
                      <WebhookCodeExample slug={type.slug} secret={type.webhookSecret} />

                      {/* Agent Config Summary */}
                      {type.agentConfig && (
                        <div>
                          <label className="text-xs text-text-muted font-medium">Agent Config</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {type.agentConfig.agentName && (
                              <div className="text-xs"><span className="text-text-muted">Agent:</span> <span className="text-text-primary">{type.agentConfig.agentName}</span></div>
                            )}
                            {type.agentConfig.businessName && (
                              <div className="text-xs"><span className="text-text-muted">Business:</span> <span className="text-text-primary">{type.agentConfig.businessName}</span></div>
                            )}
                            {type.agentConfig.industry && (
                              <div className="text-xs"><span className="text-text-muted">Industry:</span> <span className="text-text-primary">{type.agentConfig.industry}</span></div>
                            )}
                            {(type.agentConfig.qualifyingQuestions?.length ?? 0) > 0 && (
                              <div className="text-xs"><span className="text-text-muted">Questions:</span> <span className="text-text-primary">{type.agentConfig.qualifyingQuestions?.length}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Settings Summary */}
                      <div className="flex gap-4 text-xs text-text-muted">
                        <span>Auto-call delay: {type.autoCallDelay / 1000}s</span>
                        <span>Auto-call: {type.autoCallEnabled ? 'On' : 'Off'}</span>
                        <span>Email follow-up: {type.emailFollowUp ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
