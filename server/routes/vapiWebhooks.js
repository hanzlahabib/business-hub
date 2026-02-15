/**
 * Vapi AI Webhook Routes
 *
 * These endpoints are called BY Vapi during/after calls.
 * NO auth middleware — Vapi cannot send our auth headers.
 *
 * Vapi webhook events:
 *   - status-update: Call status changed (ringing, in-progress, completed)
 *   - end-of-call-report: Full call report with transcript, summary, recording
 *   - speech-update: Real-time speech events
 *   - transcript: Real-time transcript chunks
 *   - tool-calls: Function calling during conversation
 *   - hang: Call ended
 *
 * Server URL must be configured in Vapi Dashboard:
 *   Phone Numbers → Your Number → Server URL
 */

import express from 'express'
import prisma from '../config/prisma.js'
import dncService from '../services/dncService.js'
import campaignService from '../services/campaignService.js'
import { callLogService } from '../services/callLogService.js'
import logger from '../config/logger.js'
import { emitCallUpdate, emitAgentLog } from '../services/callWebSocket.js'

const router = express.Router()

/**
 * POST /api/calls/vapi/webhook
 * Main Vapi webhook handler — processes all event types
 */
router.post('/webhook', async (req, res) => {
    const { message } = req.body

    if (!message) {
        return res.json({ success: false, error: 'No message in payload' })
    }

    const type = message.type
    const callData = message.call || {}
    const callId = callData.id
    const metadata = callData.metadata || {}
    const leadId = metadata.leadId
    const scriptId = metadata.scriptId

    logger.info('Vapi webhook received', { type, callId, leadId })

    // Log webhook to CallLog if we can find the call
    const dbCall = callId ? await prisma.call.findFirst({
        where: { providerCallId: callId },
        select: { id: true, userId: true }
    }) : null

    if (dbCall) {
        await callLogService.log(dbCall.id, dbCall.userId, 'webhook-received',
            `Webhook: ${type}`,
            { type, status: message.status, endedReason: message.endedReason }, 'info'
        )
    }

    try {
        switch (type) {
            case 'status-update':
                await handleStatusUpdate(callId, callData, message, dbCall)
                break

            case 'end-of-call-report':
                await handleEndOfCallReport(callId, callData, message, metadata)
                break

            case 'transcript':
                await handleTranscript(callId, message)
                break

            case 'speech-update':
                emitCallUpdate(callId, {
                    status: 'in-progress',
                    speechEvent: message.role,
                    text: message.transcript || ''
                })
                break

            case 'tool-calls':
                logger.info('Vapi tool call', { callId, tools: message.toolCalls })
                res.json({ results: [] })
                return

            case 'hang':
                logger.info('Vapi call hung up', { callId })
                break

            default:
                logger.info('Vapi unknown event', { type, callId })
        }
    } catch (err) {
        logger.error('Vapi webhook error', { type, callId, error: err.message })
        if (dbCall) {
            await callLogService.log(dbCall.id, dbCall.userId, 'error',
                `Webhook processing error: ${err.message}`,
                { type, error: err.message }, 'error'
            )
        }
    }

    res.json({ success: true })
})

/**
 * Handle call status update
 */
async function handleStatusUpdate(providerCallId, callData, message, dbCall) {
    if (!providerCallId) return

    const statusMap = {
        'queued': 'queued',
        'ringing': 'ringing',
        'in-progress': 'in-progress',
        'forwarding': 'in-progress',
        'ended': 'completed',
    }

    const status = statusMap[message.status] || message.status

    const updateData = { status }
    if (status === 'in-progress') {
        updateData.startedAt = new Date()
    }
    if (status === 'completed') {
        updateData.endedAt = new Date()
    }

    await prisma.call.updateMany({
        where: { providerCallId },
        data: updateData
    })

    if (dbCall) {
        await callLogService.log(dbCall.id, dbCall.userId, 'status-change',
            `Status changed to: ${status}`,
            { from: message.status, mapped: status }, 'info'
        )
    }

    emitCallUpdate(providerCallId, { status })
}

/**
 * Handle end-of-call report — the gold mine
 * Contains transcript, summary, recording URL, cost, duration
 */
