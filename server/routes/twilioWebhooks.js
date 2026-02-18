/**
 * Twilio TwiML Webhook Routes
 *
 * These endpoints are called BY Twilio during calls.
 * NO auth middleware — Twilio cannot send our auth headers.
 *
 * Flow:
 *   Call connects → /twiml (pitch) → /gather (keypress) → outcome route
 *   No answer → voicemail → /recording (save)
 *   Status changes → /status (update DB)
 */

import express from 'express'
import prisma from '../config/prisma.js'
import { getAdaptersForUser } from '../services/apiKeyService.js'
import dncService from '../services/dncService.js'
import logger from '../config/logger.js'
import { validateTwilioRequest } from '../middleware/twilioValidation.js'

const router = express.Router()

// Twilio sends form-encoded data (must parse BEFORE signature validation)
router.use(express.urlencoded({ extended: false }))

// Validate Twilio webhook signatures (enable via TWILIO_VALIDATE_REQUESTS=true)
router.use(validateTwilioRequest())

/**
 * POST /api/calls/twilio/twiml
 * Initial TwiML — delivers pitch, gathers keypress response
 */
router.post('/twiml', async (req, res) => {
    const { leadId, scriptId } = req.query
    const callSid = req.body.CallSid
    logger.info(`📞 TwiML request: callSid=${callSid}, leadId=${leadId}, scriptId=${scriptId}`)

    let contractorName = 'there'
    let pitchScript = getDefaultPitch()

    try {
        if (leadId) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId } })
            if (lead?.contactPerson && lead.contactPerson !== 'Unknown') {
                contractorName = lead.contactPerson.split(' ')[0]
            }
        }

        if (scriptId) {
            const script = await prisma.callScript.findFirst({ where: { id: scriptId } })
            if (script?.openingLine) {
                pitchScript = script.openingLine.replace('[NAME]', contractorName).replace('[Agent]', 'Mike')
            }
        } else {
            pitchScript = pitchScript.replace('[NAME]', contractorName)
        }

        // Update call record with startedAt
        if (callSid) {
            await prisma.call.updateMany({
                where: { providerCallId: callSid },
                data: { startedAt: new Date(), status: 'in-progress' }
            }).catch(() => {})
        }
    } catch (err) {
        logger.error('TwiML lead lookup error:', { error: err.message })
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="1"/>
    <Say voice="Google.en-US-Neural2-D" language="en-US">${escapeXml(pitchScript)}</Say>
    <Gather numDigits="1" action="/api/calls/twilio/gather?leadId=${leadId || ''}&amp;scriptId=${scriptId || ''}" method="POST" timeout="8">
        <Say voice="Google.en-US-Neural2-D">Press 1 if you are interested in receiving free leads. Press 2 if you are not interested. Press 3 if you would like us to call back at a better time.</Say>
    </Gather>
    <Say voice="Google.en-US-Neural2-D">We didn't receive your response. We'll try reaching you again. Thank you for your time. Goodbye.</Say>
</Response>`

    res.type('text/xml').send(twiml)
})

/**
 * POST /api/calls/twilio/gather
 * Handle keypress response from contractor
 */
router.post('/gather', async (req, res) => {
    const { leadId, scriptId } = req.query
    const digits = req.body.Digits
    const callSid = req.body.CallSid

    logger.info(`📞 Gather response: digits=${digits}, leadId=${leadId}, callSid=${callSid}`)

    let twiml = ''

    switch (digits) {
        case '1':
            // Interested
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Google.en-US-Neural2-D">Great! That's wonderful to hear. We will send you a text message with more details about our lead generation service. You can also visit henderson e v charger dot com to see the website that generates these leads. One of our team members, Mike, will reach out to you shortly to discuss the details. Thank you for your interest, and we look forward to working with you!</Say>
</Response>`
            await updateCallOutcome(callSid, leadId, 'booked', 'interested')
            await sendFollowUpEmail(leadId)
            if (process.env.FOLLOW_UP_SMS_ENABLED === 'true') {
                await sendFollowUpSms(leadId, 'interested')
            }
            break

        case '2':
            // Not interested
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Google.en-US-Neural2-D">No problem at all. We appreciate your time. If you ever change your mind or need additional leads in the future, don't hesitate to reach out. Have a great day!</Say>
</Response>`
            await updateCallOutcome(callSid, leadId, 'not-interested', 'negative')
            break

        case '3':
            // Call back later
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Google.en-US-Neural2-D">Absolutely, we understand you're busy. We will try calling you back tomorrow at a more convenient time. You can also text us at this number if you'd prefer to chat that way. Have a great day!</Say>
</Response>`
            await updateCallOutcome(callSid, leadId, 'follow-up', 'neutral')
            break

        default:
            // Invalid input — repeat
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Google.en-US-Neural2-D">Sorry, I didn't catch that.</Say>
    <Gather numDigits="1" action="/api/calls/twilio/gather?leadId=${leadId || ''}&amp;scriptId=${scriptId || ''}" method="POST" timeout="8">
        <Say voice="Google.en-US-Neural2-D">Press 1 if you are interested. Press 2 if you are not interested. Press 3 to schedule a callback.</Say>
    </Gather>
    <Say voice="Google.en-US-Neural2-D">Thank you for your time. Goodbye.</Say>
</Response>`
    }

    res.type('text/xml').send(twiml)
})

/**
 * POST /api/calls/twilio/status
 * Twilio call status webhook — updates Call record in DB
 */
router.post('/status', async (req, res) => {
    const { CallSid, CallStatus, CallDuration, RecordingUrl, RecordingSid } = req.body

    logger.info(`📞 Status update: ${CallSid} → ${CallStatus} (${CallDuration || 0}s)`)

    try {
        const statusMap = {
            'initiated': 'ringing',
            'ringing': 'ringing',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'failed': 'failed',
            'busy': 'busy',
            'no-answer': 'no-answer',
            'canceled': 'failed',
        }

        const updateData = {
            status: statusMap[CallStatus] || CallStatus,
        }

        if (CallDuration) updateData.duration = parseInt(CallDuration)
        if (RecordingUrl) updateData.recordingUrl = RecordingUrl

        if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
            updateData.endedAt = new Date()

            // Set outcome for no-answer/busy/failed if not already set
            if (['no-answer', 'busy', 'failed'].includes(CallStatus)) {
                const call = await prisma.call.findFirst({ where: { providerCallId: CallSid } })
                if (call && !call.outcome) {
                    if (CallStatus === 'no-answer') {
                        updateData.outcome = 'voicemail'
                        // Send follow-up SMS for no-answer (gated)
                        if (process.env.FOLLOW_UP_SMS_ENABLED === 'true') {
                            await sendFollowUpSms(call.leadId, 'no-answer')
                        }
                    } else {
                        updateData.outcome = CallStatus
                    }
                    // Update lead status
                    await prisma.lead.update({
                        where: { id: call.leadId },
                        data: { status: 'contacted', lastContactedAt: new Date() }
                    }).catch(() => {})
                }
            }
        }

        await prisma.call.updateMany({
            where: { providerCallId: CallSid },
            data: updateData
        })
    } catch (err) {
        logger.error('Status webhook error:', { error: err.message })
    }

    res.type('text/xml').send('<Response/>')
})

/**
 * POST /api/calls/twilio/recording
 * Recording status callback — save recording URL
 */
router.post('/recording', async (req, res) => {
    const { CallSid, RecordingUrl, RecordingSid, RecordingDuration } = req.body

    logger.info(`🎙️ Recording ready: ${CallSid} → ${RecordingUrl} (${RecordingDuration}s)`)

    try {
        if (CallSid && RecordingUrl) {
            await prisma.call.updateMany({
                where: { providerCallId: CallSid },
                data: { recordingUrl: `${RecordingUrl}.mp3` }
            })
        }
    } catch (err) {
        logger.error('Recording webhook error:', { error: err.message })
    }

    res.type('text/xml').send('<Response/>')
})

/**
 * POST /api/calls/twilio/sms
 * Inbound SMS handler — process replies from contractors
 */
router.post('/sms', async (req, res) => {
    const from = req.body.From
    const body = (req.body.Body || '').trim().toLowerCase()

    logger.info(`💬 Inbound SMS from ${from}: ${body}`)

    let replyMsg = 'Thanks for your reply! Mike from Henderson EV Charger Pros will get back to you shortly.'

    try {
        // Find lead by phone
        const lead = await prisma.lead.findFirst({ where: { phone: from } })

        if (lead) {
            if (body === 'yes' || body === 'interested' || body === 'y') {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'replied', lastContactedAt: new Date() }
                })
                replyMsg = "Great to hear! Mike will call you today to discuss the details. In the meantime, check out hendersonevcharger.com to see our lead generation site. Talk soon!"
            } else if (body === 'stop' || body === 'unsubscribe' || body === 'no') {
                await dncService.addToDNC(from, 'sms-stop')
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'not-interested', lastContactedAt: new Date() }
                })
                replyMsg = "You've been removed from our contact list. We won't reach out again. Thank you."
            } else {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { lastContactedAt: new Date(), notes: `${lead.notes || ''}\n\nSMS reply (${new Date().toISOString()}): ${req.body.Body}` }
                })
            }
        }
    } catch (err) {
        logger.error('SMS webhook error:', { error: err.message })
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(replyMsg)}</Message>
</Response>`

    res.type('text/xml').send(twiml)
})

