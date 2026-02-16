/**
 * Intelligence Service — AI-powered lead analysis
 *
 * Uses LLM adapter to extract structured business intelligence
 * from lead interactions (calls, messages, notes).
 *
 * Auto-triggers on EventBus events: call:completed, lead:status-changed
 */

import prisma from '../config/prisma.js'
import { getAdaptersForUser } from './apiKeyService.js'
import eventBus from './eventBus.js'
import { cacheGet, cacheSet, cacheDelete } from '../config/redisClient.js'

const CACHE_TTL_INTELLIGENCE = 3600  // 1 hour
const CACHE_TTL_INSIGHTS = 300       // 5 minutes

const ANALYZE_PROMPT = `You are a sales intelligence analyst. Analyze the following lead interactions and extract structured intelligence.

Return ONLY valid JSON with these fields:
- dealHeat: integer 0-100 (probability of closing the deal)
- buyingIntent: "low" | "medium" | "high" | "critical"
- budget: string if mentioned, null otherwise (e.g. "$5k-$10k")
- timeline: string if mentioned, null otherwise (e.g. "Next 3 months")
- decisionMaker: string if mentioned, null otherwise (e.g. "CEO needs sign-off")
- painPoints: string array of extracted pain points
- keyInsights: string array of key business insights
- risks: string array of deal risks
- nextBestAction: string with specific recommended next step
- summary: 2-3 sentence executive summary of all interactions`

const PROPOSAL_PROMPT = `You are a professional business proposal writer. Generate a proposal based on the lead intelligence and interactions.

Return ONLY valid JSON with these fields:
- title: string (proposal title)
- sections: array of { title: string, body: string } — include: Executive Summary, Understanding Your Needs, Proposed Solution, Deliverables, Timeline, Investment
- pricing: array of { item: string, amount: number, description: string }
- totalValue: number (sum of pricing amounts)`

