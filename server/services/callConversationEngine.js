/**
 * Call Conversation Engine
 *
 * Real-time bidirectional conversation pipeline for AI-powered phone calls.
 * Receives mulaw audio → STT → LLM → TTS → mulaw audio response.
 *
 * Uses the pluggable adapter system:
 *   - STT: Deepgram (streaming) for speech-to-text
 *   - LLM: OpenAI GPT-4o for conversation
 *   - Voice: ElevenLabs for text-to-speech
 *
 * Audio format: mulaw, 8000Hz, mono (Twilio standard)
 */

import { getAdaptersForUser } from './apiKeyService.js'

// Silence threshold — how long to wait after speech stops before processing
const SILENCE_THRESHOLD_MS = 800
// Max conversation turns before ending
const MAX_TURNS = 30
// Audio buffer size before sending to STT (in base64 chars ~= bytes)
const AUDIO_BUFFER_THRESHOLD = 3200

export class CallConversationEngine {
    constructor({ streamSid, callSid, leadId, scriptId, userId, context, onAudioResponse, onClearBuffer, onConversationEnd }) {
        this.streamSid = streamSid
        this.callSid = callSid
        this.leadId = leadId
        this.scriptId = scriptId
        this.userId = userId
        this.context = context
        this.onAudioResponse = onAudioResponse
        this.onClearBuffer = onClearBuffer
        this.onConversationEnd = onConversationEnd

        // Conversation state
        this.messages = []
        this.turnCount = 0
        this.isProcessing = false
        this.isSpeaking = false
        this.stopped = false

        // Audio buffer for incoming audio
        this.audioBuffer = ''
        this.silenceTimer = null
        this.lastAudioTime = 0

        // STT streaming session
        this.sttSession = null
        this.currentTranscript = ''
        this.interimTranscript = ''

        // Outcome tracking
        this.detectedOutcome = null
    }

    /**
     * Start the engine — initialize STT session and send greeting
     */
    async start() {
        console.log(`🧠 Conversation engine started: ${this.streamSid}`)

        // Initialize system message
        this.messages.push({
            role: 'system',
            content: this.context.systemPrompt
        })

        // Start STT streaming session
        await this._initSTTStream()

        // Send opening greeting
        const greeting = this.context.openingLine || this._getDefaultGreeting()
        await this._speak(greeting)
    }

    /**
     * Process incoming audio chunk from Twilio
     * @param {string} audioBase64 - Base64-encoded mulaw audio
     */
    async processAudio(audioBase64) {
        if (this.stopped) return

        this.lastAudioTime = Date.now()

        // If AI is speaking and we receive audio, user is interrupting
        if (this.isSpeaking) {
            this._handleInterruption()
        }

        // Feed audio to STT
        if (this.sttSession) {
            try {
                const audioBuffer = Buffer.from(audioBase64, 'base64')
                this.sttSession.send(audioBuffer)
            } catch (err) {
                // Buffer audio for batch processing if streaming fails
                this.audioBuffer += audioBase64
                this._processBufferedAudio()
            }
        } else {
            // No streaming session, accumulate audio
            this.audioBuffer += audioBase64
            this._scheduleBufferProcessing()
        }
    }

    /**
     * Stop the engine and cleanup
     */
    async stop() {
        this.stopped = true
        if (this.silenceTimer) clearTimeout(this.silenceTimer)
        if (this.sttSession) {
            try { this.sttSession.close() } catch {}
        }

        // Determine outcome from conversation
        const outcome = this._analyzeOutcome()
        if (this.onConversationEnd) {
            this.onConversationEnd(outcome)
        }

        console.log(`🧠 Conversation engine stopped: ${this.streamSid} (${this.turnCount} turns)`)
    }

    // ============================================
    // STT (Speech-to-Text) Pipeline
    // ============================================

    async _initSTTStream() {
        try {
            const { stt } = getAdaptersForUser(this.userId)
            if (!stt.streamTranscribe) {
                console.log('🧠 STT adapter does not support streaming, using buffered mode')
                return
            }

            this.sttSession = await stt.streamTranscribe({
                language: 'en-US',
                model: 'nova-2',
                encoding: 'mulaw',
                sampleRate: 8000,
                channels: 1,
                interimResults: true,
                endpointing: SILENCE_THRESHOLD_MS,
                onTranscript: (transcript) => {
                    this._handleTranscript(transcript)
                },
                onError: (err) => {
                    console.error('STT stream error:', err.message)
                }
            })
        } catch (err) {
            console.error('STT stream init failed:', err.message)
            // Fall back to buffered mode
            this.sttSession = null
        }
    }