/**
 * POST /api/calls/twilio/amd
 * Async AMD (Answering Machine Detection) callback
 * Twilio tells us if a human or machine answered
 */
router.post('/amd', async (req, res) => {
    const { CallSid, AnsweredBy, MachineDetectionDuration } = req.body

    logger.info(`🤖 AMD result: ${CallSid} → ${AnsweredBy} (${MachineDetectionDuration}ms)`)

    try {
        if (CallSid && AnsweredBy) {
            const isHuman = AnsweredBy === 'human'
            const isMachine = ['machine_start', 'machine_end_beep', 'machine_end_silence', 'machine_end_other'].includes(AnsweredBy)

            if (isMachine) {
                // Leave a short voicemail message
                const call = await prisma.call.findFirst({ where: { providerCallId: CallSid } })
                if (call) {
                    await prisma.call.updateMany({
                        where: { providerCallId: CallSid },
                        data: { outcome: 'voicemail', sentiment: 'neutral' }
                    })
                    // Send follow-up SMS (gated)
                    if (process.env.FOLLOW_UP_SMS_ENABLED === 'true') {
                        await sendFollowUpSms(call.leadId, 'no-answer')
                    }
                }
            }

            // Log AMD result on the call record
            await prisma.call.updateMany({
                where: { providerCallId: CallSid },
                data: { summary: `AMD: ${AnsweredBy} (${MachineDetectionDuration}ms)` }
            })
        }
    } catch (err) {
        logger.error('AMD webhook error:', { error: err.message })
    }

    res.type('text/xml').send('<Response/>')
})

