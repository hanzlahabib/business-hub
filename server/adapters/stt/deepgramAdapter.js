/**
 * Deepgram STT Adapter (Speech-to-Text)
 * 
 * Transcription via Deepgram Nova-3 API.
 * Docs: https://developers.deepgram.com
 * 
 * Swap out by setting STT_PROVIDER=whisper in .env
 */

import { STTAdapter } from './interface.js'

export class DeepgramAdapter extends STTAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'deepgram'
        this.apiKey = config.apiKey || process.env.DEEPGRAM_API_KEY
        this.baseUrl = 'https://api.deepgram.com/v1'
        this.defaultModel = config.model || 'nova-2'
    }

    async transcribe({ audioUrl, audioBuffer, language = 'en', model }) {
        const params = new URLSearchParams({
            model: model || this.defaultModel,
            language,
            smart_format: 'true',
            punctuate: 'true',
            diarize: 'true',        // speaker detection
            utterances: 'true',
            paragraphs: 'true'
        })

        let res
        if (audioUrl) {
            // Transcribe from URL
            res = await fetch(`${this.baseUrl}/listen?${params}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: audioUrl })
            })
        } else if (audioBuffer) {
            // Transcribe from buffer
            res = await fetch(`${this.baseUrl}/listen?${params}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'audio/wav'
                },
                body: audioBuffer
            })
        } else {
            throw new Error('Either audioUrl or audioBuffer is required')
        }

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`Deepgram API error (${res.status}): ${error}`)
        }

        const result = await res.json()
        const channel = result.results?.channels?.[0]
        const alternative = channel?.alternatives?.[0]

        return {
            text: alternative?.transcript || '',
            words: (alternative?.words || []).map(w => ({
                word: w.word,
                start: w.start,
                end: w.end,
                confidence: w.confidence,
                speaker: w.speaker
            })),
            paragraphs: alternative?.paragraphs?.paragraphs || [],
            confidence: alternative?.confidence || 0,
            duration: result.metadata?.duration || null
        }
    }

    async streamTranscribe({ language = 'en', model, onTranscript }) {
        // WebSocket-based streaming transcription
        const params = new URLSearchParams({
            model: model || this.defaultModel,
            language,
            smart_format: 'true',
            punctuate: 'true',
            interim_results: 'true',
            endpointing: '300',
            vad_events: 'true'
        })

        const wsUrl = `wss://api.deepgram.com/v1/listen?${params}`

        // Return a session object — caller manages the WebSocket lifecycle
        return {
            wsUrl,
            headers: { 'Authorization': `Token ${this.apiKey}` },
            onTranscript,
            // Helper to parse Deepgram WS messages
            parseMessage(data) {
                try {
                    const msg = JSON.parse(data)
                    if (msg.type === 'Results') {
                        const alt = msg.channel?.alternatives?.[0]
                        return {
                            text: alt?.transcript || '',
                            isFinal: msg.is_final || false,
                            confidence: alt?.confidence || 0,
                            words: alt?.words || []
                        }
                    }
                    return null
                } catch {
                    return null
                }
            }
        }
    }
}

export default DeepgramAdapter
