import express from 'express'
import authMiddleware from '../middleware/auth.js'
import prisma from '../config/prisma.js'
import { scrapeLeads, scrapeWebsite, deduplicateLeads } from '../services/leadScraper.js'

const router = express.Router()
router.use(authMiddleware)

// Search Google for potential leads
router.post('/search', async (req, res) => {
    const { query, maxResults = 15, enrichContacts = false } = req.body

    if (!query) {
        return res.status(400).json({ success: false, error: 'Search query is required' })
    }

    try {
        // Scrape Google search results
        let leads = await scrapeLeads(query, maxResults)

        // Deduplicate against existing leads
        const existing = await prisma.lead.findMany({
            where: { userId: req.user.id },
            select: { name: true, email: true, website: true }
        })
        leads = deduplicateLeads(leads, existing)

        // Optionally enrich leads with contact info from their websites
        if (enrichContacts && leads.length > 0) {
            const enriched = []
            for (const lead of leads.slice(0, 10)) { // Limit to 10 to avoid delays
                const info = await scrapeWebsite(lead.website)
                enriched.push({
                    ...lead,
                    email: info.emails[0] || null,
                    phone: info.phones[0] || null,
                    industry: info.industry || lead.industry,
                    contactPerson: info.contactPerson
                })
                // Rate limit: small delay between requests
                await new Promise(r => setTimeout(r, 500))
            }
            // Add non-enriched ones
            enriched.push(...leads.slice(10))
            leads = enriched
        }

        res.json({
            success: true,
            query,
            count: leads.length,
            leads
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Import selected scraped leads into the database
router.post('/import', async (req, res) => {
    const { leads } = req.body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ success: false, error: 'Leads array is required' })
    }

    try {
        const created = []
        for (const lead of leads) {
            const record = await prisma.lead.create({
                data: {
                    name: lead.name || 'Unknown',
                    email: lead.email || null,
                    phone: lead.phone || null,
                    website: lead.website || null,
                    industry: lead.industry || null,
                    source: lead.source || 'scraper',
                    status: 'new',
                    contactPerson: lead.contactPerson || null,
                    notes: lead.query ? `Found via search: "${lead.query}"` : null,
                    userId: req.user.id
                }
            })
            created.push(record)
        }

        res.json({
            success: true,
            imported: created.length,
            leads: created
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Enrich a single lead with website data
router.post('/enrich/:id', async (req, res) => {
    try {
        const lead = await prisma.lead.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        })

        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' })
        if (!lead.website) return res.status(400).json({ success: false, error: 'Lead has no website to scrape' })

        const info = await scrapeWebsite(lead.website)

        const updates = {}
        if (info.emails[0] && !lead.email) updates.email = info.emails[0]
        if (info.phones[0] && !lead.phone) updates.phone = info.phones[0]
        if (info.industry && !lead.industry) updates.industry = info.industry
        if (info.contactPerson && !lead.contactPerson) updates.contactPerson = info.contactPerson

        if (Object.keys(updates).length > 0) {
            const updated = await prisma.lead.update({
                where: { id: lead.id },
                data: updates
            })
            res.json({ success: true, lead: updated, enrichedFields: Object.keys(updates) })
        } else {
            res.json({ success: true, lead, enrichedFields: [], message: 'No new data found' })
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