    /**
     * Handle transcript from STT (interim or final)
     */
    _handleTranscript(transcript) {
        if (this.stopped) return

        if (transcript.isFinal) {
            const text = transcript.text?.trim()
            if (!text) return

            console.log(`🧠 [STT Final] "${text}"`)
            this.currentTranscript = text
            this.interimTranscript = ''

            // Process the final transcript
            this._handleUserSpeech(text)
        } else {
            this.interimTranscript = transcript.text?.trim() || ''
        }
    }

    /**
     * Schedule buffer processing for non-streaming STT
     */
    _scheduleBufferProcessing() {
        if (this.silenceTimer) clearTimeout(this.silenceTimer)
        this.silenceTimer = setTimeout(() => {
            this._processBufferedAudio()
        }, SILENCE_THRESHOLD_MS)
    }

    /**
     * Process accumulated audio buffer through batch STT
     */
    async _processBufferedAudio() {
        if (!this.audioBuffer || this.isProcessing) return

        const audioData = this.audioBuffer
        this.audioBuffer = ''

        if (audioData.length < AUDIO_BUFFER_THRESHOLD) return

        try {
            const { stt } = getAdaptersForUser(this.userId)
            const result = await stt.transcribe({
                audioBuffer: Buffer.from(audioData, 'base64'),
                encoding: 'mulaw',
                sampleRate: 8000,
                language: 'en-US',
            })

            if (result.text?.trim()) {
                this._handleUserSpeech(result.text.trim())
            }
        } catch (err) {
            console.error('Buffered STT error:', err.message)
        }
    }

    // ============================================
    // LLM (Language Model) Pipeline
    // ============================================

    /**
     * Handle transcribed user speech — send to LLM for response
     */
    async _handleUserSpeech(text) {
        if (this.isProcessing || this.stopped) return
        this.isProcessing = true

        try {
            // Add user message to conversation history
            this.messages.push({ role: 'user', content: text })
            this.turnCount++

            // Check for conversation enders
            if (this._isConversationEnder(text)) {
                await this._speak("Thanks for your time! Have a great day. Goodbye.")
                this.detectedOutcome = this._classifyIntent(text)
                setTimeout(() => this.stop(), 3000)
                return
            }

            // Check max turns
            if (this.turnCount >= MAX_TURNS) {
                await this._speak("I appreciate your time. Let me send you the details via text so you can review at your convenience. Thanks!")
                this.detectedOutcome = { result: 'follow-up', sentiment: 'neutral' }
                setTimeout(() => this.stop(), 3000)
                return
            }

            // Get LLM response
            const { llm } = getAdaptersForUser(this.userId)
            const response = await llm.complete({
                messages: this.messages,
                model: 'gpt-4o-mini',
                temperature: 0.7,
                maxTokens: 150, // Keep responses short for phone
            })

            const aiText = response.content?.trim()
            if (!aiText) {
                this.isProcessing = false
                return
            }

            // Add AI response to history
            this.messages.push({ role: 'assistant', content: aiText })

            // Detect outcome from the conversation
            this._detectOutcome(text, aiText)

            // Speak the response
            await this._speak(aiText)

        } catch (err) {
            console.error('LLM pipeline error:', err.message)
        } finally {
            this.isProcessing = false
        }
    }

    // ============================================
    // TTS (Text-to-Speech) Pipeline
    // ============================================

    /**
     * Synthesize text to speech and send audio back to Twilio
     */
    async _speak(text) {
        if (this.stopped) return

        this.isSpeaking = true
        console.log(`🧠 [TTS] "${text.substring(0, 80)}..."`)

        try {
            const { voice } = getAdaptersForUser(this.userId)
            const result = await voice.synthesize({
                text,
                voiceId: this.context.voiceId || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam
                model: 'eleven_turbo_v2',
                outputFormat: 'ulaw_8000', // Twilio-compatible format
            })

            if (result.audioBuffer && this.onAudioResponse) {
                // Convert to base64 for Twilio Media Stream
                const base64Audio = Buffer.isBuffer(result.audioBuffer)
                    ? result.audioBuffer.toString('base64')
                    : result.audioBuffer

                // Send audio in chunks (Twilio expects chunks, not one big payload)
                const chunkSize = 640 // ~80ms of mulaw audio at 8kHz
                for (let i = 0; i < base64Audio.length; i += chunkSize) {
                    if (this.stopped) break
                    const chunk = base64Audio.slice(i, i + chunkSize)
                    this.onAudioResponse(chunk)
                }
            }
        } catch (err) {
            console.error('TTS error:', err.message)
        } finally {
            this.isSpeaking = false
        }
    }

