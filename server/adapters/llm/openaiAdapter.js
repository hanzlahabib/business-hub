/**
 * OpenAI LLM Adapter
 * 
 * Chat completions, script generation, rate negotiation, summarization.
 * Docs: https://platform.openai.com/docs/api-reference
 * 
 * Swap out by setting LLM_PROVIDER=claude in .env
 */

import { LLMAdapter } from './interface.js'

export class OpenAIAdapter extends LLMAdapter {
    constructor(config = {}) {
        super(config)
        this.providerName = 'openai'
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY
        this.defaultModel = config.model || 'gpt-4o-mini'
        this.baseUrl = 'https://api.openai.com/v1'
    }

    async _request(endpoint, body) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        if (!res.ok) {
            const error = await res.text()
            throw new Error(`OpenAI API error (${res.status}): ${error}`)
        }
        return res.json()
    }

    async complete({ messages, model, temperature = 0.7, maxTokens = 2000, tools }) {
        const body = {
            model: model || this.defaultModel,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(tools && { tools, tool_choice: 'auto' })
        }

        const result = await this._request('/chat/completions', body)
        const choice = result.choices?.[0]

        return {
            content: choice?.message?.content || '',
            toolCalls: choice?.message?.tool_calls || [],
            usage: result.usage || {}
        }
    }

    async generateScript({ purpose, industry, rateRange, context = '' }) {
        const prompt = `Generate a professional outbound sales call script.

Purpose: ${purpose}
Industry: ${industry || 'General'}
${rateRange ? `Rate Range: $${rateRange.min} - $${rateRange.max} (target: $${rateRange.target} ${rateRange.currency || 'USD'})` : ''}
${context ? `Additional Context: ${context}` : ''}

Return a JSON object with:
- openingLine: A warm, professional greeting (1-2 sentences)
- talkingPoints: Array of { topic, script, fallback } (3-5 points)
- objectionHandlers: Array of { objection, response } (3-5 common objections)
- closingStrategy: How to close the deal (1-2 paragraphs)

Return ONLY valid JSON, no markdown.`

        const { content } = await this.complete({
            messages: [
                { role: 'system', content: 'You are an expert sales script writer. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            model: 'gpt-4o',
            temperature: 0.8
        })

        try {
            return JSON.parse(content)
        } catch {
            // If JSON parsing fails, return structured fallback
            return {
                openingLine: content.slice(0, 200),
                talkingPoints: [],
                objectionHandlers: [],
                closingStrategy: content
            }
        }
    }

    async negotiateRate({ leadData, currentRate, targetRate, history = [], marketContext = '' }) {
        const prompt = `You are a rate negotiation strategist. Analyze and suggest the best approach.

Lead: ${leadData.name} (${leadData.industry || 'unknown industry'})
Current Proposed Rate: $${currentRate}
Our Target Rate: $${targetRate}
${history.length > 0 ? `Negotiation History: ${JSON.stringify(history)}` : ''}
${marketContext ? `Market Context: ${marketContext}` : ''}

Return a JSON object with:
- strategy: Brief strategy description
- suggestedRate: Number - the rate to propose
- reasoning: Why this rate works
- counterArguments: Array of strings - arguments to support our rate
- walkAwayPoint: Number - the minimum acceptable rate
- confidence: Number 0-100 - confidence in closing

Return ONLY valid JSON.`

        const { content } = await this.complete({
            messages: [
                { role: 'system', content: 'You are an expert rate negotiator. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            model: 'gpt-4o',
            temperature: 0.5
        })

        try {
            return JSON.parse(content)
        } catch {
            return { strategy: content, suggestedRate: targetRate, reasoning: '', counterArguments: [], confidence: 50 }
        }
    }

    async summarize({ text, type = 'call', extractActionItems = true }) {
        const prompt = `Summarize this ${type} transcription/content concisely.

Content:
${text.slice(0, 8000)}

Return a JSON object with:
- summary: 2-3 sentence summary of key points
- sentiment: 'positive', 'neutral', or 'negative'
${extractActionItems ? `- actionItems: Array of { task, assignee, deadline } (if any mentioned)
- decisions: Array of strings - key decisions made` : ''}

Return ONLY valid JSON.`

        const { content } = await this.complete({
            messages: [
                { role: 'system', content: 'You are a professional meeting note summarizer. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3
        })

        try {
            return JSON.parse(content)
        } catch {
            return { summary: content, sentiment: 'neutral', actionItems: [], decisions: [] }
        }
    }
}

export default OpenAIAdapter
