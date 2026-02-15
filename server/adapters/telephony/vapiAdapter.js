/**
 * Vapi AI Telephony Adapter
 *
 * Handles outbound AI calling via Vapi API.
 * Vapi manages the full conversation: STT + LLM + TTS.
 * We configure the assistant from CallScript.assistantConfig and Vapi handles the rest.
 *
 * All business-specific content (prompts, voice, persona) comes from the CallScript,
 * NOT hardcoded here. This adapter is niche-agnostic.
 *
 * Docs: https://docs.vapi.ai
 */

import { TelephonyAdapter } from './interface.js'
import logger from '../../config/logger.js'

// Named voice presets — users can pick by name or provide raw ElevenLabs voice ID
const VOICE_PRESETS = {
    adam: 'pNInz6obpgDQGcFmaJgB',      // Deep male
    josh: 'TxGEqnHWrfWFTfGW9XjX',      // Natural male
    rachel: '21m00Tcm4TlvDq8ikWAM',     // Female
    arnold: 'VR6AewLTigWG4xSOukaG',     // Deep male
    bella: 'EXAVITQu4vr4xnSDxMaL',      // Soft female
}

export class VapiAdapter extends TelephonyAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'vapi'
        this.apiKey = config.apiKey || process.env.VAPI_API_KEY
        this.phoneNumberId = config.phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID
        this.baseUrl = 'https://api.vapi.ai'
    }

    async _request(endpoint, method = 'GET', body = null) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            ...(body && { body: JSON.stringify(body) })
        })
        if (!res.ok) {
            const error = await res.text()
            logger.error('Vapi API request failed', { endpoint, method, status: res.status, error })
            throw new Error(`Vapi API error (${res.status}): ${error}`)
        }
        return res.json()
    }

    async initiateCall({ phoneNumber, leadId, scriptId, assistantConfig = {} }) {
        const webhookUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3002'

        // Resolve voice ID — could be a preset name ("adam") or raw ElevenLabs ID
        const rawVoice = assistantConfig.voiceId || process.env.ELEVENLABS_VOICE_ID || 'adam'
        const voiceId = VOICE_PRESETS[rawVoice] || rawVoice

        // Build first message — use openingLine from script, or generic greeting
        const agentName = assistantConfig.agentName || 'there'
        const businessName = assistantConfig.businessName || ''
        const contactName = assistantConfig.contractorName || 'there'
        const firstMessage = assistantConfig.openingLine
            || `Hi ${contactName}, this is ${agentName}${businessName ? ' from ' + businessName : ''}. How are you doing today?`

        // Build end call phrases — defaults + any custom ones
        const defaultEndPhrases = ['goodbye', 'bye', 'not interested', 'stop calling', 'don\'t call again', 'remove my number', 'take me off the list']
        const endCallPhrases = assistantConfig.endCallPhrases || defaultEndPhrases

        const payload = {
            phoneNumberId: this.phoneNumberId,
            customer: {
                number: phoneNumber
            },
            assistant: {
                firstMessage,
                model: {
                    provider: assistantConfig.llmProvider || 'openai',
                    model: assistantConfig.llmModel || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: assistantConfig.systemPrompt || 'You are a professional sales agent. Keep responses short (1-2 sentences). Be friendly and conversational.'
                        }
                    ],
                    temperature: assistantConfig.temperature ?? 0.7,
                    maxTokens: assistantConfig.maxTokens ?? 150,
                },
                voice: {
                    provider: '11labs',
                    voiceId,
                    stability: assistantConfig.voiceStability ?? 0.5,
                    similarityBoost: assistantConfig.voiceSimilarity ?? 0.75,
                },
                transcriber: {
                    provider: 'deepgram',
                    model: 'nova-2',
                    language: assistantConfig.language || 'en-US',
                },
                endCallFunctionEnabled: true,
                endCallMessage: assistantConfig.endCallMessage || 'Thanks for your time! Have a great day. Goodbye.',
                endCallPhrases,
                silenceTimeoutSeconds: assistantConfig.silenceTimeout ?? 15,
                maxDurationSeconds: assistantConfig.maxDuration ?? 300,
                backgroundSound: 'off',
                serverUrl: `${webhookUrl}/api/calls/vapi/webhook`,
                serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || undefined,
            },
            metadata: {
                leadId,
                scriptId
            }
        }

        const result = await this._request('/call/phone', 'POST', payload)

        return {
            callId: result.id,
            providerCallId: result.id,
            status: result.status || 'queued'
        }
    }

    async batchCall({ leads, scriptId, delayMs = 15000, assistantConfig = {} }) {
        const results = []
        for (let i = 0; i < leads.length; i++) {
            try {
                const result = await this.initiateCall({
                    phoneNumber: leads[i].phone,
                    leadId: leads[i].id,
                    scriptId,
                    assistantConfig: {
                        ...assistantConfig,
                        contractorName: leads[i].contactPerson?.split(' ')[0] || 'there'
                    }
                })
                results.push({ leadId: leads[i].id, ...result, success: true })

                if (i < leads.length - 1 && delayMs > 0) {
                    await new Promise(r => setTimeout(r, delayMs))
                }
            } catch (err) {
                results.push({ leadId: leads[i].id, success: false, error: err.message })
            }
        }

        return {
            batchId: `batch_${Date.now()}`,
            queued: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        }
    }

    async getCallStatus(providerCallId) {
        const result = await this._request(`/call/${providerCallId}`)
        return {
            status: this._mapCallStatus(result.status),
            duration: result.endedAt && result.startedAt
                ? Math.round((new Date(result.endedAt) - new Date(result.startedAt)) / 1000)
                : null,
            recordingUrl: result.recordingUrl || null,
            transcript: result.transcript || null,
            summary: result.summary || null,
            cost: result.cost || null
        }
    }

    async endCall(providerCallId) {
        try {
            await this._request(`/call/${providerCallId}`, 'DELETE')
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    async handleWebhook(payload) {
        const { message } = payload
        const type = message?.type

        return {
            type,
            providerCallId: message?.call?.id,
            status: this._mapStatus(type),
            duration: message?.call?.duration || null,
            recordingUrl: message?.recordingUrl || null,
            transcript: message?.transcript || null,
            summary: message?.summary || null,
            endedReason: message?.endedReason || null,
            metadata: message?.call?.metadata || {}
        }
    }

    async getPhoneNumbers() {
        const result = await this._request('/phone-number')
        return (result || []).map(p => ({
            id: p.id,
            number: p.number,
            capabilities: p.capabilities || ['voice']
        }))
    }

    // Send SMS via Twilio (Vapi doesn't do SMS)
    async sendSms(to, body) {
        const { TwilioAdapter } = await import('./twilioAdapter.js')
        const twilio = new TwilioAdapter()
        return twilio.sendSms(to, body)
    }

    _mapStatus(webhookType) {
        const map = {
            'call-started': 'ringing',
            'status-update': 'in-progress',
            'speech-update': 'in-progress',
            'transcript': 'in-progress',
            'tool-calls': 'in-progress',
            'end-of-call-report': 'completed',
            'hang': 'completed',
            'call-failed': 'failed'
        }
        return map[webhookType] || 'unknown'
    }

    _mapCallStatus(vapiStatus) {
        const map = {
            'queued': 'queued',
            'ringing': 'ringing',
            'in-progress': 'in-progress',
            'forwarding': 'in-progress',
            'ended': 'completed',
        }
        return map[vapiStatus] || vapiStatus
    }
}

export default VapiAdapter
