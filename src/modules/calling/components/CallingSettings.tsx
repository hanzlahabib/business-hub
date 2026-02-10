import { useState, useEffect, useCallback } from 'react'
import { Settings, Radio, Mic, Brain, AudioLines, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

interface ProviderInfo {
    telephony: { name: string; configured: boolean }
    voice: { name: string; configured: boolean }
    llm: { name: string; configured: boolean }
    stt: { name: string; configured: boolean }
    mockMode: boolean
}

const PROVIDER_ICONS: Record<string, any> = {
    telephony: Radio,
    voice: Mic,
    llm: Brain,
    stt: AudioLines,
}

const PROVIDER_COLORS: Record<string, string> = {
    telephony: 'text-amber-400 bg-amber-500/10',
    voice: 'text-pink-400 bg-pink-500/10',
    llm: 'text-violet-400 bg-violet-500/10',
    stt: 'text-blue-400 bg-blue-500/10',
}

export function CallingSettings() {
    const { user } = useAuth()
    const [providers, setProviders] = useState<ProviderInfo | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProviders = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const res = await fetch(ENDPOINTS.CALL_PROVIDERS, {
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            const data = await res.json()
            setProviders(data)
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [user])

    useEffect(() => { fetchProviders() }, [fetchProviders])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Provider Configuration
            </h2>

            {/* Mock Mode Banner */}
            {providers?.mockMode && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-amber-400 text-lg">🧪</span>
                    <div>
                        <p className="text-sm font-medium text-amber-400">Mock Mode Active</p>
                        <p className="text-xs text-text-muted">All calls use simulated providers — no real API keys needed for development.</p>
                    </div>
                </div>
            )}

            {/* Provider Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {providers && (['telephony', 'voice', 'llm', 'stt'] as const).map(type => {
                    const provider = providers[type]
                    if (!provider) return null
                    const Icon = PROVIDER_ICONS[type]
                    const colorClass = PROVIDER_COLORS[type]

                    return (
                        <div key={type} className="bg-bg-secondary rounded-xl p-4 border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-text-primary capitalize">{type}</h3>
                                    <p className="text-xs text-text-muted">{provider.name}</p>
                                </div>
                                {provider.configured ? (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                        <CheckCircle className="w-3 h-3" /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                                        <XCircle className="w-3 h-3" /> Missing Key
                                    </span>
                                )}
                            </div>

                            {/* Provider-specific info */}
                            <div className="text-xs text-text-muted bg-bg-tertiary rounded-lg p-2">
                                {type === 'telephony' && 'Handles outbound/inbound call orchestration'}
                                {type === 'voice' && 'Text-to-speech voice synthesis for agents'}
                                {type === 'llm' && 'Language model for conversation and negotiation'}
                                {type === 'stt' && 'Speech-to-text transcription of calls'}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Environment Variables Info */}
            <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Environment Variables
                </h3>
                <div className="grid gap-1 text-xs font-mono">
                    {[
                        'TELEPHONY_PROVIDER', 'VOICE_PROVIDER', 'LLM_PROVIDER', 'STT_PROVIDER',
                        'VAPI_API_KEY', 'ELEVENLABS_API_KEY', 'OPENAI_API_KEY', 'DEEPGRAM_API_KEY',
                        'CALLING_MOCK_MODE'
                    ].map(key => (
                        <div key={key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-bg-tertiary">
                            <span className="text-text-muted">{key}</span>
                            <span className="text-[10px] text-text-muted ml-auto">
                                {key === 'CALLING_MOCK_MODE'
                                    ? providers?.mockMode ? '✅ true' : '❌ false'
                                    : '•••'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CallingSettings
