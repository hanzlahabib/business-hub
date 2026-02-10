import * as cheerio from 'cheerio'

// Scrape Google search results for potential leads
export async function scrapeLeads(query, maxResults = 20) {
    const results = []
    const seen = new Set()

    // Google search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${Math.min(maxResults, 30)}`

    try {
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        })

        const html = await response.text()
        const $ = cheerio.load(html)

        // Parse Google search result links
        $('a').each((_, el) => {
            const href = $(el).attr('href') || ''
            // Google wraps links in /url?q=... format
            const match = href.match(/\/url\?q=(https?:\/\/[^&]+)/)
            if (match) {
                const url = decodeURIComponent(match[1])
                // Skip Google/social/common sites
                if (shouldSkip(url)) return
                if (seen.has(url)) return
                seen.add(url)

                // Get the link text as business name
                const title = $(el).text().trim()
                if (title && title.length > 2 && title.length < 200) {
                    results.push({
                        name: cleanTitle(title),
                        website: url,
                        source: 'google_search',
                        query
                    })
                }
            }
        })
    } catch (error) {
        console.error('Google search scrape error:', error.message)
    }

    return results.slice(0, maxResults)
}

// Try to extract email and contact info from a website
export async function scrapeWebsite(url) {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
        })

        clearTimeout(timeout)
        const html = await response.text()
        const $ = cheerio.load(html)

        const info = {
            emails: [],
            phones: [],
            contactPerson: null,
            industry: null
        }

        // Extract emails from page
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        const bodyText = $('body').text()
        const emails = bodyText.match(emailRegex) || []
        info.emails = [...new Set(emails.filter(e =>
            !e.includes('example.com') &&
            !e.includes('sentry.io') &&
            !e.includes('webpack') &&
            !e.endsWith('.png') &&
            !e.endsWith('.jpg')
        ))].slice(0, 3)

        // Check mailto links
        $('a[href^="mailto:"]').each((_, el) => {
            const email = $(el).attr('href').replace('mailto:', '').split('?')[0]
            if (email && !info.emails.includes(email)) {
                info.emails.unshift(email) // Prioritize mailto links
            }
        })

        // Extract phone numbers
        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
        const phones = bodyText.match(phoneRegex) || []
        info.phones = [...new Set(phones.filter(p => p.replace(/\D/g, '').length >= 10))].slice(0, 2)

        // Check tel links
        $('a[href^="tel:"]').each((_, el) => {
            const phone = $(el).attr('href').replace('tel:', '')
            if (phone && !info.phones.includes(phone)) {
                info.phones.unshift(phone)
            }
        })

        // Try to extract meta description for industry hints
        const metaDesc = $('meta[name="description"]').attr('content') || ''
        const title = $('title').text() || ''
        info.industry = guessIndustry(title + ' ' + metaDesc)

        return info
    } catch (error) {
        return { emails: [], phones: [], contactPerson: null, industry: null }
    }
}

// Check if the scraped leads duplicate existing ones
export function deduplicateLeads(scraped, existing) {
    const existingWebsites = new Set(existing.map(l => normalizeDomain(l.website || '')))
    const existingEmails = new Set(existing.map(l => (l.email || '').toLowerCase()))
    const existingNames = new Set(existing.map(l => (l.name || '').toLowerCase()))

    return scraped.filter(lead => {
        const domain = normalizeDomain(lead.website || '')
        const email = (lead.email || '').toLowerCase()
        const name = (lead.name || '').toLowerCase()

        if (domain && existingWebsites.has(domain)) return false
        if (email && existingEmails.has(email)) return false
        if (name && existingNames.has(name)) return false
        return true
    })
}

// ---- Helpers ----

function shouldSkip(url) {
    const skipDomains = [
        'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
        'instagram.com', 'linkedin.com', 'wikipedia.org', 'reddit.com',
        'amazon.com', 'ebay.com', 'yelp.com', 'pinterest.com', 'tiktok.com',
        'github.com', 'stackoverflow.com', 'medium.com', 'quora.com',
        'apple.com', 'microsoft.com', 'support.google.com', 'accounts.google.com'
    ]
    return skipDomains.some(d => url.includes(d))
}

function cleanTitle(title) {
    // Remove common suffixes like " - Home", " | Website"
    return title
        .replace(/\s*[|–—-]\s*(home|website|official|about|contact).*/i, '')
        .replace(/\s*\.\.\.$/, '')
        .substring(0, 100)
        .trim()
}

function normalizeDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return ''
    }
}

function guessIndustry(text) {
    const lower = text.toLowerCase()
    const industries = {
        'web design': ['web design', 'website development', 'ui/ux'],
        'software': ['software', 'saas', 'app development', 'mobile app'],
        'marketing': ['marketing', 'seo', 'digital marketing', 'advertising'],
        'consulting': ['consulting', 'consultancy', 'advisory'],
        'ecommerce': ['ecommerce', 'e-commerce', 'online store', 'shopify'],
        'real estate': ['real estate', 'property', 'realty'],
        'healthcare': ['health', 'medical', 'clinic', 'hospital'],
        'education': ['education', 'training', 'academy', 'school'],
        'finance': ['finance', 'accounting', 'fintech', 'banking'],
        'construction': ['construction', 'builder', 'contractor']
    }

    for (const [industry, keywords] of Object.entries(industries)) {
        if (keywords.some(kw => lower.includes(kw))) return industry
    }
    return null
}
