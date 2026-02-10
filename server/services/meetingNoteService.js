/**
 * Meeting Note Service — Transcription + AI Summarization
 * 
 * Uses STTAdapter for transcription, LLMAdapter for summarization.
 */

import prisma from '../config/prisma.js'
import { getAdapters } from '../adapters/index.js'

export const meetingNoteService = {
    async getByCall(callId, userId) {
        return prisma.meetingNote.findMany({
            where: { callId, userId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async create(userId, callId, data) {
        const call = await prisma.call.findFirst({ where: { id: callId, userId } })
        if (!call) throw new Error('Call not found')

        return prisma.meetingNote.create({
            data: {
                callId,
                content: data.content,
                summary: data.summary || undefined,
                actionItems: data.actionItems || undefined,
                decisions: data.decisions || undefined,
                followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
                tags: data.tags || undefined,
                userId
            }
        })
    },

    async update(id, userId, data) {
        const note = await prisma.meetingNote.findFirst({ where: { id, userId } })
        if (!note) throw new Error('Note not found')
        return prisma.meetingNote.update({ where: { id }, data })
    },

    /**
     * Transcribe a call recording and create meeting notes
     */
    async transcribeAndSummarize(userId, callId) {
        const { stt, llm } = getAdapters()

        const call = await prisma.call.findFirst({ where: { id: callId, userId } })
        if (!call) throw new Error('Call not found')
        if (!call.recordingUrl) throw new Error('No recording available for this call')

        // Step 1: Transcribe
        const transcription = await stt.transcribe({ audioUrl: call.recordingUrl })

        // Step 2: Summarize with AI
        const summary = await llm.summarize({
            text: transcription.text,
            type: 'call',
            extractActionItems: true
        })

        // Step 3: Save transcription on call
        await prisma.call.update({
            where: { id: callId },
            data: {
                transcription: transcription.text,
                summary: summary.summary,
                sentiment: summary.sentiment
            }
        })

        // Step 4: Create meeting note
        const note = await prisma.meetingNote.create({
            data: {
                callId,
                content: transcription.text,
                summary: summary.summary,
                actionItems: summary.actionItems || [],
                decisions: summary.decisions || [],
                userId
            }
        })

        return { transcription: transcription.text, note, summary }
    }
}

export default meetingNoteService
