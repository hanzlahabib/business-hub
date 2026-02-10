/**
 * VoiceAdapter Interface (TTS)
 * 
 * All text-to-speech providers must implement this interface.
 * Swap providers by changing VOICE_PROVIDER in .env
 * 
 * Implementations: elevenLabsAdapter, openaiTTSAdapter, mockAdapter
 */

export class VoiceAdapter {
    constructor(config = {}) {
        this.config = config
        this.providerName = 'base'
    }

    /**
     * Synthesize text to speech audio
     * @param {Object} params - { text, voiceId, model, outputFormat }
     * @returns {Object} - { audioBuffer, contentType, duration }
     */
    async synthesize(params) {
        throw new Error('synthesize() must be implemented by adapter')
    }

    /**
     * List available voices
     * @returns {Array} - [{ id, name, language, preview_url }]
     */
    async getVoices() {
        throw new Error('getVoices() must be implemented by adapter')
    }

    /**
     * Clone a voice from audio samples
     * @param {Object} params - { name, audioFiles, description }
     * @returns {Object} - { voiceId, name }
     */
    async cloneVoice(params) {
        throw new Error('cloneVoice() must be implemented by adapter')
    }
}

export default VoiceAdapter
