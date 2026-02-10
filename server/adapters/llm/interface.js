/**
 * LLMAdapter Interface
 * 
 * All LLM providers must implement this interface.
 * Swap providers by changing LLM_PROVIDER in .env
 * 
 * Implementations: openaiAdapter, claudeAdapter, mockAdapter
 */

export class LLMAdapter {
    constructor(config = {}) {
        this.config = config
        this.providerName = 'base'
    }

    /**
     * Generate a chat completion
     * @param {Object} params - { messages, model, temperature, maxTokens, tools }
     * @returns {Object} - { content, toolCalls, usage }
     */
    async complete(params) {
        throw new Error('complete() must be implemented by adapter')
    }

    /**
     * Generate a call script using AI
     * @param {Object} params - { purpose, industry, rateRange, context }
     * @returns {Object} - { openingLine, talkingPoints, objectionHandlers, closingStrategy }
     */
    async generateScript(params) {
        throw new Error('generateScript() must be implemented by adapter')
    }

    /**
     * Generate rate negotiation strategy
     * @param {Object} params - { leadData, currentRate, targetRate, history }
     * @returns {Object} - { strategy, suggestedRate, reasoning, counterArguments }
     */
    async negotiateRate(params) {
        throw new Error('negotiateRate() must be implemented by adapter')
    }

    /**
     * Summarize text (transcription, notes, etc.)
     * @param {Object} params - { text, type, extractActionItems }
     * @returns {Object} - { summary, actionItems, decisions, sentiment }
     */
    async summarize(params) {
        throw new Error('summarize() must be implemented by adapter')
    }
}

export default LLMAdapter
