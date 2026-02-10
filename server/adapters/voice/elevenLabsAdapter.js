/**
 * ElevenLabs Voice Adapter (TTS)
 * 
 * High-quality text-to-speech via ElevenLabs API.
 * Docs: https://docs.elevenlabs.io/api-reference
 * 
 * Swap out by setting VOICE_PROVIDER=openai in .env
 */

import { VoiceAdapter } from './interface.js'

export class ElevenLabsAdapter extends VoiceAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'elevenlabs'
        this.apiKey = config.apiKey || process.env.ELEVENLABS_API_KEY
        this.defaultVoiceId = config.voiceId || process.env.ELEVENLABS_VOICE_ID || 'rachel'
        this.baseUrl = 'https://api.elevenlabs.io/v1'
    }

    async _request(endpoint, method = 'GET', body = null, parseJson = true) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json'
            },
            ...(body && { body: JSON.stringify(body) })
        })
        if (!res.ok) {
            const error = await res.text()
            throw new Error(`ElevenLabs API error (${res.status}): ${error}`)
        }
        return parseJson ? res.json() : res.arrayBuffer()
    }

    async synthesize({ text, voiceId, model = 'eleven_multilingual_v2', outputFormat = 'mp3_44100_128' }) {
        const vid = voiceId || this.defaultVoiceId
        const audioBuffer = await this._request(
            `/text-to-speech/${vid}?output_format=${outputFormat}`,
            'POST',
            {
                text,
                model_id: model,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.5,
                    use_speaker_boost: true
                }
            },
            false // return raw buffer
        )

        return {
            audioBuffer,
            contentType: `audio/${outputFormat.split('_')[0]}`,
            duration: null // ElevenLabs doesn't return duration directly
        }
    }

    async getVoices() {
        const result = await this._request('/voices')
        return (result.voices || []).map(v => ({
            id: v.voice_id,
            name: v.name,
            language: v.labels?.language || 'en',
            category: v.category,
            preview_url: v.preview_url,
            description: v.labels?.description || ''
        }))
    }

    async cloneVoice({ name, audioFiles, description = '' }) {
        // Voice cloning requires multipart form data — simplified here
        const formData = new FormData()
        formData.append('name', name)
        formData.append('description', description)
        for (const file of audioFiles) {
            formData.append('files', file)
        }

        const res = await fetch(`${this.baseUrl}/voices/add`, {
            method: 'POST',
            headers: { 'xi-api-key': this.apiKey },
            body: formData
        })

        if (!res.ok) throw new Error(`Voice clone failed: ${await res.text()}`)
        const result = await res.json()

        return {
            voiceId: result.voice_id,
            name
        }
    }
}

export default ElevenLabsAdapter