    // ============================================
    // Conversation Intelligence
    // ============================================

    /**
     * Handle user interruption while AI is speaking
     */
    _handleInterruption() {
        if (!this.isSpeaking) return

        console.log('🧠 User interruption detected — clearing buffer')
        this.isSpeaking = false
        if (this.onClearBuffer) this.onClearBuffer()
    }

    /**
     * Check if user's response is a conversation ender
     */
    _isConversationEnder(text) {
        const lower = text.toLowerCase()
        const enders = [
            'goodbye', 'bye', 'not interested', 'no thanks', 'no thank you',
            'take me off', 'don\'t call', 'stop calling', 'remove my number',
            'i gotta go', 'i have to go', 'talk later'
        ]
        return enders.some(e => lower.includes(e))
    }

    /**
     * Classify user intent from their speech
     */
    _classifyIntent(text) {
        const lower = text.toLowerCase()
        if (lower.includes('not interested') || lower.includes('no thanks') || lower.includes('no thank you')) {
            return { result: 'not-interested', sentiment: 'negative' }
        }
        if (lower.includes('stop') || lower.includes('don\'t call') || lower.includes('remove')) {
            return { result: 'not-interested', sentiment: 'negative' }
        }
        if (lower.includes('bye') || lower.includes('gotta go')) {
            return { result: 'follow-up', sentiment: 'neutral' }
        }
        return { result: 'completed', sentiment: 'neutral' }
    }

    /**
     * Detect outcome signals during conversation
     */
    _detectOutcome(userText, aiText) {
        const lower = userText.toLowerCase()

        // Positive signals
        if (lower.includes('interested') || lower.includes('sign me up') ||
            lower.includes('sounds good') || lower.includes('send me') ||
            lower.includes('yes') || lower.includes('sure') ||
            lower.includes('let\'s do it') || lower.includes('i\'m in')) {
            this.detectedOutcome = { result: 'interested', sentiment: 'positive' }
        }

        // Negative signals
        if (lower.includes('not interested') || lower.includes('no thanks') ||
            lower.includes('don\'t need') || lower.includes('already have')) {
            this.detectedOutcome = { result: 'not-interested', sentiment: 'negative' }
        }

        // Callback signals
        if (lower.includes('call back') || lower.includes('busy right now') ||
            lower.includes('bad time') || lower.includes('later')) {
            this.detectedOutcome = { result: 'callback', sentiment: 'neutral' }
        }

        // Pricing discussion
        if (lower.includes('how much') || lower.includes('price') || lower.includes('cost')) {
            // They're asking about pricing — this is interest!
            if (!this.detectedOutcome || this.detectedOutcome.result !== 'interested') {
                this.detectedOutcome = { result: 'interested', sentiment: 'positive' }
            }
        }
    }

    /**
     * Analyze full conversation to determine final outcome
     */
    _analyzeOutcome() {
        if (this.detectedOutcome) {
            return {
                ...this.detectedOutcome,
                summary: this._generateSummary()
            }
        }

        // Default based on conversation length
        if (this.turnCount <= 1) {
            return { result: 'voicemail', sentiment: 'neutral', summary: 'Call ended quickly, likely no answer or hangup.' }
        }
        if (this.turnCount <= 3) {
            return { result: 'not-interested', sentiment: 'neutral', summary: 'Short conversation, unclear interest.' }
        }
        return { result: 'follow-up', sentiment: 'neutral', summary: this._generateSummary() }
    }

    /**
     * Generate a brief summary of the conversation
     */
    _generateSummary() {
        const userMessages = this.messages.filter(m => m.role === 'user').map(m => m.content)
        if (userMessages.length === 0) return 'No conversation — call may have been unanswered.'

        const topics = []
        const allText = userMessages.join(' ').toLowerCase()
        if (allText.includes('interest') || allText.includes('yes')) topics.push('showed interest')
        if (allText.includes('price') || allText.includes('cost') || allText.includes('how much')) topics.push('asked about pricing')
        if (allText.includes('busy') || allText.includes('later') || allText.includes('call back')) topics.push('requested callback')
        if (allText.includes('no') || allText.includes('not interested')) topics.push('declined')

        return `${this.turnCount} turns. ${topics.length > 0 ? topics.join(', ') + '.' : 'General conversation.'}`
    }

    _getDefaultGreeting() {
        return `Hi ${this.context.contractorName}, my name is Mike from Henderson EV Charger Pros. How are you doing today?`
    }
}

export default CallConversationEngine
