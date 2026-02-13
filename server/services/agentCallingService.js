/**
 * Agent Calling Service — The Orchestrator
 * 
 * Manages AI agent instances that autonomously call through lead queues.
 * Each agent instance:
 *   1. Picks a lead from its queue
 *   2. Initiates a call via TelephonyAdapter
 *   3. Progresses through steps (dialing → speaking → negotiating → booked/skipped)
 *   4. Emits step-change events via WebSocket for React Flow visualization
 *   5. Generates meeting notes via STT + LLM
 *   6. Moves to next lead
 * 
 * The orchestrator does NOT make real telephony decisions — that's the adapter's job.
 * It manages the state machine and coordinates between services.
 */

import prisma from '../config/prisma.js'
import { getAdaptersForUser } from './apiKeyService.js'
import { isValidTransition, generateFlowGraph, AGENT_STEPS } from './agentStepMachine.js'
import { emitStepChange, emitAgentStatus, emitAgentLog, emitCallUpdate } from './callWebSocket.js'
import callService from './callService.js'
import meetingNoteService from './meetingNoteService.js'

// In-memory map of running agent processes (agentId → interval/timeout refs)
const runningAgents = new Map()

export const agentCallingService = {
    /**
     * Spawn a new agent instance
     */
    async spawn(userId, { name, scriptId, leadIds, config = {} }) {
        // Validate leads exist
        const leads = await prisma.lead.findMany({
            where: { id: { in: leadIds }, userId },
            select: { id: true, name: true, phone: true, company: true, status: true }
        })

        if (leads.length === 0) throw new Error('No valid leads found')

        const leadsWithPhone = leads.filter(l => l.phone)
        if (leadsWithPhone.length === 0) throw new Error('None of the selected leads have phone numbers')

        // Create agent instance
        const agent = await prisma.agentInstance.create({
            data: {
                name: name || `Agent ${Date.now().toString(36).slice(-4).toUpperCase()}`,
                status: 'idle',
                currentStep: 'idle',
                scriptId: scriptId || null,
                leadQueue: leadsWithPhone.map(l => l.id),
                completedLeads: [],
                config: {
                    voiceId: config.voiceId || process.env.ELEVENLABS_VOICE_ID || 'rachel',
                    llmModel: config.llmModel || 'gpt-4o-mini',
                    maxCalls: config.maxCalls || leadsWithPhone.length,
                    delayBetweenCalls: config.delayBetweenCalls || 5000,
                    autoTranscribe: config.autoTranscribe !== false,
                    ...config
                },
                stats: { totalCalls: 0, booked: 0, skipped: 0, avgDuration: 0 },
                userId
            }
        })

        emitAgentStatus(agent.id, 'idle', agent.stats)
        emitAgentLog(agent.id, `Agent "${agent.name}" spawned with ${leadsWithPhone.length} leads`)

        return agent
    },

    /**
     * Start an agent — begins processing its lead queue
     */
    async start(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId }
        })
        if (!agent) throw new Error('Agent not found')
        if (agent.status === 'running') throw new Error('Agent is already running')

        // Update status
        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { status: 'running', startedAt: new Date() }
        })

        emitAgentStatus(agentId, 'running')
        emitAgentLog(agentId, 'Agent started processing lead queue')

        // Start processing loop
        this._processQueue(agentId, userId)

        return { agentId, status: 'running' }
    },

    /**
     * Pause an agent
     */
    async pause(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId }
        })
        if (!agent) throw new Error('Agent not found')

        // Clear running process
        const running = runningAgents.get(agentId)
        if (running) {
            clearTimeout(running.timeout)
            runningAgents.delete(agentId)
        }

        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { status: 'paused' }
        })

        emitAgentStatus(agentId, 'paused')
        emitAgentLog(agentId, 'Agent paused')

        return { agentId, status: 'paused' }
    },

    /**
     * Resume a paused agent
     */
    async resume(agentId, userId) {
        return this.start(agentId, userId)
    },

    /**
     * Stop an agent completely
     */
    async stop(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId }
        })
        if (!agent) throw new Error('Agent not found')

        const running = runningAgents.get(agentId)
        if (running) {
            clearTimeout(running.timeout)
            runningAgents.delete(agentId)
        }

        await this._transitionStep(agentId, agent.currentStep, 'completed', {})

        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { status: 'completed', completedAt: new Date() }
        })

        emitAgentStatus(agentId, 'completed')
        emitAgentLog(agentId, 'Agent stopped')

        return { agentId, status: 'completed' }
    },

    /**
     * Get all agents for a user
     */
    async getAll(userId) {
        return prisma.agentInstance.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { calls: { select: { id: true, status: true, outcome: true, duration: true } } }
        })
    },

    /**
     * Get single agent with full details + flow graph
     */
    async getById(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId },
            include: {
                calls: {
                    include: { lead: true, meetingNotes: true, negotiations: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        if (!agent) throw new Error('Agent not found')

        // Attach flow graph for current state
        const flowGraph = generateFlowGraph(agent.currentStep)

        return { ...agent, flowGraph }
    },

    /**
     * Delete an agent
     */
    async remove(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId }
        })
        if (!agent) throw new Error('Agent not found')

        // Stop if running
        const running = runningAgents.get(agentId)
        if (running) {
            clearTimeout(running.timeout)
            runningAgents.delete(agentId)
        }

        await prisma.agentInstance.delete({ where: { id: agentId } })
        return { success: true }
    },

    /**
     * Get flow graph for an agent
     */
    async getFlowGraph(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId },
            select: { currentStep: true, currentLeadName: true, stats: true, status: true }
        })
        if (!agent) throw new Error('Agent not found')

        return {
            ...generateFlowGraph(agent.currentStep),
            agentStatus: agent.status,
            currentLeadName: agent.currentLeadName,
            stats: agent.stats
        }
    },

    // ============================================
    // INTERNAL: Queue Processing
    // ============================================

    /**
     * Process leads in the queue sequentially
     */
    async _processQueue(agentId, userId) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId, userId }
        })
        if (!agent || agent.status !== 'running') return

        const queue = (agent.leadQueue || [])
        if (queue.length === 0) {
            // Queue exhausted
            await this._transitionStep(agentId, agent.currentStep, 'completed', {})
            await prisma.agentInstance.update({
                where: { id: agentId },
                data: { status: 'completed', completedAt: new Date() }
            })
            emitAgentStatus(agentId, 'completed', agent.stats)
            emitAgentLog(agentId, '🏁 All leads processed. Agent complete.')
            runningAgents.delete(agentId)
            return
        }

        // Pick next lead
        const leadId = queue[0]
        const remainingQueue = queue.slice(1)

        try {
            await this._processLead(agentId, userId, leadId, agent.scriptId, agent.config)
        } catch (err) {
            emitAgentLog(agentId, `Error processing lead: ${err.message}`, 'error')
        }

        // Update queue
        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { leadQueue: remainingQueue }
        })

        // Schedule next lead with delay
        const delay = agent.config?.delayBetweenCalls || 5000
        const timeout = setTimeout(() => {
            this._processQueue(agentId, userId)
        }, delay)

        runningAgents.set(agentId, { timeout })
    },

    /**
     * Process a single lead — the full call lifecycle
     */
    async _processLead(agentId, userId, leadId, scriptId, config) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, userId },
            select: { id: true, name: true, phone: true, company: true }
        })
        if (!lead || !lead.phone) {
            emitAgentLog(agentId, `Skipping lead (no phone): ${lead?.name || leadId}`, 'warn')
            await this._recordCompletion(agentId, leadId, 'skipped')
            return
        }

        // Step 1: Lead Selected
        await this._transitionStep(agentId, null, 'lead-selected', {
            leadId: lead.id,
            leadName: lead.name,
            company: lead.company
        })

        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { currentLeadId: lead.id, currentLeadName: lead.name || lead.company || 'Unknown' }
        })

        // Step 2: Dialing
        await this._transitionStep(agentId, 'lead-selected', 'dialing', {
            leadName: lead.name,
            phoneNumber: lead.phone
        })

        try {
            // Initiate the actual call
            const call = await callService.initiateCall(userId, {
                leadId: lead.id,
                scriptId,
                assistantConfig: {
                    voiceId: config?.voiceId,
                    llmModel: config?.llmModel
                }
            })

            // Link call to agent
            await prisma.call.update({
                where: { id: call.id },
                data: { agentInstanceId: agentId }
            })

            // Step 3: Speaking (simulated — in real mode, Vapi handles the conversation)
            await this._transitionStep(agentId, 'dialing', 'speaking', {
                leadName: lead.name,
                callId: call.id
            })

            emitAgentLog(agentId, `📞 Connected with ${lead.name}`)

            // Wait for call to complete (poll status)
            const result = await this._waitForCallCompletion(call.id, call.providerCallId, agentId, userId)

            // Step 4: Process outcome
            if (result.status === 'completed') {
                const outcome = result.outcome || 'follow-up'

                // Transition through appropriate step
                if (outcome === 'booked') {
                    await this._transitionStep(agentId, 'speaking', 'negotiating', { leadName: lead.name })
                    await this._transitionStep(agentId, 'negotiating', 'booked', {
                        leadName: lead.name,
                        rate: result.rate
                    })
                    emitAgentLog(agentId, `✅ ${lead.name} — BOOKED!`)
                } else if (outcome === 'follow-up') {
                    await this._transitionStep(agentId, 'speaking', 'follow-up', { leadName: lead.name })
                    emitAgentLog(agentId, `📅 ${lead.name} — Follow-up scheduled`)
                } else {
                    await this._transitionStep(agentId, 'speaking', 'rejected', { leadName: lead.name })
                    emitAgentLog(agentId, `❌ ${lead.name} — Not interested`)
                }

                // Step 5: Notes
                await this._transitionStep(agentId, null, 'notes-generated', { leadName: lead.name })

                // Auto-transcribe if enabled
                if (config?.autoTranscribe && result.recordingUrl) {
                    try {
                        await meetingNoteService.transcribeAndSummarize(userId, call.id)
                        emitAgentLog(agentId, `📝 Notes generated for ${lead.name}`)
                    } catch (err) {
                        emitAgentLog(agentId, `Notes generation failed: ${err.message}`, 'warn')
                    }
                }

                await this._recordCompletion(agentId, leadId, outcome, result.rate)

            } else {
                // No answer / failed
                const failStep = result.status === 'no-answer' ? 'no-answer' : 'failed'
                await this._transitionStep(agentId, 'dialing', failStep, { leadName: lead.name })
                await this._transitionStep(agentId, failStep, 'skipped', { leadName: lead.name })
                emitAgentLog(agentId, `⏭️ ${lead.name} — ${failStep}`)
                await this._recordCompletion(agentId, leadId, 'skipped')
            }

            // Step 6: Next lead
            await this._transitionStep(agentId, null, 'next-lead', {})

        } catch (err) {
            emitAgentLog(agentId, `Call failed for ${lead.name}: ${err.message}`, 'error')
            await this._transitionStep(agentId, null, 'failed', { leadName: lead.name, error: err.message })
            await this._transitionStep(agentId, 'failed', 'skipped', {})
            await this._transitionStep(agentId, 'skipped', 'next-lead', {})
            await this._recordCompletion(agentId, leadId, 'skipped')
        }
    },

    /**
     * Wait for a call to finish (poll adapter)
     */
    async _waitForCallCompletion(callId, providerCallId, agentId, userId) {
        const { telephony } = getAdaptersForUser(userId)
        const maxWait = 300000 // 5 minutes max
        const pollInterval = 3000
        let elapsed = 0

        while (elapsed < maxWait) {
            await new Promise(r => setTimeout(r, pollInterval))
            elapsed += pollInterval

            try {
                const status = await telephony.getCallStatus(providerCallId)
                emitCallUpdate(callId, { status: status.status, duration: status.duration })

                if (status.status === 'completed' || status.status === 'failed' || status.status === 'no-answer') {
                    // Update call record
                    await prisma.call.update({
                        where: { id: callId },
                        data: {
                            status: status.status,
                            duration: status.duration,
                            recordingUrl: status.recordingUrl,
                            transcription: status.transcript,
                            summary: status.summary,
                            endedAt: new Date()
                        }
                    })
                    return status
                }
            } catch (err) {
                // Continue polling on transient errors
            }
        }

        return { status: 'failed', reason: 'timeout' }
    },

    /**
     * Transition agent step with validation + WebSocket emit
     */
    async _transitionStep(agentId, fromStep, toStep, data) {
        // Update DB
        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { currentStep: toStep }
        })

        // Emit to all subscribed WebSocket clients
        emitStepChange(agentId, fromStep, toStep, data)
    },

    /**
     * Record lead completion in agent stats
     */
    async _recordCompletion(agentId, leadId, outcome, rate = null) {
        const agent = await prisma.agentInstance.findFirst({
            where: { id: agentId },
            select: { completedLeads: true, stats: true }
        })
        if (!agent) return

        const completed = [...(agent.completedLeads || []), { leadId, outcome, rate, at: new Date() }]
        const stats = agent.stats || {}
        stats.totalCalls = (stats.totalCalls || 0) + 1
        if (outcome === 'booked') stats.booked = (stats.booked || 0) + 1
        if (outcome === 'skipped') stats.skipped = (stats.skipped || 0) + 1

        await prisma.agentInstance.update({
            where: { id: agentId },
            data: { completedLeads: completed, stats, currentLeadId: null, currentLeadName: null }
        })

        emitAgentStatus(agentId, 'running', stats)
    }
}

export default agentCallingService