/**
 * POST /api/calls/twilio/stream
 * TwiML for AI conversational mode via Media Streams
 * Uses bidirectional WebSocket for real-time STT → LLM → TTS
 */
router.post('/stream', async (req, res) => {
    const { leadId, scriptId } = req.query
    const callSid = req.body.CallSid

    logger.info(`🎙️ Media Stream TwiML: callSid=${callSid}, leadId=${leadId}, scriptId=${scriptId}`)

    try {
        if (callSid) {
            await prisma.call.updateMany({
                where: { providerCallId: callSid },
                data: { startedAt: new Date(), status: 'in-progress' }
            }).catch(() => {})
        }
    } catch (err) {
        logger.error('Stream TwiML error:', { error: err.message })
    }

    const wsUrl = process.env.WEBHOOK_BASE_URL
        ? process.env.WEBHOOK_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')
        : 'wss://localhost:3002'

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${wsUrl}/ws/twilio-media">
            <Parameter name="leadId" value="${leadId || ''}" />
            <Parameter name="scriptId" value="${scriptId || ''}" />
            <Parameter name="callSid" value="${callSid || ''}" />
        </Stream>
    </Connect>
</Response>`

    res.type('text/xml').send(twiml)
})

// ============================================
// HELPERS
// ============================================

function getDefaultPitch() {
    return `Hi [NAME], my name is Mike from Henderson EV Charger Pros. I run a local lead generation service for EV charger installers in Henderson, Nevada. I have a website, henderson e v charger dot com, that's ranking on Google and generating leads from homeowners looking for EV charger installation. Right now these leads are going unanswered. I'm looking for one reliable, licensed electrician in Henderson to send these leads to. Would you be interested in receiving free EV charger installation leads for your business?`
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

async function updateCallOutcome(callSid, leadId, outcome, sentiment) {
    try {
        if (callSid) {
            await prisma.call.updateMany({
                where: { providerCallId: callSid },
                data: { outcome, sentiment }
            })
        }

        if (leadId) {
            const statusMap = {
                'booked': 'booked',
                'not-interested': 'not-interested',
                'follow-up': 'follow-up',
            }
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    status: statusMap[outcome] || 'contacted',
                    lastContactedAt: new Date()
                }
            })
        }
    } catch (err) {
        logger.error('Update call outcome error:', { error: err.message })
    }
}

/**
 * Send follow-up email to interested leads (free — uses configured email provider)
 */
async function sendFollowUpEmail(leadId) {
    try {
        if (!leadId) return
        const lead = await prisma.lead.findFirst({ where: { id: leadId } })
        if (!lead?.email) return

        const { emailSettingsRepository } = await import('../repositories/extraRepositories.js')
        const settingsRecord = await emailSettingsRepository.findByUserId(lead.userId)
        const settings = settingsRecord?.config
        if (!settings?.provider) return

        const name = lead.contactPerson || lead.name?.split(' ')[0] || 'there'
        const { sendEmail } = await import('../services/emailService.js')

        await sendEmail(settings, {
            to: lead.email,
            subject: `Thanks for your interest, ${name}!`,
            body: `Hi ${name},\n\nThanks for speaking with us! We appreciate your interest.\n\nAs discussed, we'd love to help you out. Here's what happens next:\n\n- A team member will follow up with you shortly to discuss the details\n- Feel free to reply to this email with any questions\n\nLooking forward to working with you!\n\nBest regards,\n${settings.fromName || 'The Team'}`
        })

        logger.info(`Follow-up email sent to ${lead.email}`)
    } catch (err) {
        logger.error('Follow-up email error:', { error: err.message })
    }
}

/**
 * Send follow-up SMS (premium feature — gated by FOLLOW_UP_SMS_ENABLED)
 * Future: Replace with WAHA (WhatsApp) or direct SMPP for lower cost
 */
async function sendFollowUpSms(leadId, type) {
    try {
        if (!leadId) return

        const lead = await prisma.lead.findFirst({ where: { id: leadId } })
        if (!lead?.phone) return

        const { telephony } = getAdaptersForUser(lead.userId)
        if (!telephony.sendSms) return

        // Keep under 160 chars (1 SMS segment) — GSM-7 only, no emojis
        // Future: consider WhatsApp Business API for cheaper messaging
        const name = lead.contactPerson || 'there'
        let message = ''
        if (type === 'interested') {
            message = `Hi ${name}, thanks for your interest! Visit hendersonevcharger.com for details. Mike will call you shortly. - Henderson EV Charger Pros`
        } else if (type === 'no-answer') {
            message = `Hi ${name}, we tried calling about EV charger leads in your area. Reply YES or visit hendersonevcharger.com - Henderson EV Charger Pros`
        }

        if (message) {
            await telephony.sendSms(lead.phone, message)
        }
    } catch (err) {
        logger.error('Follow-up SMS error:', { error: err.message })
    }
}

export default router
