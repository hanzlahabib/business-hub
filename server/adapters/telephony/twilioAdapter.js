/**
 * Twilio Telephony Adapter
 *
 * Handles outbound calling via Twilio REST API.
 * Uses API Key authentication (SK + Secret + Account SID).
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_PHONE_NUMBER
 *
 * Swap to this by setting TELEPHONY_PROVIDER=twilio in .env
 */

import { TelephonyAdapter } from './interface.js'

export class TwilioAdapter extends TelephonyAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'twilio'
        this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID
        this.apiKeySid = config.apiKeySid || process.env.TWILIO_API_KEY_SID
        this.apiKeySecret = config.apiKeySecret || process.env.TWILIO_API_KEY_SECRET
        this.phoneNumber = config.phoneNumber || process.env.TWILIO_PHONE_NUMBER
        this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`
        this.webhookBaseUrl = config.webhookBaseUrl || process.env.WEBHOOK_BASE_URL || 'http://localhost:3002'
    }

    async _request(endpoint, method = 'GET', body = null) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
        const auth = Buffer.from(`${this.apiKeySid}:${this.apiKeySecret}`).toString('base64')

        const headers = {
            'Authorization': `Basic ${auth}`,
        }

        let fetchBody = null
        if (body && method !== 'GET') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            fetchBody = new URLSearchParams(body).toString()
        }

        const res = await fetch(url, {
            method,
            headers,
            ...(fetchBody && { body: fetchBody })
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`Twilio API error (${res.status}): ${error}`)
        }

        return res.json()
    }

    async initiateCall({ phoneNumber, leadId, scriptId, assistantConfig = {} }) {
        const useAI = assistantConfig.useMediaStreams === true
        const twimlEndpoint = useAI ? 'stream' : 'twiml'
        const twimlUrl = `${this.webhookBaseUrl}/api/calls/twilio/${twimlEndpoint}?leadId=${encodeURIComponent(leadId)}&scriptId=${encodeURIComponent(scriptId || '')}`
        const statusUrl = `${this.webhookBaseUrl}/api/calls/twilio/status`

        const callParams = {
            To: phoneNumber,
            From: this.phoneNumber,
            Url: twimlUrl,
            StatusCallback: statusUrl,
            StatusCallbackEvent: 'initiated ringing answered completed',
            StatusCallbackMethod: 'POST',
            Record: 'true',
            RecordingStatusCallback: `${this.webhookBaseUrl}/api/calls/twilio/recording`,
            RecordingStatusCallbackMethod: 'POST',
        }

        // Answering Machine Detection
        if (assistantConfig.enableAMD !== false) {
            callParams.MachineDetection = 'DetectMessageEnd'
            callParams.MachineDetectionTimeout = '5'
            callParams.MachineDetectionSilenceTimeout = '3000'
            callParams.AsyncAmd = 'true'
            callParams.AsyncAmdStatusCallback = `${this.webhookBaseUrl}/api/calls/twilio/amd`
            callParams.AsyncAmdStatusCallbackMethod = 'POST'
        }

        const result = await this._request('/Calls.json', 'POST', callParams)

        return {
            callId: result.sid,
            providerCallId: result.sid,
            status: this._mapTwilioStatus(result.status)
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
        const result = await this._request(`/Calls/${providerCallId}.json`)

        let recordingUrl = null
        try {
            const recordings = await this._request(`/Calls/${providerCallId}/Recordings.json`)
            if (recordings.recordings?.length > 0) {
                recordingUrl = `https://api.twilio.com${recordings.recordings[0].uri.replace('.json', '.mp3')}`
            }
        } catch {
            // no recordings yet
        }

        return {
            status: this._mapTwilioStatus(result.status),
            duration: result.duration ? parseInt(result.duration) : null,
            recordingUrl,
            transcript: null,
            summary: null,
            cost: result.price ? parseFloat(result.price) : null
        }
    }

    async endCall(providerCallId) {
        try {
            await this._request(`/Calls/${providerCallId}.json`, 'POST', {
                Status: 'completed'
            })
            return { success: true }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    async handleWebhook(payload) {
        return {
            type: 'twilio-status',
            providerCallId: payload.CallSid,
            status: this._mapTwilioStatus(payload.CallStatus),
            duration: payload.CallDuration ? parseInt(payload.CallDuration) : null,
            recordingUrl: payload.RecordingUrl || null,
            transcript: null,
            summary: null,
            endedReason: payload.CallStatus === 'busy' ? 'busy'
                : payload.CallStatus === 'no-answer' ? 'no-answer'
                : payload.CallStatus === 'failed' ? 'failed'
                : null,
            metadata: {
                from: payload.From,
                to: payload.To,
                direction: payload.Direction,
                accountSid: payload.AccountSid,
            }
        }
    }

    async sendSms(to, body) {
        const result = await this._request('/Messages.json', 'POST', {
            To: to,
            From: this.phoneNumber,
            Body: body,
        })
        return { sid: result.sid, status: result.status }
    }

    async getPhoneNumbers() {
        const result = await this._request('/IncomingPhoneNumbers.json')
        return (result.incoming_phone_numbers || []).map(p => ({
            id: p.sid,
            number: p.phone_number,
            friendlyName: p.friendly_name,
            capabilities: Object.entries(p.capabilities || {})
                .filter(([, v]) => v)
                .map(([k]) => k)
        }))
    }

    _mapTwilioStatus(twilioStatus) {
        const map = {
            'queued': 'queued',
            'initiated': 'ringing',
            'ringing': 'ringing',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'failed': 'failed',
            'busy': 'busy',
            'no-answer': 'no-answer',
            'canceled': 'failed',
        }
        return map[twilioStatus] || 'unknown'
    }
}

export default TwilioAdapter