async function handleEndOfCallReport(providerCallId, callData, message, metadata) {
    if (!providerCallId) return

    const transcript = message.transcript || ''
    const summary = message.summary || ''
    const recordingUrl = message.recordingUrl || callData.recordingUrl || null
    const duration = message.endedAt && message.startedAt
        ? Math.round((new Date(message.endedAt) - new Date(message.startedAt)) / 1000)
        : callData.duration || null
    const cost = message.cost || callData.cost || null
    const endedReason = message.endedReason || ''

    // Analyze conversation for outcome
    const analysis = analyzeConversation(transcript, summary, endedReason)

    logger.info('Vapi call report', { providerCallId, duration, outcome: analysis.outcome, sentiment: analysis.sentiment })

    // Update Call record
    const updateData = {
        status: 'completed',
        endedAt: new Date(),
        transcription: transcript,
        summary: summary || analysis.summary,
        recordingUrl,
        duration,
        outcome: analysis.outcome,
        sentiment: analysis.sentiment,
    }

    await prisma.call.updateMany({
        where: { providerCallId },
        data: updateData
    })

    // Update Lead status
    const leadId = metadata.leadId
    if (leadId) {
        const leadStatusMap = {
            'interested': 'booked',
            'booked': 'booked',
            'not-interested': 'not-interested',
            'callback': 'follow-up',
            'follow-up': 'follow-up',
            'voicemail': 'contacted',
            'no-answer': 'contacted',
        }

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                status: leadStatusMap[analysis.outcome] || 'contacted',
                lastContactedAt: new Date()
            }
        }).catch(() => {})

        // Handle opt-outs
        if (analysis.optedOut) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId } })
            if (lead?.phone) {
                await dncService.addToDNC(lead.phone, 'call-opt-out')
            }
        }

        // Send follow-up SMS for interested leads
        if (analysis.outcome === 'interested' || analysis.outcome === 'booked') {
            await sendFollowUpSms(leadId)
        }
    }

    // Update campaign stats if linked to an agent
    const call = await prisma.call.findFirst({ where: { providerCallId } })
    if (call?.agentInstanceId) {
        await campaignService.updateStatsFromCall(call.agentInstanceId, analysis.outcome, duration)
    }

    // Create MeetingNote if we have a transcript
    if (transcript && call) {
        await prisma.meetingNote.create({
            data: {
                callId: call.id,
                content: transcript,
                summary: summary || analysis.summary,
                actionItems: analysis.actionItems || [],
                decisions: analysis.decisions || [],
                tags: ['vapi-auto'],
                userId: call.userId
            }
        }).catch(err => logger.error('MeetingNote create error', { error: err.message }))
    }

    emitCallUpdate(providerCallId, { status: 'completed', outcome: analysis.outcome })
}

/**
 * Handle real-time transcript
 */
async function handleTranscript(providerCallId, message) {
    if (!providerCallId) return

    // Accumulate transcript on the call record
    const role = message.role || 'unknown'
    const text = message.transcript || ''

    if (text) {
        emitCallUpdate(providerCallId, {
            status: 'in-progress',
            transcript: { role, text }
        })
    }
}

/**
 * Analyze conversation transcript to determine outcome
 */
function analyzeConversation(transcript, summary, endedReason) {
    const lower = (transcript + ' ' + summary).toLowerCase()
    const result = {
        outcome: 'completed',
        sentiment: 'neutral',
        summary: '',
        optedOut: false,
        actionItems: [],
        decisions: [],
    }

    // Check ended reason
    if (endedReason === 'customer-did-not-answer' || endedReason === 'customer-busy') {
        result.outcome = 'no-answer'
        result.summary = 'Call was not answered.'
        return result
    }
    if (endedReason === 'voicemail') {
        result.outcome = 'voicemail'
        result.summary = 'Reached voicemail.'
        return result
    }

    // Positive signals
    const positiveSignals = [
        'interested', 'sign me up', 'sounds good', 'send me', 'i\'m in',
        'let\'s do it', 'that would be great', 'sure', 'tell me more',
        'how does it work', 'how much', 'what\'s the cost', 'free leads',
        'send details', 'send the info', 'text me'
    ]
    const negativeSignals = [
        'not interested', 'no thanks', 'no thank you', 'don\'t call',
        'stop calling', 'remove my number', 'don\'t need', 'already have',
        'scam', 'not looking', 'we\'re good', 'take me off'
    ]
    const callbackSignals = [
        'call back', 'call later', 'bad time', 'busy right now',
        'in a meeting', 'try tomorrow', 'not a good time'
    ]

    const positiveCount = positiveSignals.filter(s => lower.includes(s)).length
    const negativeCount = negativeSignals.filter(s => lower.includes(s)).length
    const callbackCount = callbackSignals.filter(s => lower.includes(s)).length

    if (negativeCount > positiveCount) {
        result.outcome = 'not-interested'
        result.sentiment = 'negative'
        result.optedOut = lower.includes('stop') || lower.includes('remove') || lower.includes('don\'t call')
    } else if (callbackCount > 0 && positiveCount === 0) {
        result.outcome = 'callback'
        result.sentiment = 'neutral'
        result.actionItems = [{ task: 'Call back', assignee: 'Mike', deadline: 'tomorrow' }]
    } else if (positiveCount > 0) {
        result.outcome = 'interested'
        result.sentiment = 'positive'
        result.actionItems = [{ task: 'Send follow-up details via SMS', assignee: 'System', deadline: 'now' }]
        result.decisions = ['Contractor expressed interest in receiving leads']
    } else {
        result.outcome = 'follow-up'
        result.sentiment = 'neutral'
    }

    result.summary = summary || `Call with ${positiveCount + negativeCount + callbackCount > 0 ? 'clear' : 'unclear'} outcome. ${result.outcome}.`
    return result
}

/**
 * Send follow-up SMS to interested leads via Twilio
 */
async function sendFollowUpSms(leadId) {
    try {
        const lead = await prisma.lead.findFirst({ where: { id: leadId } })
        if (!lead?.phone) return

        // Use Twilio directly for SMS (Vapi doesn't do SMS)
        const { TwilioAdapter } = await import('../adapters/telephony/twilioAdapter.js')
        const twilio = new TwilioAdapter()

        const message = `Hi ${lead.contactPerson || 'there'}! Thanks for your interest in receiving EV charger installation leads. Visit hendersonevcharger.com to see our site. Mike will reach out shortly to discuss the details. - Henderson EV Charger Pros`

        await twilio.sendSms(lead.phone, message)
        logger.info('Follow-up SMS sent', { phone: lead.phone, leadId })
    } catch (err) {
        logger.error('Follow-up SMS error', { error: err.message, leadId })
    }
}

export default router
