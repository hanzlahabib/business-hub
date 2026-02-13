/**
 * Transcription Service
 *
 * Transcribes call recordings using the STT adapter (Deepgram).
 * Also generates AI summaries + action items using the LLM adapter.
 *
 * Flow:
 *   1. Fetch recording audio from Twilio URL
 *   2. Transcribe via STT adapter
 *   3. Summarize via LLM adapter
 *   4. Save to Call record + create MeetingNote
 */

import prisma from '../config/prisma.js'
import { getAdaptersForUser } from './apiKeyService.js'

export const transcriptionService = {
    /**
     * Transcribe a call recording and save results
     * @param {string} callId — Call record ID
     * @param {string} userId
     */
    async transcribeCall(callId, userId) {
        const call = await prisma.call.findFirst({
            where: { id: callId, userId },
            include: { lead: true }
        })
        if (!call) throw new Error('Call not found')
        if (!call.recordingUrl) throw new Error('No recording URL for this call')

        console.log(`📝 Transcribing call ${callId}: ${call.recordingUrl}`)

        // Step 1: Transcribe audio
        const { stt } = getAdaptersForUser(userId)
        const transcription = await stt.transcribe({
            audioUrl: call.recordingUrl,
            language: 'en-US',
            model: 'nova-2',
        })

        if (!transcription.text) {
            throw new Error('Transcription returned empty text')
        }

        console.log(`📝 Transcription complete: ${transcription.text.length} chars`)

        // Step 2: Save raw transcription
        await prisma.call.update({
            where: { id: callId },
            data: { transcription: transcription.text }
        })

        // Step 3: Generate AI summary
        const summary = await this._generateSummary(transcription.text, call.lead, userId)

        // Step 4: Update call with summary
        await prisma.call.update({
            where: { id: callId },
            data: {
                summary: summary.summary,
                sentiment: summary.sentiment,
                outcome: summary.outcome || call.outcome
            }
        })

        // Step 5: Create MeetingNote
        const note = await prisma.meetingNote.create({
            data: {
                callId,
                content: transcription.text,
                summary: summary.summary,
                actionItems: summary.actionItems || [],
                decisions: summary.decisions || [],
                followUpDate: summary.followUpDate ? new Date(summary.followUpDate) : null,
                tags: ['auto-transcribed'],
                userId
            }
        })

        console.log(`📝 Meeting note created: ${note.id}`)

        return {
            transcription: transcription.text,
            summary: summary.summary,
            sentiment: summary.sentiment,
            actionItems: summary.actionItems,
            noteId: note.id
        }
    },

    /**
     * Batch transcribe all untranscribed calls
     */
    async transcribeUntranscribed(userId, limit = 10) {
        const calls = await prisma.call.findMany({
            where: {
                userId,
                recordingUrl: { not: null },
                transcription: null,
                status: 'completed'
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        })

        console.log(`📝 Found ${calls.length} calls to transcribe`)

        const results = []
        for (const call of calls) {
            try {
                const result = await this.transcribeCall(call.id, userId)
                results.push({ callId: call.id, success: true, ...result })
            } catch (err) {
                console.error(`Transcription failed for ${call.id}:`, err.message)
                results.push({ callId: call.id, success: false, error: err.message })
            }
        }

        return results
    },

    /**
     * Generate AI summary from transcription text
     */
    async _generateSummary(text, lead, userId) {
        try {
            const { llm } = getAdaptersForUser(userId)
            const result = await llm.complete({
                messages: [
                    {
                        role: 'system',
                        content: `You are analyzing a phone call transcript between a sales rep (Mike) and a contractor (${lead?.contactPerson || 'unknown'} from ${lead?.name || 'unknown company'}).

Respond in JSON format with these fields:
- summary: 2-3 sentence summary of the call
- sentiment: "positive", "neutral", or "negative"
- outcome: "interested", "not-interested", "callback", "voicemail", or "unclear"
- actionItems: array of {task, assignee, deadline} objects
- decisions: array of key decisions made
- followUpDate: ISO date string if a follow-up was agreed, null otherwise`
                    },
                    { role: 'user', content: `Analyze this call transcript:\n\n${text}` }
                ],
                temperature: 0.3,
                maxTokens: 500
            })

            try {
                const parsed = JSON.parse(result.content)
                return parsed
            } catch {
                // If LLM didn't return valid JSON, use the raw text as summary
                return {
                    summary: result.content?.slice(0, 500) || 'Summary generation failed',
                    sentiment: 'neutral',
                    outcome: null,
                    actionItems: [],
                    decisions: []
                }
            }
        } catch (err) {
            console.error('Summary generation error:', err.message)
            return {
                summary: `Call with ${lead?.name || 'unknown'}. Transcription available.`,
                sentiment: 'neutral',
                outcome: null,
                actionItems: [],
                decisions: []
            }
        }
    }
}

export default transcriptionService
