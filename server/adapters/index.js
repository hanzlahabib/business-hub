/**
 * Adapter Factory
 * 
 * Reads provider config from .env and returns the appropriate adapter instances.
 * This is the ONLY file services import — never import adapters directly.
 * 
 * Usage:
 *   import { getAdapters } from '../adapters/index.js'
 *   const { telephony, voice, llm, stt } = getAdapters()
 * 
 * Switch providers by changing .env:
 *   TELEPHONY_PROVIDER=vapi|mock
 *   VOICE_PROVIDER=elevenlabs|mock
 *   LLM_PROVIDER=openai|mock
 *   STT_PROVIDER=deepgram|mock
 *   CALLING_MOCK_MODE=true  (overrides all to mock)
 */

import { VapiAdapter } from './telephony/vapiAdapter.js'
import { ElevenLabsAdapter } from './voice/elevenLabsAdapter.js'
import { OpenAIAdapter } from './llm/openaiAdapter.js'
import { DeepgramAdapter } from './stt/deepgramAdapter.js'
import {
    MockTelephonyAdapter,
    MockVoiceAdapter,
    MockLLMAdapter,
    MockSTTAdapter
} from './mock.js'

// Adapter registries — add new adapters here
const TELEPHONY_ADAPTERS = {
    vapi: VapiAdapter,
    mock: MockTelephonyAdapter
}

const VOICE_ADAPTERS = {
    elevenlabs: ElevenLabsAdapter,
    mock: MockVoiceAdapter
}

const LLM_ADAPTERS = {
    openai: OpenAIAdapter,
    mock: MockLLMAdapter
}

const STT_ADAPTERS = {
    deepgram: DeepgramAdapter,
    mock: MockSTTAdapter
}

// Singleton instances (created once, reused)
let _adapters = null

/**
 * Get adapter instances based on environment config.
 * Instances are cached as singletons after first call.
 * 
 * @param {boolean} force - Force re-creation of adapters
 * @returns {{ telephony, voice, llm, stt }}
 */
export function getAdapters(force = false) {
    if (_adapters && !force) return _adapters

    const isMockMode = process.env.CALLING_MOCK_MODE === 'true'

    const telephonyProvider = isMockMode ? 'mock' : (process.env.TELEPHONY_PROVIDER || 'vapi')
    const voiceProvider = isMockMode ? 'mock' : (process.env.VOICE_PROVIDER || 'elevenlabs')
    const llmProvider = isMockMode ? 'mock' : (process.env.LLM_PROVIDER || 'openai')
    const sttProvider = isMockMode ? 'mock' : (process.env.STT_PROVIDER || 'deepgram')

    const TelephonyClass = TELEPHONY_ADAPTERS[telephonyProvider]
    const VoiceClass = VOICE_ADAPTERS[voiceProvider]
    const LLMClass = LLM_ADAPTERS[llmProvider]
    const STTClass = STT_ADAPTERS[sttProvider]

    if (!TelephonyClass) throw new Error(`Unknown telephony provider: ${telephonyProvider}. Available: ${Object.keys(TELEPHONY_ADAPTERS).join(', ')}`)
    if (!VoiceClass) throw new Error(`Unknown voice provider: ${voiceProvider}. Available: ${Object.keys(VOICE_ADAPTERS).join(', ')}`)
    if (!LLMClass) throw new Error(`Unknown LLM provider: ${llmProvider}. Available: ${Object.keys(LLM_ADAPTERS).join(', ')}`)
    if (!STTClass) throw new Error(`Unknown STT provider: ${sttProvider}. Available: ${Object.keys(STT_ADAPTERS).join(', ')}`)

    _adapters = {
        telephony: new TelephonyClass(),
        voice: new VoiceClass(),
        llm: new LLMClass(),
        stt: new STTClass()
    }

    console.log(`🔌 Adapters loaded: telephony=${telephonyProvider}, voice=${voiceProvider}, llm=${llmProvider}, stt=${sttProvider}`)

    return _adapters
}

/**
 * Get info about currently active adapters
 * @returns {Object} - { telephony, voice, llm, stt } provider names
 */
export function getAdapterInfo() {
    const adapters = getAdapters()
    return {
        telephony: adapters.telephony.providerName,
        voice: adapters.voice.providerName,
        llm: adapters.llm.providerName,
        stt: adapters.stt.providerName,
        mockMode: process.env.CALLING_MOCK_MODE === 'true'
    }
}

export default getAdapters
