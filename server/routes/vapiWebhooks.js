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
import eventBus from '../services/eventBus.js'

const router = express.Router()

/**
 * Verify Vapi webhook authenticity via shared secret.
 * Set VAPI_WEBHOOK_SECRET in .env and in Vapi Dashboard → Server URL config.
 */
function verifyVapiSecret(req, res, next) {
    const secret = process.env.VAPI_WEBHOOK_SECRET
    if (!secret) {
        logger.warn('VAPI_WEBHOOK_SECRET not configured — rejecting webhook request')
        return res.status(500).json({ error: 'Webhook secret not configured' })
    }

    const provided = req.headers['x-vapi-secret'] || req.query.secret
    if (provided !== secret) {
        logger.warn('Vapi webhook rejected — invalid secret', { ip: req.ip })
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}

/**
 * POST /api/calls/vapi/webhook
 * Main Vapi webhook handler — processes all event types
 */
router.post('/webhook', verifyVapiSecret, async (req, res) => {
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
        select: { id: true, userId: true, leadId: true }
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

    // Publish event for automation engine
    if (dbCall) {
        eventBus.publish('call:status-changed', {
            userId: dbCall.userId, entityId: dbCall.id, entityType: 'call',
            data: { status, leadId: dbCall.leadId, providerCallId }
        })
    }

    emitCallUpdate(providerCallId, { status }, dbCall?.userId)
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

    // Update Lead status + qualifying data from transcript
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

        // Extract qualifying data from transcript
        const qualifying = extractQualifyingData(transcript, summary)
        const leadUpdateData = {
            status: leadStatusMap[analysis.outcome] || 'contacted',
            lastContactedAt: new Date()
        }
        if (qualifying.budget) leadUpdateData.budget = qualifying.budget
        if (qualifying.timeline) leadUpdateData.timeline = qualifying.timeline
        // serviceNeeded is handled below in the qualifying notes append block
        if (qualifying.location) leadUpdateData.location = qualifying.location

        await prisma.lead.update({
            where: { id: leadId },
            data: leadUpdateData
        }).catch(() => { })

        // Append qualifying notes to existing notes
        if (qualifying.serviceNeeded || qualifying.budget || qualifying.timeline || qualifying.location) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId }, select: { notes: true, userId: true } })
            if (lead) {
                const qualNotes = [
                    qualifying.serviceNeeded ? `Service needed: ${qualifying.serviceNeeded}` : null,
                    qualifying.budget ? `Budget: ${qualifying.budget}` : null,
                    qualifying.timeline ? `Timeline: ${qualifying.timeline}` : null,
                    qualifying.location ? `Location: ${qualifying.location}` : null,
                ].filter(Boolean).join('\n')
                const updatedNotes = lead.notes ? `${lead.notes}\n\n--- AI Call Qualifying Data ---\n${qualNotes}` : `--- AI Call Qualifying Data ---\n${qualNotes}`
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { notes: updatedNotes }
                }).catch(() => { })

                // Emit lead:updated event
                eventBus.publish('lead:updated', {
                    userId: lead.userId,
                    entityId: leadId,
                    entityType: 'lead',
                    data: { leadId, qualifying }
                })
            }
        }

        // Handle opt-outs
        if (analysis.optedOut) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId } })
            if (lead?.phone) {
                await dncService.addToDNC(lead.phone, 'call-opt-out')
            }
        }

        // Send follow-up after call
        if (analysis.outcome === 'interested' || analysis.outcome === 'booked') {
            // Email follow-up (free, always enabled)
            await sendFollowUpEmail(leadId)
            // SMS follow-up (paid, disabled by default — enable via FOLLOW_UP_SMS_ENABLED=true)
            if (process.env.FOLLOW_UP_SMS_ENABLED === 'true') {
                await sendFollowUpSms(leadId)
            }
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

    // Publish event for automation engine
    if (call) {
        eventBus.publish('call:completed', {
            userId: call.userId, entityId: call.id, entityType: 'call',
            data: {
                leadId: metadata.leadId,
                leadName: metadata.leadName || '',
                outcome: analysis.outcome,
                sentiment: analysis.sentiment,
                duration,
                summary: summary || analysis.summary
            }
        })
    }

    emitCallUpdate(providerCallId, { status: 'completed', outcome: analysis.outcome }, call?.userId)
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
 * Extract qualifying data from transcript/summary
 * Looks for budget, timeline, service needed, location mentions
 */
function extractQualifyingData(transcript, summary) {
    const text = (transcript + ' ' + summary).toLowerCase()
    const result = {}

    // Budget extraction
    const budgetMatch = text.match(/(?:budget|spend|afford|cost|price|pay)\s*(?:is|of|around|about|roughly)?\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:k|thousand|hundred)?/i)
        || text.match(/\$([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?/i)
        || text.match(/([\d,]+)\s*(?:dollars|usd|per month|monthly|per year|annually)/i)
    if (budgetMatch) {
        let amount = budgetMatch[1].replace(/,/g, '')
        if (text.includes(amount + 'k') || text.includes(amount + ' thousand')) {
            amount = String(Number(amount) * 1000)
        }
        result.budget = `$${Number(amount).toLocaleString()}`
    }

    // Timeline extraction
    const timelinePatterns = [
        /(?:timeline|timeframe|start|begin|need it|looking to)\s*(?:is|in|by|within|around)?\s*((?:next\s+)?(?:\d+\s+)?(?:week|month|day|year)s?|asap|immediately|this\s+(?:week|month)|q[1-4]|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)/i,
        /(?:within|in about|around)\s+(\d+\s+(?:week|month|day)s?)/i,
    ]
    for (const pattern of timelinePatterns) {
        const match = text.match(pattern)
        if (match) { result.timeline = match[1].trim(); break }
    }

    // Service needed extraction
    const servicePatterns = [
        /(?:looking for|need|want|interested in|require)\s+(?:a\s+|an\s+|some\s+)?([\w\s]{3,40}?)(?:\.|,|\?|!|$)/i,
        /(?:service|help with|work on)\s+(?:for\s+|with\s+)?([\w\s]{3,40}?)(?:\.|,|\?|!|$)/i,
    ]
    for (const pattern of servicePatterns) {
        const match = text.match(pattern)
        if (match) {
            const service = match[1].trim()
            if (service.length > 3 && service.length < 60) { result.serviceNeeded = service; break }
        }
    }

    // Location extraction
    const locationMatch = text.match(/(?:located|based|from|in|area|city|region)\s+(?:in\s+|at\s+)?([\w\s]{2,30}?)(?:\.|,|\?|!|$)/i)
    if (locationMatch) {
        const loc = locationMatch[1].trim()
        if (loc.length > 1 && loc.length < 40) result.location = loc
    }

    return result
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
 * Send follow-up email to interested leads (free — uses configured email provider)
 */
async function sendFollowUpEmail(leadId) {
    try {
        const lead = await prisma.lead.findFirst({ where: { id: leadId } })
        if (!lead?.email) {
            logger.info('Follow-up email skipped — no email on lead', { leadId })
            return
        }

        // Get user's email settings
        const { emailSettingsRepository } = await import('../repositories/extraRepositories.js')
        const settingsRecord = await emailSettingsRepository.findByUserId(lead.userId)
        const settings = settingsRecord?.config
        if (!settings?.provider) {
            logger.warn('Follow-up email skipped — email not configured', { leadId, userId: lead.userId })
            return
        }

        const name = lead.contactPerson || lead.name?.split(' ')[0] || 'there'
        const { sendEmail } = await import('../services/emailService.js')

        await sendEmail(settings, {
            to: lead.email,
            subject: `Thanks for your interest, ${name}!`,
            body: `Hi ${name},\n\nThanks for speaking with us! We appreciate your interest.\n\nAs discussed, we'd love to help you out. Here's what happens next:\n\n- A team member will follow up with you shortly to discuss the details\n- Feel free to reply to this email with any questions\n\nLooking forward to working with you!\n\nBest regards,\n${settings.fromName || 'The Team'}`
        })

        logger.info('Follow-up email sent', { email: lead.email, leadId })
    } catch (err) {
        logger.error('Follow-up email error', { error: err.message, leadId })
    }
}

/**
 * Send follow-up SMS to interested leads via Twilio (premium feature — gated by FOLLOW_UP_SMS_ENABLED)
 * Future: Replace with WAHA (WhatsApp) or direct SMPP for lower cost
 */
async function sendFollowUpSms(leadId) {
    try {
        const lead = await prisma.lead.findFirst({ where: { id: leadId } })
        if (!lead?.phone) return

        const { TwilioAdapter } = await import('../adapters/telephony/twilioAdapter.js')
        const twilio = new TwilioAdapter()

        // Keep under 160 chars (1 SMS segment) — GSM-7 only, no emojis
        const name = lead.contactPerson || 'there'
        const message = `Hi ${name}, thanks for your interest! Visit hendersonevcharger.com for details. Mike will call you shortly. - Henderson EV Charger Pros`

        await twilio.sendSms(lead.phone, message)
        logger.info('Follow-up SMS sent', { phone: lead.phone, leadId })
    } catch (err) {
        logger.error('Follow-up SMS error', { error: err.message, leadId })
    }
}

export default router
