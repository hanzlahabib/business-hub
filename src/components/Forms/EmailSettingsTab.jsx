import { useState, useEffect, useCallback } from 'react'
import { Mail, Server, Key, AlertCircle, CheckCircle, Loader2, TestTube } from 'lucide-react'

const JSON_SERVER = 'http://localhost:3001'
const API_SERVER = 'http://localhost:3002'

const providers = [
  { id: 'gmail', name: 'Gmail', description: 'Use Google SMTP with App Password' },
  { id: 'sendgrid', name: 'SendGrid', description: 'Professional email delivery service' },
  { id: 'ses', name: 'Amazon SES', description: 'AWS Simple Email Service' },
  { id: 'resend', name: 'Resend', description: 'Modern email API for developers' },
  { id: 'custom', name: 'Custom SMTP', description: 'Your own SMTP server' }
]

export function EmailSettingsTab() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${JSON_SERVER}/emailSettings`)
        const data = await res.json()
        setSettings(data)
      } catch (error) {
        console.error('Failed to fetch email settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleProviderChange = (provider) => {
    setSettings(prev => ({ ...prev, provider }))
    setTestResult(null)
  }

  const handleFieldChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleTopLevelChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${JSON_SERVER}/emailSettings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      setTestResult({ success: true, message: 'Settings saved!' })
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Save first
      await fetch(`${JSON_SERVER}/emailSettings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      // Then test
      const res = await fetch(`${API_SERVER}/api/email/test`, {
        method: 'POST'
      })
      const data = await res.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Mail size={16} className="text-accent-primary" />
          Email Provider
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {providers.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderChange(provider.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                settings?.provider === provider.id
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border hover:border-accent-primary/50'
              }`}
            >
              <p className="text-sm font-medium text-text-primary">{provider.name}</p>
              <p className="text-xs text-text-muted">{provider.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Provider-specific settings */}
      {settings?.provider === 'gmail' && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Gmail Address</label>
            <input
              type="email"
              value={settings.gmail?.user || ''}
              onChange={(e) => handleFieldChange('gmail', 'user', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="your-email@gmail.com"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">App Password</label>
            <input
              type="password"
              value={settings.gmail?.appPassword || ''}
              onChange={(e) => handleFieldChange('gmail', 'appPassword', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="••••••••••••••••"
            />
            <p className="text-xs text-text-muted mt-1">
              Get from: Google Account → Security → 2FA → App Passwords
            </p>
          </div>
        </div>
      )}

      {settings?.provider === 'sendgrid' && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">API Key</label>
            <input
              type="password"
              value={settings.sendgrid?.apiKey || ''}
              onChange={(e) => handleFieldChange('sendgrid', 'apiKey', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="SG.xxxx..."
            />
          </div>
        </div>
      )}

      {settings?.provider === 'ses' && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Access Key ID</label>
            <input
              type="text"
              value={settings.ses?.accessKeyId || ''}
              onChange={(e) => handleFieldChange('ses', 'accessKeyId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="AKIA..."
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Secret Access Key</label>
            <input
              type="password"
              value={settings.ses?.secretAccessKey || ''}
              onChange={(e) => handleFieldChange('ses', 'secretAccessKey', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="••••••••••••••••"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Region</label>
            <input
              type="text"
              value={settings.ses?.region || 'us-east-1'}
              onChange={(e) => handleFieldChange('ses', 'region', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="us-east-1"
            />
          </div>
        </div>
      )}

      {settings?.provider === 'resend' && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">API Key</label>
            <input
              type="password"
              value={settings.resend?.apiKey || ''}
              onChange={(e) => handleFieldChange('resend', 'apiKey', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="re_xxxx..."
            />
          </div>
        </div>
      )}

      {settings?.provider === 'custom' && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-muted mb-1 block">SMTP Host</label>
              <input
                type="text"
                value={settings.custom?.host || ''}
                onChange={(e) => handleFieldChange('custom', 'host', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 block">Port</label>
              <input
                type="number"
                value={settings.custom?.port || 587}
                onChange={(e) => handleFieldChange('custom', 'port', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Username</label>
            <input
              type="text"
              value={settings.custom?.user || ''}
              onChange={(e) => handleFieldChange('custom', 'user', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <input
              type="password"
              value={settings.custom?.pass || ''}
              onChange={(e) => handleFieldChange('custom', 'pass', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="customSecure"
              checked={settings.custom?.secure || false}
              onChange={(e) => handleFieldChange('custom', 'secure', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="customSecure" className="text-sm text-text-muted">Use SSL/TLS</label>
          </div>
        </div>
      )}

      {/* Sender Info */}
      {settings?.provider && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-sm font-medium text-text-primary">Sender Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-muted mb-1 block">From Name</label>
              <input
                type="text"
                value={settings.fromName || ''}
                onChange={(e) => handleTopLevelChange('fromName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 block">From Email</label>
              <input
                type="email"
                value={settings.fromEmail || ''}
                onChange={(e) => handleTopLevelChange('fromEmail', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-muted mb-1 block">Daily Limit</label>
              <input
                type="number"
                value={settings.dailyLimit || 50}
                onChange={(e) => handleTopLevelChange('dailyLimit', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 block">Delay (seconds)</label>
              <input
                type="number"
                value={settings.delayBetweenEmails || 30}
                onChange={(e) => handleTopLevelChange('delayBetweenEmails', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.success
            ? 'bg-accent-success/10 text-accent-success'
            : 'bg-accent-danger/10 text-accent-danger'
        }`}>
          {testResult.success ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-sm">{testResult.message}</span>
        </div>
      )}

      {/* Actions */}
      {settings?.provider && (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            {testing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <TestTube size={16} />
            )}
            Test Connection
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Key size={16} />
            )}
            Save Email Settings
          </button>
        </div>
      )}
    </div>
  )
}

export default EmailSettingsTab
