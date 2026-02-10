/**
 * Vapi AI Telephony Adapter
 * 
 * Handles outbound calling via Vapi AI API.
 * Docs: https://docs.vapi.ai
 * 
 * Swap out by setting TELEPHONY_PROVIDER=twilio in .env
 */

import { TelephonyAdapter } from './interface.js'

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
            throw new Error(`Vapi API error (${res.status}): ${error}`)
        }
        return res.json()
    }

    async initiateCall({ phoneNumber, leadId, scriptId, assistantConfig = {} }) {
        const payload = {
            phoneNumberId: this.phoneNumberId,
            customer: {
                number: phoneNumber
            },
            assistant: {
                firstMessage: assistantConfig.openingLine || 'Hello, this is a call regarding our services.',
                model: {
                    provider: assistantConfig.llmProvider || 'openai',
                    model: assistantConfig.llmModel || 'gpt-4o-mini',
                    messages: assistantConfig.systemMessages || [
                        {
                            role: 'system',
                            content: assistantConfig.systemPrompt || 'You are a professional sales agent. Be concise, friendly, and persuasive.'
                        }
                    ]
                },
                voice: {
                    provider: assistantConfig.voiceProvider || 'elevenlabs',
                    voiceId: assistantConfig.voiceId || process.env.ELEVENLABS_VOICE_ID || 'rachel'
                },
                transcriber: {
                    provider: 'deepgram',
                    model: 'nova-2'
                },
                ...(assistantConfig.endCallPhrases && { endCallPhrases: assistantConfig.endCallPhrases })
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

    async batchCall({ leads, scriptId, delayMs = 5000, assistantConfig = {} }) {
        const results = []
        for (let i = 0; i < leads.length; i++) {
            try {
                const result = await this.initiateCall({
                    phoneNumber: leads[i].phone,
                    leadId: leads[i].id,
                    scriptId,
                    assistantConfig
                })
                results.push({ leadId: leads[i].id, ...result, success: true })

                // Delay between calls (except last)
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
            status: result.status,
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
        // Normalize Vapi webhook payload to our standard format
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

    _mapStatus(webhookType) {
        const map = {
            'call-started': 'ringing',
            'speech-update': 'in-progress',
            'transcript': 'in-progress',
            'tool-calls': 'in-progress',
            'end-of-call-report': 'completed',
            'hang': 'completed',
            'call-failed': 'failed'
        }
        return map[webhookType] || 'unknown'
    }
}

export default VapiAdapter
