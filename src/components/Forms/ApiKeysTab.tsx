import { useState, useEffect } from 'react'
import {
    Key, Loader2, CheckCircle, XCircle, AlertCircle,
    ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff,
    Phone, Bot, Mic, Globe, Save
} from 'lucide-react'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../utils/authHeaders'

// Provider sections config
const SECTIONS = [
    {
        id: 'vapi',
        label: 'Vapi',
        category: 'Telephony',
        icon: Phone,
        color: 'text-blue-400',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'secret', placeholder: 'vapi_xxxxxxxxxxxx' },
            { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
        ],
        links: {
            apiKeyUrl: 'https://dashboard.vapi.ai/api-keys',
            docsUrl: 'https://docs.vapi.ai'
        },
        setupSteps: [
            'Sign up at vapi.ai',
            'Go to Dashboard > API Keys',
            'Create a new API key',
            'Copy and paste below'
        ]
    },
    {
        id: 'twilio',
        label: 'Twilio',
        category: 'Telephony',
        icon: Phone,
        color: 'text-red-400',
        fields: [
            { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { key: 'apiKeySid', label: 'API Key SID', type: 'text', placeholder: 'SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { key: 'apiKeySecret', label: 'API Key Secret', type: 'secret', placeholder: '••••••••••••••••' },
            { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+17251234567' }
        ],
        links: {
            apiKeyUrl: 'https://console.twilio.com/us1/account/keys-credentials/api-keys',
            docsUrl: 'https://www.twilio.com/docs/iam/api-keys'
        },
        setupSteps: [
            'Log in to Twilio Console',
            'Go to Account > API Keys & Tokens',
            'Create a Standard API Key',
            'Copy SID and Secret below'
        ]
    },
    {
        id: 'openai',
        label: 'OpenAI',
        category: 'AI',
        icon: Bot,
        color: 'text-green-400',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'secret', placeholder: 'sk-xxxxxxxxxxxx' }
        ],
        links: {
            apiKeyUrl: 'https://platform.openai.com/api-keys',
            docsUrl: 'https://platform.openai.com/docs'
        },
        setupSteps: [
            'Log in to OpenAI Platform',
            'Go to API Keys section',
            'Create a new secret key',
            'Copy and paste below'
        ]
    },
    {
        id: 'elevenlabs',
        label: 'ElevenLabs',
        category: 'AI',
        icon: Mic,
        color: 'text-purple-400',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'secret', placeholder: 'xi_xxxxxxxxxxxx' }
        ],
        links: {
            apiKeyUrl: 'https://elevenlabs.io/app/settings/api-keys',
            docsUrl: 'https://elevenlabs.io/docs/api-reference'
        },
        setupSteps: [
            'Log in to ElevenLabs',
            'Go to Profile > API Keys',
            'Copy your API key',
            'Paste below'
        ]
    },
    {
        id: 'deepgram',
        label: 'Deepgram',
        category: 'AI',
        icon: Mic,
        color: 'text-cyan-400',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'secret', placeholder: 'dg_xxxxxxxxxxxx' }
        ],
        links: {
            apiKeyUrl: 'https://console.deepgram.com/project/keys',
            docsUrl: 'https://developers.deepgram.com/docs'
        },
        setupSteps: [
            'Log in to Deepgram Console',
            'Go to your Project > API Keys',
            'Create a new key',
            'Copy and paste below'
        ]
    },
    {
        id: 'webhook',
        label: 'Webhooks',
        category: 'General',
        icon: Globe,
        color: 'text-amber-400',
        fields: [
            { key: 'baseUrl', label: 'Webhook Base URL', type: 'text', placeholder: 'https://your-domain.com/api' }
        ],
        links: {},
        setupSteps: [
            'Enter the public URL where your server is accessible',
            'This is used for Vapi/Twilio callback URLs',
            'Must be HTTPS in production'
        ]
    }
]

interface ApiKeysConfig {
    apiKeys?: {
        vapi?: Record<string, string>
        twilio?: Record<string, string>
        openai?: Record<string, string>
        elevenlabs?: Record<string, string>
        deepgram?: Record<string, string>
        webhook?: Record<string, string>
    }
}

/**
 * Mask a secret value, showing only the last 4 characters
 */
function maskValue(value: string): string {
    if (!value || value.length <= 4) return value
    return '•'.repeat(Math.min(value.length - 4, 20)) + value.slice(-4)
}

