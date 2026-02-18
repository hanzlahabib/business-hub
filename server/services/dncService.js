/**
 * Do Not Call (DNC) Service
 *
 * Manages opt-out list for TCPA compliance.
 * Checks phone numbers before initiating calls.
 * Supports: manual add, auto-add from SMS "STOP", bulk import.
 *
 * Uses Lead model tags field for DNC tracking (no schema migration needed).
 * A lead tagged with "opted-out" or "dnc" is on the DNC list.
 */

import prisma from '../config/prisma.js'
import logger from '../config/logger.js'

// In-memory cache for fast DNC lookups during batch calls
let dncCache = new Set()
let cacheLoadedAt = 0
const CACHE_TTL = 60000 // 1 minute

export const dncService = {
    /**
     * Check if a phone number is on the DNC list
     * @param {string} phone — phone number (any format)
     * @returns {boolean} true if on DNC
     */
    async isBlocked(phone) {
        if (!phone) return false
        const normalized = this._normalize(phone)

        // Check in-memory cache first
        if (Date.now() - cacheLoadedAt < CACHE_TTL && dncCache.size > 0) {
            return dncCache.has(normalized)
        }

        // Load from DB
        await this._refreshCache()
        return dncCache.has(normalized)
    },

    /**
     * Add a phone number to the DNC list
     * @param {string} phone
     * @param {string} reason — 'sms-stop', 'manual', 'complaint', etc.
     */
    async addToDNC(phone, reason = 'manual') {
        if (!phone) return
        const normalized = this._normalize(phone)

        try {
            const lead = await prisma.lead.findFirst({ where: { phone } })
            if (lead) {
                const tags = Array.isArray(lead.tags) ? lead.tags : []
                if (!tags.includes('opted-out')) {
                    tags.push('opted-out')
                    tags.push(`dnc-reason:${reason}`)
                    tags.push(`dnc-date:${new Date().toISOString().split('T')[0]}`)
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { tags, status: 'not-interested' }
                    })
                }
            }

            // Update cache
            dncCache.add(normalized)
            logger.info(`🚫 DNC: Added ${phone} (reason: ${reason})`)
        } catch (err) {
            logger.error('DNC add error:', { error: err.message })
        }
    },

    /**
     * Remove a phone number from the DNC list
     */
    async removeFromDNC(phone) {
        if (!phone) return
        const normalized = this._normalize(phone)

        try {
            const lead = await prisma.lead.findFirst({ where: { phone } })
            if (lead) {
                const tags = (Array.isArray(lead.tags) ? lead.tags : [])
                    .filter(t => !t.startsWith('opted-out') && !t.startsWith('dnc-'))
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { tags }
                })
            }

            dncCache.delete(normalized)
            logger.info(`✅ DNC: Removed ${phone}`)
        } catch (err) {
            logger.error('DNC remove error:', { error: err.message })
        }
    },

    /**
     * Get full DNC list
     */
    async getDNCList(userId) {
        const leads = await prisma.lead.findMany({
            where: {
                userId,
                tags: { array_contains: ['opted-out'] }
            },
            select: { id: true, name: true, phone: true, tags: true, lastContactedAt: true }
        })

        return leads.map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            reason: (l.tags || []).find(t => t.startsWith('dnc-reason:'))?.replace('dnc-reason:', '') || 'unknown',
            date: (l.tags || []).find(t => t.startsWith('dnc-date:'))?.replace('dnc-date:', '') || null
        }))
    },

    /**
     * Filter a list of leads, removing DNC entries
     */
    async filterLeads(leads) {
        await this._refreshCache()
        return leads.filter(l => {
            if (!l.phone) return false
            return !dncCache.has(this._normalize(l.phone))
        })
    },

    /**
     * Refresh the in-memory DNC cache
     */
    async _refreshCache() {
        try {
            const dncLeads = await prisma.lead.findMany({
                where: {
                    tags: { array_contains: ['opted-out'] }
                },
                select: { phone: true }
            })

            dncCache = new Set(
                dncLeads
                    .filter(l => l.phone)
                    .map(l => this._normalize(l.phone))
            )
            cacheLoadedAt = Date.now()
        } catch (err) {
            // array_contains might not work with Json type — fallback
            try {
                const allLeads = await prisma.lead.findMany({
                    where: { status: 'not-interested' },
                    select: { phone: true, tags: true }
                })
                dncCache = new Set(
                    allLeads
                        .filter(l => l.phone && Array.isArray(l.tags) && l.tags.includes('opted-out'))
                        .map(l => this._normalize(l.phone))
                )
                cacheLoadedAt = Date.now()
            } catch (err2) {
                logger.error('DNC cache refresh error:', { error: err2.message })
            }
        }
    },

    /**
     * Normalize phone number for consistent matching
     */
    _normalize(phone) {
        return (phone || '').replace(/\D/g, '').replace(/^1/, '')
    }
}

export default dncService
