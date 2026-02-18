/**
 * Campaign Service
 *
 * Manages outreach campaigns (batch call groups with tracking).
 * Uses AgentInstance model to represent campaigns — no schema migration needed.
 *
 * A "campaign" is an AgentInstance with:
 *   - name: campaign name
 *   - config.campaignType: 'outreach'
 *   - config.targetIndustry: 'henderson-ev-outreach'
 *   - config.tier: 1/2/3
 *   - stats: aggregated results
 *   - leadQueue: leads to call
 *   - completedLeads: results per lead
 */

import prisma from '../config/prisma.js'
import dncService from './dncService.js'
import logger from '../config/logger.js'

export const campaignService = {
    /**
     * Create a new campaign
     */
    async create(userId, { name, scriptId, industry, tier, leadIds, boardId }) {
        // Get leads, filtering out DNC
        let leads
        if (leadIds && leadIds.length > 0) {
            leads = await prisma.lead.findMany({
                where: { id: { in: leadIds }, userId }
            })
        } else {
            // Auto-select leads by industry/board/tier
            const where = { userId, phone: { not: null } }
            if (boardId) where.linkedBoardId = boardId
            if (industry) where.industry = industry

            leads = await prisma.lead.findMany({ where })

            // Filter by tier if specified
            if (tier) {
                leads = leads.filter(l => {
                    const tags = Array.isArray(l.tags) ? l.tags : []
                    return tags.some(t => t === `tier-${tier}`)
                })
            }
        }

        // Remove DNC leads
        leads = await dncService.filterLeads(leads)

        // Remove already-contacted leads (unless re-campaign)
        leads = leads.filter(l => !['booked', 'not-interested'].includes(l.status))

        if (leads.length === 0) {
            throw new Error('No eligible leads found for this campaign')
        }

        const campaign = await prisma.agentInstance.create({
            data: {
                name: name || `Campaign ${new Date().toLocaleDateString()}`,
                status: 'idle',
                currentStep: 'idle',
                scriptId: scriptId || null,
                leadQueue: leads.map(l => l.id),
                completedLeads: [],
                config: {
                    campaignType: 'outreach',
                    targetIndustry: industry || 'general',
                    tier: tier || null,
                    totalLeads: leads.length,
                    delayBetweenCalls: 15000,
                    enableAMD: true,
                    enableFollowUpSms: process.env.FOLLOW_UP_SMS_ENABLED === 'true',
                },
                stats: {
                    totalCalls: 0,
                    booked: 0,
                    followUp: 0,
                    notInterested: 0,
                    noAnswer: 0,
                    voicemail: 0,
                    failed: 0,
                    skipped: 0,
                    avgDuration: 0,
                },
                userId
            }
        })

        return {
            ...campaign,
            leadsCount: leads.length,
            leads: leads.map(l => ({
                id: l.id, name: l.name, phone: l.phone,
                contactPerson: l.contactPerson,
                tier: (l.tags || []).find(t => t.startsWith('tier-'))
            }))
        }
    },

    /**
     * Get all campaigns for a user
     */
    async getAll(userId) {
        const campaigns = await prisma.agentInstance.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                calls: {
                    select: { id: true, status: true, outcome: true, duration: true, createdAt: true }
                }
            }
        })

        return campaigns.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            config: c.config,
            stats: c.stats,
            totalLeads: (c.config?.totalLeads || 0),
            completedLeads: (c.completedLeads || []).length,
            remainingLeads: (c.leadQueue || []).length,
            calls: c.calls.length,
            startedAt: c.startedAt,
            completedAt: c.completedAt,
            createdAt: c.createdAt,
        }))
    },

    /**
     * Get campaign details with full breakdown
     */
    async getById(campaignId, userId) {
        const campaign = await prisma.agentInstance.findFirst({
            where: { id: campaignId, userId },
            include: {
                calls: {
                    include: { lead: true, meetingNotes: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        if (!campaign) throw new Error('Campaign not found')

        // Build funnel data
        const funnel = {
            total: campaign.config?.totalLeads || 0,
            called: (campaign.completedLeads || []).length,
            answered: campaign.calls.filter(c => c.duration && c.duration > 10).length,
            interested: campaign.calls.filter(c => c.outcome === 'booked').length,
            followUp: campaign.calls.filter(c => c.outcome === 'follow-up').length,
            notInterested: campaign.calls.filter(c => c.outcome === 'not-interested').length,
            noAnswer: campaign.calls.filter(c => c.outcome === 'voicemail' || c.status === 'no-answer').length,
        }

        // Next actions
        const nextActions = []
        const followUps = campaign.calls.filter(c => c.outcome === 'follow-up')
        if (followUps.length > 0) {
            nextActions.push({ type: 'follow-up', count: followUps.length, label: `${followUps.length} follow-ups due` })
        }
        const interested = campaign.calls.filter(c => c.outcome === 'booked')
        if (interested.length > 0) {
            nextActions.push({ type: 'demo', count: interested.length, label: `${interested.length} interested — schedule demo` })
        }
        const remaining = (campaign.leadQueue || []).length
        if (remaining > 0) {
            nextActions.push({ type: 'remaining', count: remaining, label: `${remaining} leads remaining` })
        }

        return { ...campaign, funnel, nextActions }
    },

    /**
     * Get campaign analytics/stats across all campaigns
     */
    async getAnalytics(userId, dateRange = '30d') {
        const now = new Date()
        let since = new Date()

        switch (dateRange) {
            case 'today': since.setHours(0, 0, 0, 0); break
            case '7d': since.setDate(now.getDate() - 7); break
            case '30d': since.setDate(now.getDate() - 30); break
            case 'all': since = new Date(0); break
        }

        const calls = await prisma.call.findMany({
            where: { userId, createdAt: { gte: since } },
            select: {
                id: true, status: true, outcome: true, duration: true,
                sentiment: true, createdAt: true, agentInstanceId: true
            },
            orderBy: { createdAt: 'asc' }
        })

        // Outcome breakdown
        const outcomeBreakdown = {}
        calls.forEach(c => {
            const o = c.outcome || 'pending'
            outcomeBreakdown[o] = (outcomeBreakdown[o] || 0) + 1
        })

        // Daily volume
        const dailyMap = {}
        calls.forEach(c => {
            const day = c.createdAt.toISOString().split('T')[0]
            if (!dailyMap[day]) dailyMap[day] = { date: day, count: 0, booked: 0 }
            dailyMap[day].count++
            if (c.outcome === 'booked') dailyMap[day].booked++
        })
        const dailyVolume = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

        // Agent performance
        const agentMap = {}
        const campaigns = await prisma.agentInstance.findMany({
            where: { userId },
            select: { id: true, name: true, status: true, stats: true }
        })
        campaigns.forEach(a => {
            agentMap[a.id] = {
                name: a.name,
                calls: 0,
                booked: 0,
                totalDuration: 0,
                status: a.status
            }
        })
        calls.forEach(c => {
            if (c.agentInstanceId && agentMap[c.agentInstanceId]) {
                agentMap[c.agentInstanceId].calls++
                if (c.outcome === 'booked') agentMap[c.agentInstanceId].booked++
                if (c.duration) agentMap[c.agentInstanceId].totalDuration += c.duration
            }
        })
        const agentPerformance = Object.values(agentMap).map(a => ({
            name: a.name,
            calls: a.calls,
            bookRate: a.calls > 0 ? (a.booked / a.calls) * 100 : 0,
            avgDuration: a.calls > 0 ? Math.round(a.totalDuration / a.calls) : 0,
            status: a.status
        }))

        const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0)

        return {
            totalCalls: calls.length,
            todayCalls: calls.filter(c => c.createdAt >= new Date(now.setHours(0, 0, 0, 0))).length,
            bookedCount: outcomeBreakdown['booked'] || 0,
            avgDuration: calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
            conversionRate: calls.length > 0 ? Math.round(((outcomeBreakdown['booked'] || 0) / calls.length) * 100) : 0,
            outcomeBreakdown,
            dailyVolume,
            agentPerformance,
        }
    },

    /**
     * Update campaign stats after a call completes
     */
    async updateStatsFromCall(campaignId, callOutcome, callDuration) {
        if (!campaignId) return

        try {
            const campaign = await prisma.agentInstance.findFirst({
                where: { id: campaignId }
            })
            if (!campaign) return

            const stats = campaign.stats || {}
            stats.totalCalls = (stats.totalCalls || 0) + 1

            switch (callOutcome) {
                case 'booked': stats.booked = (stats.booked || 0) + 1; break
                case 'follow-up': stats.followUp = (stats.followUp || 0) + 1; break
                case 'not-interested': stats.notInterested = (stats.notInterested || 0) + 1; break
                case 'voicemail': stats.voicemail = (stats.voicemail || 0) + 1; break
                case 'no-answer': stats.noAnswer = (stats.noAnswer || 0) + 1; break
                default: break
            }

            // Running average duration
            if (callDuration) {
                const totalDurationEstimate = (stats.avgDuration || 0) * ((stats.totalCalls || 1) - 1)
                stats.avgDuration = Math.round((totalDurationEstimate + callDuration) / stats.totalCalls)
            }

            await prisma.agentInstance.update({
                where: { id: campaignId },
                data: { stats }
            })
        } catch (err) {
            logger.error('Campaign stats update error:', { error: err.message })
        }
    }
}

export default campaignService
