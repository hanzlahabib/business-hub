import { useState, useEffect } from 'react'
import { Mail, Loader2, TestTube, CheckCircle, AlertCircle, Key, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../utils/authHeaders'

// Constants
const providers = [
    { id: 'gmail', name: 'Gmail', description: 'Use Google SMTP with App Password' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Professional email delivery service' },
    { id: 'ses', name: 'Amazon SES', description: 'AWS Simple Email Service' },
    { id: 'resend', name: 'Resend', description: 'Modern email API for developers' },
    { id: 'custom', name: 'Custom SMTP', description: 'Your own SMTP server' }
]

const PROVIDER_QUICK_LINKS = {
    resend: {
        apiKeyUrl: 'https://resend.com/api-keys',
        docsUrl: 'https://resend.com/docs',
        keyFormat: /^re_[a-zA-Z0-9_]+$/,
        keyExample: 're_xxxxxxxxxxxx',
        setupSteps: [
            'Sign up at resend.com',
            'Go to API Keys section',
            'Click "Create API Key"',
            'Copy and paste below'
        ]
    },
    gmail: {
        apiKeyUrl: 'https://myaccount.google.com/apppasswords',
        docsUrl: 'https://support.google.com/accounts/answer/185833',
        keyFormat: /^[a-z]{16}$/,
        keyExample: 'abcdefghijklmnop',
        setupSteps: [
            'Enable 2-Factor Authentication',
            'Go to App Passwords page',
            'Select "Mail" and "Other"',
            'Copy the 16-character password'
        ]
    },
    sendgrid: {
        apiKeyUrl: 'https://app.sendgrid.com/settings/api_keys',
        docsUrl: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
        keyFormat: /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/,
        keyExample: 'SG.xxxxxxxxxxxx',
        setupSteps: [
            'Sign up at sendgrid.com',
            'Go to Settings → API Keys',
            'Create API Key with Full Access',
            'Copy and paste below'
        ]
    }
}

// Types
interface EmailSettings {
    provider: string
    gmail?: { user?: string; appPassword?: string }
    sendgrid?: { apiKey?: string }
    ses?: { accessKeyId?: string; secretAccessKey?: string; region?: string }
    resend?: { apiKey?: string }
    custom?: { host?: string; port?: number; user?: string; pass?: string; secure?: boolean }
    fromName?: string
    fromEmail?: string
    dailyLimit?: number
    delayBetweenEmails?: number
}

interface TestResult {
    success: boolean
    message: string
}

export function EmailSettingsTab() {
    const { user } = useAuth()
    const [settings, setSettings] = useState<EmailSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [showInstructions, setShowInstructions] = useState<Record<string, boolean>>({})

    // Fetch current settings
    useEffect(() => {
        if (!user) return
        const fetchSettings = async () => {
            try {
                const data = await fetchGet(ENDPOINTS.EMAIL_SETTINGS)
                setSettings(data)
            } catch (error) {
                console.error('Failed to fetch email settings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [user])

    const handleProviderChange = (provider: string) => {
        setSettings(prev => prev ? ({ ...prev, provider }) : null)
        setTestResult(null)
    }

    const handleFieldChange = (section: keyof EmailSettings, field: string, value: any) => {
        if (!settings) return
        setSettings(prev => prev ? ({
            ...prev,
            [section]: {
                ...(prev[section] as object || {}),
                [field]: value
            }
        }) : null)
    }

    const handleTopLevelChange = (field: keyof EmailSettings, value: any) => {
        setSettings(prev => prev ? ({ ...prev, [field]: value }) : null)
    }

    const handleSave = async () => {
        if (!settings || !user) return
        setSaving(true)
        try {
            await fetchMutation(ENDPOINTS.EMAIL_SETTINGS, 'PUT', settings)
            setTestResult({ success: true, message: 'Settings saved!' })
        } catch (error) {
            setTestResult({ success: false, message: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleTestConnection = async () => {
        if (!settings || !user) return
        setTesting(true)
        setTestResult(null)
        try {
            // Save first
            await fetchMutation(ENDPOINTS.EMAIL_SETTINGS, 'PUT', settings)

            // Then test
            const data = await fetchMutation(ENDPOINTS.EMAIL_TEST, 'POST')
            setTestResult(data)
        } catch (error: any) {
            setTestResult({ success: false, message: error.message || 'Test failed' })
        } finally {
            setTesting(false)
        }
    }

    const validateApiKey = (provider: string, key: string): boolean => {
        const config = PROVIDER_QUICK_LINKS[provider as keyof typeof PROVIDER_QUICK_LINKS]
        if (!config || !key) return true // Don't validate if empty or no config
        return config.keyFormat.test(key)
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
                            className={`p-3 rounded-lg border text-left transition-colors ${settings?.provider === provider.id
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
                    {/* Instructions Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowInstructions(prev => ({ ...prev, gmail: !prev.gmail }))}
                        className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                        {showInstructions.gmail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showInstructions.gmail ? 'Hide' : 'Show'} setup instructions
                    </button>

                    {/* Collapsible Instructions */}
                    {showInstructions.gmail && (
                        <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
                            <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                                {PROVIDER_QUICK_LINKS.gmail.setupSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}

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
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-text-muted">App Password</label>
                            <a
                                href={PROVIDER_QUICK_LINKS.gmail.apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                            >
                                Get App Password <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="password"
                            value={settings.gmail?.appPassword || ''}
                            onChange={(e) => {
                                handleFieldChange('gmail', 'appPassword', e.target.value)
                                // Validate on change
                                const isValid = validateApiKey('gmail', e.target.value)
                                setValidationErrors(prev => ({
                                    ...prev,
                                    gmailAppPassword: isValid ? '' : 'Invalid format (should be 16 lowercase letters)'
                                }))
                            }}
                            className={`w-full px-3 py-2 rounded-lg bg-bg-tertiary border text-text-primary text-sm focus:outline-none focus:border-accent-primary ${validationErrors.gmailAppPassword ? 'border-accent-danger' : 'border-border'
                                }`}
                            placeholder={PROVIDER_QUICK_LINKS.gmail.keyExample}
                        />
                        {validationErrors.gmailAppPassword && (
                            <p className="text-xs text-accent-danger mt-1">{validationErrors.gmailAppPassword}</p>
                        )}
                    </div>
                </div>
            )}

            {settings?.provider === 'sendgrid' && (
                <div className="space-y-3 border-t border-border pt-4">
                    {/* Instructions Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowInstructions(prev => ({ ...prev, sendgrid: !prev.sendgrid }))}
                        className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                        {showInstructions.sendgrid ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showInstructions.sendgrid ? 'Hide' : 'Show'} setup instructions
                    </button>

                    {/* Collapsible Instructions */}
                    {showInstructions.sendgrid && (
                        <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
                            <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                                {PROVIDER_QUICK_LINKS.sendgrid.setupSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-text-muted">API Key</label>
                            <a
                                href={PROVIDER_QUICK_LINKS.sendgrid.apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                            >
                                Get API Key <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="password"
                            value={settings.sendgrid?.apiKey || ''}
                            onChange={(e) => {
                                handleFieldChange('sendgrid', 'apiKey', e.target.value)
                                // Validate on change
                                const isValid = validateApiKey('sendgrid', e.target.value)
                                setValidationErrors(prev => ({
                                    ...prev,
                                    sendgridApiKey: isValid ? '' : 'Invalid API key format (should start with SG.)'
                                }))
                            }}
                            className={`w-full px-3 py-2 rounded-lg bg-bg-tertiary border text-text-primary text-sm focus:outline-none focus:border-accent-primary ${validationErrors.sendgridApiKey ? 'border-accent-danger' : 'border-border'
                                }`}
                            placeholder={PROVIDER_QUICK_LINKS.sendgrid.keyExample}
                        />
                        {validationErrors.sendgridApiKey && (
                            <p className="text-xs text-accent-danger mt-1">{validationErrors.sendgridApiKey}</p>
                        )}
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
                    {/* Instructions Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowInstructions(prev => ({ ...prev, resend: !prev.resend }))}
                        className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                        {showInstructions.resend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showInstructions.resend ? 'Hide' : 'Show'} setup instructions
                    </button>

                    {/* Collapsible Instructions */}
                    {showInstructions.resend && (
                        <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
                            <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                                {PROVIDER_QUICK_LINKS.resend.setupSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-text-muted">API Key</label>
                            <a
                                href={PROVIDER_QUICK_LINKS.resend.apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                            >
                                Get API Key <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="password"
                            value={settings.resend?.apiKey || ''}
                            onChange={(e) => {
                                handleFieldChange('resend', 'apiKey', e.target.value)
                                // Validate on change
                                const isValid = validateApiKey('resend', e.target.value)
                                setValidationErrors(prev => ({
                                    ...prev,
                                    resendApiKey: isValid ? '' : 'Invalid API key format (should start with re_)'
                                }))
                            }}
                            className={`w-full px-3 py-2 rounded-lg bg-bg-tertiary border text-text-primary text-sm focus:outline-none focus:border-accent-primary ${validationErrors.resendApiKey ? 'border-accent-danger' : 'border-border'
                                }`}
                            placeholder={PROVIDER_QUICK_LINKS.resend.keyExample}
                        />
                        {validationErrors.resendApiKey && (
                            <p className="text-xs text-accent-danger mt-1">{validationErrors.resendApiKey}</p>
                        )}
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
                <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success
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