export const intelligenceService = {
    /**
     * Analyze a lead — gather all context and extract intelligence via LLM
     */
    async analyzeLead(leadId, userId, { force = false } = {}) {
        // Check Redis cache first (skip if forced re-analysis)
        if (!force) {
            const cached = await cacheGet(`intel:${leadId}`)
            if (cached) {
                console.log(`🧠 Intelligence: Cache hit for lead ${leadId}`)
                return cached
            }
        }

        const lead = await prisma.lead.findFirst({
            where: { id: leadId, userId },
            include: {
                calls: {
                    orderBy: { createdAt: 'desc' },
                    take: 15,
                    select: { outcome: true, summary: true, sentiment: true, createdAt: true, duration: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 15,
                    select: { type: true, subject: true, body: true, createdAt: true }
                }
            }
        })

        if (!lead) throw new Error('Lead not found')

        // Get meeting notes for this lead's calls
        const callIds = lead.calls.map(c => c.id || '').filter(Boolean)
        const notes = callIds.length > 0
            ? await prisma.meetingNote.findMany({
                where: { callId: { in: callIds }, userId },
                select: { summary: true, actionItems: true, createdAt: true },
                take: 10
            })
            : []

        // Build context for LLM
        const context = {
            lead: {
                name: lead.name,
                company: lead.company,
                industry: lead.industry,
                status: lead.status,
                source: lead.source,
                notes: lead.notes
            },
            calls: lead.calls.map(c => ({
                outcome: c.outcome,
                summary: c.summary,
                sentiment: c.sentiment,
                date: c.createdAt
            })),
            messages: lead.messages.map(m => ({
                type: m.type,
                subject: m.subject,
                date: m.createdAt
            })),
            meetingNotes: notes.map(n => ({
                summary: n.summary,
                actionItems: n.actionItems,
                date: n.createdAt
            }))
        }

        try {
            const { llm } = getAdaptersForUser(userId)

            const result = await llm.complete({
                messages: [
                    { role: 'system', content: ANALYZE_PROMPT },
                    { role: 'user', content: JSON.stringify(context, null, 2) }
                ],
                temperature: 0.3,
                maxTokens: 800
            })

            let intel
            try {
                // Clean markdown fences if present
                const cleaned = result.content
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim()
                intel = JSON.parse(cleaned)
            } catch {
                console.error('🧠 Intelligence: Failed to parse LLM response, using defaults')
                intel = this._defaultIntelligence(lead)
            }

            // Upsert into database
            const intelligence = await prisma.leadIntelligence.upsert({
                where: { leadId },
                create: {
                    leadId,
                    userId,
                    dealHeat: intel.dealHeat || 0,
                    buyingIntent: intel.buyingIntent || 'low',
                    budget: intel.budget || null,
                    timeline: intel.timeline || null,
                    decisionMaker: intel.decisionMaker || null,
                    painPoints: intel.painPoints || [],
                    keyInsights: intel.keyInsights || [],
                    risks: intel.risks || [],
                    nextBestAction: intel.nextBestAction || null,
                    summary: intel.summary || null,
                    lastAnalyzedAt: new Date()
                },
                update: {
                    dealHeat: intel.dealHeat || 0,
                    buyingIntent: intel.buyingIntent || 'low',
                    budget: intel.budget || null,
                    timeline: intel.timeline || null,
                    decisionMaker: intel.decisionMaker || null,
                    painPoints: intel.painPoints || [],
                    keyInsights: intel.keyInsights || [],
                    risks: intel.risks || [],
                    nextBestAction: intel.nextBestAction || null,
                    summary: intel.summary || null,
                    lastAnalyzedAt: new Date()
                }
            })

            console.log(`🧠 Intelligence: Analyzed lead ${lead.name} — dealHeat: ${intelligence.dealHeat}`)

            // Cache the result
            await cacheSet(`intel:${leadId}`, intelligence, CACHE_TTL_INTELLIGENCE)
            // Invalidate insights cache for this user
            await cacheDelete(`insights:${userId}`)

            return intelligence
        } catch (err) {
            console.error(`🧠 Intelligence: Analysis failed for ${leadId}:`, err.message)
            // Return heuristic-based fallback
            return this._saveHeuristicIntelligence(leadId, userId, lead)
        }
    },

    /**
     * Generate a proposal draft using AI
     */
    async generateProposal(leadId, userId, options = {}) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, userId },
            include: { intelligence: true }
        })
        if (!lead) throw new Error('Lead not found')

        const intel = lead.intelligence
        const context = {
            lead: { name: lead.name, company: lead.company, industry: lead.industry },
            intelligence: intel ? {
                budget: intel.budget,
                timeline: intel.timeline,
                painPoints: intel.painPoints,
                keyInsights: intel.keyInsights,
                summary: intel.summary
            } : null,
            customInstructions: options.instructions || null
        }

        try {
            const { llm } = getAdaptersForUser(userId)

            const result = await llm.complete({
                messages: [
                    { role: 'system', content: PROPOSAL_PROMPT },
                    { role: 'user', content: JSON.stringify(context, null, 2) }
                ],
                temperature: 0.4,
                maxTokens: 1500
            })

            let proposalData
            try {
                const cleaned = result.content
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim()
                proposalData = JSON.parse(cleaned)
            } catch {
                proposalData = {
                    title: `Proposal for ${lead.company || lead.name}`,
                    sections: [{ title: 'Summary', body: result.content }],
                    pricing: [],
                    totalValue: 0
                }
            }

            const proposal = await prisma.proposal.create({
                data: {
                    title: proposalData.title || `Proposal for ${lead.company || lead.name}`,
                    status: 'draft',
                    content: { sections: proposalData.sections || [], pricing: proposalData.pricing || [] },
                    totalValue: proposalData.totalValue || null,
                    leadId,
                    userId
                }
            })

            console.log(`📄 Proposal generated for ${lead.name}: ${proposal.id}`)
            return proposal
        } catch (err) {
            console.error(`📄 Proposal generation failed for ${leadId}:`, err.message)
            // Create a bare draft proposal
            return prisma.proposal.create({
                data: {
                    title: `Proposal for ${lead.company || lead.name}`,
                    status: 'draft',
                    content: { sections: [{ title: 'Executive Summary', body: 'Draft proposal — please edit.' }], pricing: [] },
                    leadId,
                    userId
                }
            })
        }
    },

    /**
     * Get strategic insights for the dashboard
     */
    async getStrategyInsights(userId) {
        // Check cache first
        const cached = await cacheGet(`insights:${userId}`)
        if (cached) return cached

        const [hotLeads, allIntel, stalledLeads, recentAnalysis] = await Promise.all([
            // Hot leads: dealHeat > 70
            prisma.leadIntelligence.findMany({
                where: { userId, dealHeat: { gte: 70 } },
                include: { lead: { select: { id: true, name: true, company: true, status: true, lastContactedAt: true } } },
                orderBy: { dealHeat: 'desc' },
                take: 10
            }),
            // All intelligence for avg calc
            prisma.leadIntelligence.findMany({
                where: { userId },
                select: { dealHeat: true, buyingIntent: true }
            }),
            // Stalled: leads not contacted in 48h with existing intel
            prisma.leadIntelligence.findMany({
                where: {
                    userId,
                    lead: {
                        lastContactedAt: {
                            lt: new Date(Date.now() - 48 * 60 * 60 * 1000)
                        }
                    }
                },
                include: { lead: { select: { id: true, name: true, company: true, lastContactedAt: true } } },
                take: 5
            }),
            // Recent analysis activity
            prisma.leadIntelligence.findMany({
                where: { userId },
                include: { lead: { select: { id: true, name: true, company: true } } },
                orderBy: { lastAnalyzedAt: 'desc' },
                take: 8
            })
        ])

        const avgHeat = allIntel.length > 0
            ? Math.round(allIntel.reduce((s, i) => s + (i.dealHeat || 0), 0) / allIntel.length)
            : 0

        const intentBreakdown = { low: 0, medium: 0, high: 0, critical: 0 }
        allIntel.forEach(i => {
            if (i.buyingIntent && intentBreakdown[i.buyingIntent] !== undefined) {
                intentBreakdown[i.buyingIntent]++
            }
        })

        // Generate action suggestions
        const suggestions = []
        stalledLeads.forEach(s => {
            suggestions.push({
                type: 'follow-up',
                priority: 'high',
                title: `Follow up with ${s.lead.name}`,
                description: `No contact in ${Math.round((Date.now() - new Date(s.lead.lastContactedAt).getTime()) / (1000 * 60 * 60))}h`,
                leadId: s.lead.id
            })
        })
        hotLeads.slice(0, 3).forEach(h => {
            if (!h.lead.status || h.lead.status === 'contacted') {
                suggestions.push({
                    type: 'proposal',
                    priority: 'medium',
                    title: `Create proposal for ${h.lead.name}`,
                    description: `Deal heat: ${h.dealHeat}% — ready for proposal`,
                    leadId: h.lead.id
                })
            }
        })

        const result = {
            hotLeads,
            stalledLeads,
            suggestions,
            recentAnalysis,
            stats: {
                totalAnalyzed: allIntel.length,
                avgDealHeat: avgHeat,
                intentBreakdown
            }
        }

        // Cache the result
        await cacheSet(`insights:${userId}`, result, CACHE_TTL_INSIGHTS)

        return result
    },

    /**
     * Heuristic-based intelligence when LLM is unavailable
     */
    _defaultIntelligence(lead) {
        const callCount = lead.calls?.length || 0
        const hasPositiveSentiment = lead.calls?.some(c => c.sentiment === 'positive')
        const heat = Math.min(100, callCount * 15 + (hasPositiveSentiment ? 20 : 0))

        return {
            dealHeat: heat,
            buyingIntent: heat > 70 ? 'high' : heat > 40 ? 'medium' : 'low',
            budget: null,
            timeline: null,
            decisionMaker: null,
            painPoints: [],
            keyInsights: [`${callCount} calls recorded`],
            risks: callCount === 0 ? ['No calls recorded yet'] : [],
            nextBestAction: callCount === 0 ? 'Schedule initial discovery call' : 'Follow up on latest conversation',
            summary: `Lead with ${callCount} recorded call(s). ${hasPositiveSentiment ? 'Positive sentiment detected.' : 'No strong sentiment yet.'}`
        }
    },

    async _saveHeuristicIntelligence(leadId, userId, lead) {
        const intel = this._defaultIntelligence(lead)
        return prisma.leadIntelligence.upsert({
            where: { leadId },
            create: { leadId, userId, ...intel, lastAnalyzedAt: new Date() },
            update: { ...intel, lastAnalyzedAt: new Date() }
        })
    },

    /**
     * Initialize — register EventBus listeners for auto-analysis
     */
    init() {
        eventBus.on('call:completed', async (event) => {
            if (!event.userId || !event.data?.leadId) return
            console.log(`🧠 Intelligence: Auto-analyzing lead after call completion`)
            try {
                await this.analyzeLead(event.data.leadId, event.userId)
            } catch (err) {
                console.error('🧠 Intelligence: Auto-analysis failed:', err.message)
            }
        })

        eventBus.on('lead:status-changed', async (event) => {
            if (!event.userId || !event.entityId) return
            console.log(`🧠 Intelligence: Auto-analyzing lead after status change`)
            try {
                await this.analyzeLead(event.entityId, event.userId)
            } catch (err) {
                console.error('🧠 Intelligence: Auto-analysis failed:', err.message)
            }
        })

        console.log('🧠 Intelligence Service initialized — listening for events')
    }
}

export default intelligenceService
