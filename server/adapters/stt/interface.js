/**
 * STTAdapter Interface (Speech-to-Text)
 * 
 * All transcription providers must implement this interface.
 * Swap providers by changing STT_PROVIDER in .env
 * 
 * Implementations: deepgramAdapter, whisperAdapter, mockAdapter
 */

export class STTAdapter {
    constructor(config = {}) {
        this.config = config
        this.providerName = 'base'
    }

    /**
     * Transcribe audio from a URL or buffer
     * @param {Object} params - { audioUrl, audioBuffer, language, model }
     * @returns {Object} - { text, words, confidence, duration }
     */
    async transcribe(params) {
        throw new Error('transcribe() must be implemented by adapter')
    }

    /**
     * Start a real-time streaming transcription session
     * @param {Object} params - { language, model, onTranscript }
     * @returns {Object} - { sessionId, send(audioChunk), close() }
     */
    async streamTranscribe(params) {
        throw new Error('streamTranscribe() must be implemented by adapter')
    }
}

export default STTAdapter
