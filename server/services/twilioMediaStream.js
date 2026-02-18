/**
 * Twilio Media Streams — Bidirectional Audio WebSocket
 *
 * Handles real-time audio streaming between Twilio calls and our AI pipeline.
 * Twilio sends mulaw 8kHz audio, we process it through STT → LLM → TTS
 * and stream synthesized audio back.
 *
 * Events from Twilio:
 *   connected → start → media (audio chunks) → stop
 *
 * Sends back:
 *   media (synthesized audio) → clear (interrupt)
 *
 * Architecture:
 *   Twilio Audio → Deepgram STT → GPT-4o/Claude → ElevenLabs TTS → Twilio Audio
 */

import { WebSocketServer } from 'ws'
import prisma from '../config/prisma.js'
import { CallConversationEngine } from './callConversationEngine.js'
import { emitAgentLog, emitCallUpdate } from './callWebSocket.js'
import logger from '../config/logger.js'

// Active stream sessions (streamSid → session)
const activeSessions = new Map()

/**
 * Initialize the Twilio Media Streams WebSocket server
 * Mounts at /ws/twilio-media on the given HTTP server
 */
export function initMediaStreamWebSocket(server) {
    const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false })

    // Handle upgrade manually — same pattern as callWebSocket
    server.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url, 'http://localhost').pathname
        if (pathname === '/ws/twilio-media') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req)
            })
        }
    })

    wss.on('connection', (ws) => {
        logger.info('🎙️ Twilio Media Stream connected')
        let session = null

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString())
                await handleStreamEvent(ws, msg, session, (s) => { session = s })
            } catch (err) {
                logger.error('Media stream message error:', { error: err.message })
            }
        })

        ws.on('close', () => {
            if (session) {
                logger.info(`🎙️ Media Stream closed: ${session.streamSid}`)
                cleanupSession(session)
            }
        })

        ws.on('error', (err) => {
            logger.error('Media stream WS error:', { error: err.message })
            if (session) cleanupSession(session)
        })
    })

    logger.info('🎙️ Twilio Media Streams WebSocket at /ws/twilio-media')
    return wss
}

/**
 * Handle a single Twilio Media Stream event
 */
async function handleStreamEvent(ws, msg, session, setSession) {
    switch (msg.event) {
        case 'connected':
            logger.info('🎙️ Stream protocol:', { protocol: msg.protocol })
            break

        case 'start': {
            const { streamSid, callSid, customParameters } = msg.start
            const leadId = customParameters?.leadId || ''
            const scriptId = customParameters?.scriptId || ''

            logger.info(`🎙️ Stream started: streamSid=${streamSid}, callSid=${callSid}, leadId=${leadId}`)

            // Build conversation context and resolve userId
            const context = await buildConversationContext(leadId, scriptId)
            const callRecord = await prisma.call.findFirst({ where: { providerCallId: callSid }, select: { userId: true } })
            const userId = callRecord?.userId || null

            // Create conversation engine
            const engine = new CallConversationEngine({
                streamSid,
                callSid,
                leadId,
                scriptId,
                userId,
                context,
                onAudioResponse: (audioBase64) => {
                    // Send synthesized audio back to Twilio
                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            event: 'media',
                            streamSid,
                            media: { payload: audioBase64 }
                        }))
                    }
                },
                onClearBuffer: () => {
                    // Clear Twilio's audio buffer (for interruptions)
                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({ event: 'clear', streamSid }))
                    }
                },
                onConversationEnd: (outcome) => {
                    handleConversationEnd(callSid, leadId, outcome)
                }
            })

            const newSession = { streamSid, callSid, leadId, scriptId, engine, startedAt: Date.now() }
            activeSessions.set(streamSid, newSession)
            setSession(newSession)

            // Start the engine (sends initial greeting)
            await engine.start()
            break
        }

        case 'media': {
            if (!session?.engine) break
            // Feed raw audio to the conversation engine
            const audioPayload = msg.media.payload // base64 mulaw audio
            await session.engine.processAudio(audioPayload)
            break
        }

        case 'stop': {
            logger.info(`🎙️ Stream stopped: ${session?.streamSid || 'unknown'}`)
            if (session) {
                await session.engine?.stop()
                cleanupSession(session)
            }
            break
        }
    }
}

/**
 * Build conversation context from lead + script data
 */
