/**
 * Mock Adapters — For development without real API keys
 * 
 * Enable by setting CALLING_MOCK_MODE=true in .env
 * Returns simulated data for all adapter operations.
 */

import { TelephonyAdapter } from './telephony/interface.js'
import { VoiceAdapter } from './voice/interface.js'
import { LLMAdapter } from './llm/interface.js'
import { STTAdapter } from './stt/interface.js'

// ============================================
// MOCK TELEPHONY
// ============================================
export class MockTelephonyAdapter extends TelephonyAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'mock'
        this._calls = new Map()
    }

    async initiateCall({ phoneNumber, leadId, scriptId }) {
        const callId = `mock_call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const call = { callId, providerCallId: callId, status: 'ringing', phoneNumber, leadId, scriptId }
        this._calls.set(callId, call)

        // Simulate call progression
        setTimeout(() => { call.status = 'in-progress' }, 2000)
        setTimeout(() => {
            call.status = 'completed'
            call.duration = Math.floor(Math.random() * 300) + 30
            call.recordingUrl = `https://mock-recordings.test/${callId}.mp3`
        }, 5000 + Math.random() * 10000)

        return { callId, providerCallId: callId, status: 'ringing' }
    }

    async batchCall({ leads, scriptId, delayMs = 1000 }) {
        const results = []
        for (const lead of leads) {
            const result = await this.initiateCall({ phoneNumber: lead.phone || '555-0000', leadId: lead.id, scriptId })
            results.push({ leadId: lead.id, ...result, success: true })
            if (delayMs > 0) await new Promise(r => setTimeout(r, Math.min(delayMs, 500)))
        }
        return { batchId: `mock_batch_${Date.now()}`, queued: results.length, failed: 0, results }
    }

    async getCallStatus(providerCallId) {
        const call = this._calls.get(providerCallId)
        if (!call) return { status: 'not-found' }
        return {
            status: call.status,
            duration: call.duration || null,
            recordingUrl: call.recordingUrl || null,
            transcript: call.status === 'completed' ? 'Mock transcript: The client expressed interest in our premium plan.' : null,
            summary: call.status === 'completed' ? 'Client is interested. Follow up in 2 days.' : null
        }
    }

    async endCall(providerCallId) {
        const call = this._calls.get(providerCallId)
        if (call) call.status = 'completed'
        return { success: true }
    }

    async handleWebhook(payload) {
        return { type: 'mock', providerCallId: 'mock', status: 'completed', metadata: {} }
    }

    async getPhoneNumbers() {
        return [{ id: 'mock_phone_1', number: '+1-555-MOCK', capabilities: ['voice'] }]
    }
}

// ============================================
// MOCK VOICE
// ============================================
export class MockVoiceAdapter extends VoiceAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'mock'
    }

    async synthesize({ text }) {
        return { audioBuffer: Buffer.from('mock-audio'), contentType: 'audio/mp3', duration: text.length * 0.05 }
    }

    async getVoices() {
        return [
            { id: 'mock_rachel', name: 'Rachel (Mock)', language: 'en', preview_url: null },
            { id: 'mock_adam', name: 'Adam (Mock)', language: 'en', preview_url: null }
        ]
    }

    async cloneVoice({ name }) {
        return { voiceId: `mock_clone_${Date.now()}`, name }
    }
}

// ============================================
// MOCK LLM
// ============================================
export class MockLLMAdapter extends LLMAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'mock'
    }

    async complete({ messages }) {
        const lastMsg = messages[messages.length - 1]?.content || ''
        return {
            content: `[Mock LLM Response] Processed: "${lastMsg.slice(0, 50)}..."`,
            toolCalls: [],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
        }
    }

    async generateScript({ purpose, industry }) {
        return {
            openingLine: `Hi there! I'm calling about our ${industry || 'business'} services. Do you have a quick moment?`,
            talkingPoints: [
                { topic: 'Introduction', script: 'Brief company introduction and value prop.', fallback: 'Can I send you more info via email?' },
                { topic: 'Pain Points', script: 'What challenges are you facing with your current solution?', fallback: 'Many in your industry struggle with...' },
                { topic: 'Our Solution', script: 'Here\'s how we can help...', fallback: 'Would a quick demo be helpful?' }
            ],
            objectionHandlers: [
                { objection: 'Too expensive', response: 'I understand budget concerns. Our ROI typically covers the cost within 3 months.' },
                { objection: 'Not interested', response: 'No problem! Could I send a brief case study relevant to your industry?' },
                { objection: 'Already have a solution', response: 'That\'s great! Many clients use us alongside their current tools for enhanced results.' }
            ],
            closingStrategy: `Based on what you've shared, I'd recommend our ${purpose || 'standard'} package. Would you like to schedule a detailed walkthrough this week?`
        }
    }

    async negotiateRate({ currentRate, targetRate }) {
        return {
            strategy: 'Anchor high, concede gradually with value-adds',
            suggestedRate: targetRate * 1.1,
            reasoning: 'Starting slightly above target allows negotiation room',
            counterArguments: ['Industry benchmark supports this rate', 'Includes premium support', 'ROI-positive within 60 days'],
            walkAwayPoint: targetRate * 0.85,
            confidence: 72
        }
    }

    async summarize({ text, type = 'call' }) {
        return {
            summary: `[Mock Summary] ${type} covered key topics. Client showed moderate interest. Follow-up recommended.`,
            sentiment: 'positive',
            actionItems: [{ task: 'Send proposal', assignee: 'Sales Rep', deadline: 'This week' }],
            decisions: ['Client open to demo call', 'Budget discussion in follow-up']
        }
    }
}

// ============================================
// MOCK STT
// ============================================
export class MockSTTAdapter extends STTAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'mock'
    }

    async transcribe({ audioUrl }) {
        return {
            text: `[Mock Transcription] Hello, this is a simulated transcription from ${audioUrl || 'audio buffer'}. The client discussed pricing and expressed interest in our services.`,
            words: [],
            confidence: 0.95,
            duration: 120
        }
    }

    async streamTranscribe({ onTranscript }) {
        return {
            wsUrl: 'ws://mock/transcribe',
            send: () => { },
            close: () => { },
            parseMessage: () => ({ text: 'Mock streaming text', isFinal: true, confidence: 0.95 })
        }
    }
}