export function ApiKeysTab() {
    const { user } = useAuth()
    const [config, setConfig] = useState<ApiKeysConfig>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
    const [showInstructions, setShowInstructions] = useState<Record<string, boolean>>({})
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})

    // Fetch existing settings
    useEffect(() => {
        if (!user) return
        const fetchSettings = async () => {
            try {
                const data = await fetchGet(ENDPOINTS.SETTINGS)
                setConfig(data || {})
            } catch (error) {
                console.error('Failed to fetch settings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [user])

    const handleFieldChange = (sectionId: string, fieldKey: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            apiKeys: {
                ...prev.apiKeys,
                [sectionId]: {
                    ...(prev.apiKeys?.[sectionId as keyof typeof prev.apiKeys] || {}),
                    [fieldKey]: value
                }
            }
        }))
        setSaveResult(null)
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setSaveResult(null)
        try {
            const data = await fetchMutation(ENDPOINTS.SETTINGS, 'PATCH', config)
            setConfig(data)
            setSaveResult({ success: true, message: 'API keys saved and applied!' })
        } catch (error) {
            setSaveResult({ success: false, message: 'Failed to save API keys' })
        } finally {
            setSaving(false)
        }
    }

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const toggleVisibility = (fieldId: string) => {
        setVisibleFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }))
    }

    const isProviderConfigured = (sectionId: string): boolean => {
        const sectionData = config.apiKeys?.[sectionId as keyof typeof config.apiKeys]
        if (!sectionData) return false
        const section = SECTIONS.find(s => s.id === sectionId)
        if (!section) return false
        // Check if at least the first (main) field has a value
        const mainField = section.fields[0]
        return Boolean(sectionData[mainField.key])
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Key size={16} className="text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-primary">API Keys & Credentials</h3>
            </div>
            <p className="text-xs text-text-muted -mt-2">
                Configure your API keys here. Keys are saved to the database and loaded at server startup.
            </p>

            {/* Provider Cards */}
            {SECTIONS.map(section => {
                const isExpanded = expandedSections[section.id] ?? false
                const isConfigured = isProviderConfigured(section.id)
                const Icon = section.icon
                const sectionData = config.apiKeys?.[section.id as keyof typeof config.apiKeys] || {}

                return (
                    <div key={section.id} className="rounded-xl border border-border overflow-hidden">
                        {/* Card Header */}
                        <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-3 bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg bg-bg-tertiary ${section.color}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-text-primary">{section.label}</p>
                                    <p className="text-[10px] text-text-muted">{section.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isConfigured ? (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                        <CheckCircle className="w-3 h-3" /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                                        <XCircle className="w-3 h-3" /> Missing Key
                                    </span>
                                )}
                                {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                            </div>
                        </button>

                        {/* Card Body */}
                        {isExpanded && (
                            <div className="p-3 space-y-3 border-t border-border bg-bg-primary">
                                {/* Setup Instructions Toggle */}
                                {section.setupSteps.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowInstructions(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                            className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                                        >
                                            {showInstructions[section.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            {showInstructions[section.id] ? 'Hide' : 'Show'} setup instructions
                                        </button>

                                        {showInstructions[section.id] && (
                                            <div className="p-3 bg-bg-tertiary rounded-lg border border-border">
                                                <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                                                    {section.setupSteps.map((step, i) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ol>
                                                {section.links.apiKeyUrl && (
                                                    <a
                                                        href={section.links.apiKeyUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-accent-primary hover:underline mt-2"
                                                    >
                                                        Get API Key <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Fields */}
                                {section.fields.map(field => {
                                    const fieldId = `${section.id}.${field.key}`
                                    const rawValue = (sectionData as Record<string, string>)[field.key] || ''
                                    const isSecret = field.type === 'secret'
                                    const isVisible = visibleFields[fieldId]

                                    return (
                                        <div key={fieldId}>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm text-text-muted">{field.label}</label>
                                                {isSecret && section.links.apiKeyUrl && (
                                                    <a
                                                        href={section.links.apiKeyUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                                                    >
                                                        Get Key <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={isSecret && !isVisible ? 'password' : 'text'}
                                                    value={rawValue}
                                                    onChange={(e) => handleFieldChange(section.id, field.key, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent-primary pr-10"
                                                    placeholder={field.placeholder}
                                                />
                                                {isSecret && rawValue && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVisibility(fieldId)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                                                    >
                                                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Save Result */}
            {saveResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${saveResult.success
                    ? 'bg-accent-success/10 text-accent-success'
                    : 'bg-accent-danger/10 text-accent-danger'
                    }`}>
                    {saveResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span className="text-sm">{saveResult.message}</span>
                </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    Save All API Keys
                </button>
            </div>
        </div>
    )
}