async function buildConversationContext(leadId, scriptId) {
    const context = {
        contractorName: 'there',
        companyName: '',
        systemPrompt: '',
        openingLine: '',
        talkingPoints: [],
        objectionHandlers: [],
        closingStrategy: '',
    }

    try {
        if (leadId) {
            const lead = await prisma.lead.findFirst({ where: { id: leadId } })
            if (lead) {
                context.contractorName = lead.contactPerson?.split(' ')[0] || 'there'
                context.companyName = lead.name || ''
            }
        }

        if (scriptId) {
            const script = await prisma.callScript.findFirst({ where: { id: scriptId } })
            if (script) {
                context.openingLine = (script.openingLine || '')
                    .replace('[NAME]', context.contractorName)
                    .replace('[Agent]', 'Mike')
                context.talkingPoints = script.talkingPoints || []
                context.objectionHandlers = script.objectionHandlers || []
                context.closingStrategy = script.closingStrategy || ''
                context.systemPrompt = buildSystemPrompt(script, context)
            }
        }

        if (!context.systemPrompt) {
            context.systemPrompt = getDefaultSystemPrompt(context)
        }
    } catch (err) {
        logger.error('Context build error:', { error: err.message })
        context.systemPrompt = getDefaultSystemPrompt(context)
    }

    return context
}

/**
 * Build LLM system prompt from call script
 */
function buildSystemPrompt(script, context) {
    return `You are Mike, a professional but friendly sales representative for Henderson EV Charger Pros.
You are calling ${context.companyName || 'an electrician'} (${context.contractorName}) about a partnership opportunity.

YOUR GOAL: Get the contractor interested in receiving free EV charger installation leads.

TONE: Friendly, professional, not pushy. Like a colleague offering a deal, not a telemarketer.

KEY FACTS:
- You run hendersonevcharger.com, a website ranking on Google for EV charger installation in Henderson, NV
- The site generates real leads from homeowners looking for EV charger installation
- Currently these leads are going unanswered
- You want ONE reliable, licensed electrician to send these leads to
- Leads are FREE initially to prove value, then $50-150/lead once they see results

TALKING POINTS:
${(script.talkingPoints || []).map(tp => `- ${tp.topic}: ${tp.script}`).join('\n')}

OBJECTION HANDLERS:
${(script.objectionHandlers || []).map(oh => `- If they say "${oh.objection}": ${oh.response}`).join('\n')}

CLOSING STRATEGY: ${script.closingStrategy || 'Ask if they want to receive a few free test leads to see the quality.'}

RULES:
- Keep responses SHORT (1-3 sentences max, this is a phone call)
- Sound natural, use casual language like "yeah", "sure thing", "absolutely"
- If they say no, be gracious and end the call politely
- If they seem interested, get verbal confirmation and say you'll send details via text
- If they have questions, answer concisely
- NEVER lie or make claims you can't back up
- If asked about pricing, say leads are free to start, then negotiate based on value`
}

function getDefaultSystemPrompt(context) {
    return buildSystemPrompt({
        talkingPoints: [
            { topic: 'Introduction', script: 'Introduce yourself as Mike from Henderson EV Charger Pros' },
            { topic: 'Value Prop', script: 'You have a website generating EV charger leads that are going unanswered' },
            { topic: 'Offer', script: 'Looking for one reliable electrician to send free leads to' },
        ],
        objectionHandlers: [
            { objection: "I'm too busy", response: "That's actually perfect - busy means you're good at what you do. These leads come to you, no extra marketing needed." },
            { objection: "Sounds like a scam", response: "I totally get the skepticism. Check out hendersonevcharger.com yourself. I'll send a few test leads completely free so you can see the quality." },
        ],
        closingStrategy: 'Ask if they want to receive a few free test leads to see the quality.'
    }, context)
}

/**
 * Handle conversation end — update DB with outcome
 */
async function handleConversationEnd(callSid, leadId, outcome) {
    try {
        if (callSid) {
            const data = { outcome: outcome.result || 'completed' }
            if (outcome.sentiment) data.sentiment = outcome.sentiment
            if (outcome.summary) data.summary = outcome.summary

            await prisma.call.updateMany({
                where: { providerCallId: callSid },
                data
            })
        }

        if (leadId && outcome.result) {
            const statusMap = {
                'interested': 'booked',
                'not-interested': 'not-interested',
                'callback': 'follow-up',
                'voicemail': 'contacted',
            }
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    status: statusMap[outcome.result] || 'contacted',
                    lastContactedAt: new Date()
                }
            }).catch(() => {})
        }
    } catch (err) {
        logger.error('Conversation end handler error:', { error: err.message })
    }
}

/**
 * Cleanup a stream session
 */
function cleanupSession(session) {
    if (session.engine) {
        session.engine.stop().catch(() => {})
    }
    activeSessions.delete(session.streamSid)
}

/**
 * Get count of active media stream sessions
 */
export function getActiveStreamCount() {
    return activeSessions.size
}

export default { initMediaStreamWebSocket, getActiveStreamCount }
