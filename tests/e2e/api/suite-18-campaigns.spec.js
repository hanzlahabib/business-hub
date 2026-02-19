import { test, expect } from '@playwright/test'
import {
    API_URL, registerOrLogin, authHeaders, createLead,
} from '../helpers.js'

/**
 * Suite 18: Campaigns E2E Tests
 * Covers: list, create, get by ID, analytics, DNC list management,
 *         validation, and auth guards.
 *
 * Note: Campaign creation requires leads with phone numbers.
 * The transcribe and call-initiation endpoints require external services
 * and are tested for error handling only.
 */

const API = `${API_URL}/api`
let campaignId = null
let leadIds = []

test.describe('Suite 18: Campaigns', () => {
    test.beforeAll(async ({ request }) => {
        await registerOrLogin(request)

        // Create leads with phone numbers for campaign eligibility
        for (let i = 0; i < 3; i++) {
            const lead = await createLead(request, {
                name: `E2E Campaign Lead ${i + 1}`,
                email: `campaign-lead-${i + 1}@e2e.com`,
                status: 'new',
                company: `E2E Corp ${i + 1}`,
                phone: `+1555000${1000 + i}`,
            })
            leadIds.push(lead.id)
        }
    })

    // ════════════════════════════════════════════════════════════════
    // GET /api/campaigns — list (empty state)
    // ════════════════════════════════════════════════════════════════

    test('18.1 — List campaigns', async ({ request }) => {
        const res = await request.get(`${API}/campaigns`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(Array.isArray(body)).toBeTruthy()
    })

    // ════════════════════════════════════════════════════════════════
    // POST /api/campaigns — create
    // ════════════════════════════════════════════════════════════════

    test('18.2 — Create campaign with specific leadIds', async ({ request }) => {
        const res = await request.post(`${API}/campaigns`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Outreach Campaign',
                leadIds,
                industry: 'technology',
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body).toHaveProperty('id')
        expect(body.name).toBe('E2E Outreach Campaign')
        expect(body).toHaveProperty('leadsCount')
        expect(body.leadsCount).toBeGreaterThanOrEqual(1)
        expect(body).toHaveProperty('leads')
        expect(Array.isArray(body.leads)).toBeTruthy()
        campaignId = body.id
    })

    test('18.3 — Create campaign with no eligible leads → 400', async ({ request }) => {
        const res = await request.post(`${API}/campaigns`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Empty Campaign',
                leadIds: ['non-existent-lead-id'],
            },
        })
        expect(res.status()).toBe(400)
        const body = await res.json()
        expect(body.error).toContain('No eligible leads')
    })

    // ════════════════════════════════════════════════════════════════
    // GET /api/campaigns/:id — get by ID
    // ════════════════════════════════════════════════════════════════

    test('18.4 — Get campaign by ID with funnel data', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/${campaignId}`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.id).toBe(campaignId)
        expect(body.name).toBe('E2E Outreach Campaign')
        expect(body).toHaveProperty('funnel')
        expect(body.funnel).toHaveProperty('total')
        expect(body.funnel).toHaveProperty('called')
        expect(body.funnel).toHaveProperty('answered')
        expect(body.funnel).toHaveProperty('interested')
        expect(body).toHaveProperty('nextActions')
        expect(Array.isArray(body.nextActions)).toBeTruthy()
        expect(body).toHaveProperty('config')
        expect(body.config.campaignType).toBe('outreach')
    })

    test('18.5 — Get non-existent campaign → 404', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/non-existent-id-xyz`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    // ════════════════════════════════════════════════════════════════
    // GET /api/campaigns/analytics — analytics dashboard
    // ════════════════════════════════════════════════════════════════

    test('18.6 — Analytics returns correct structure', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/analytics`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body).toHaveProperty('totalCalls')
        expect(typeof body.totalCalls).toBe('number')
        expect(body).toHaveProperty('todayCalls')
        expect(body).toHaveProperty('bookedCount')
        expect(body).toHaveProperty('avgDuration')
        expect(body).toHaveProperty('conversionRate')
        expect(body).toHaveProperty('outcomeBreakdown')
        expect(body).toHaveProperty('dailyVolume')
        expect(Array.isArray(body.dailyVolume)).toBeTruthy()
        expect(body).toHaveProperty('agentPerformance')
        expect(Array.isArray(body.agentPerformance)).toBeTruthy()
    })

    test('18.7 — Analytics with range filter', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/analytics?range=7d`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body).toHaveProperty('totalCalls')
    })

    // ════════════════════════════════════════════════════════════════
    // DNC (Do Not Call) List
    // ════════════════════════════════════════════════════════════════

    test('18.8 — Get DNC list', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/dnc/list`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(Array.isArray(body)).toBeTruthy()
    })

    test('18.9 — Add existing lead phone to DNC list', async ({ request }) => {
        // DNC service tags existing leads by phone — use a real lead phone
        const res = await request.post(`${API}/campaigns/dnc/add`, {
            headers: authHeaders(),
            data: {
                phone: '+15550001000',
                reason: 'E2E test — do not call',
            },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.success).toBe(true)
    })

    test('18.10 — DNC list now includes tagged lead', async ({ request }) => {
        const res = await request.get(`${API}/campaigns/dnc/list`, {
            headers: authHeaders(),
        })
        const list = await res.json()
        const found = list.some(entry => entry.phone === '+15550001000')
        expect(found).toBeTruthy()
    })

    test('18.11 — Remove phone from DNC list', async ({ request }) => {
        const res = await request.delete(`${API}/campaigns/dnc/remove`, {
            headers: authHeaders(),
            data: { phone: '+15550001000' },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.success).toBe(true)
    })

    // ════════════════════════════════════════════════════════════════
    // POST /api/campaigns/:id/transcribe — error handling
    // ════════════════════════════════════════════════════════════════

    test('18.12 — Transcribe with no untranscribed calls', async ({ request }) => {
        const res = await request.post(`${API}/campaigns/${campaignId}/transcribe`, {
            headers: authHeaders(),
        })
        // Should succeed even with nothing to transcribe
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body).toHaveProperty('results')
    })

    // ════════════════════════════════════════════════════════════════
    // Auth guard
    // ════════════════════════════════════════════════════════════════

    test('18.13 — Unauthenticated requests are rejected', async ({ request }) => {
        const endpoints = [
            request.get(`${API}/campaigns`),
            request.post(`${API}/campaigns`, { data: { name: 'X' } }),
            request.get(`${API}/campaigns/analytics`),
            request.get(`${API}/campaigns/some-id`),
        ]
        const responses = await Promise.all(endpoints)
        for (const res of responses) {
            expect(res.status()).toBe(401)
        }
    })

    // ════════════════════════════════════════════════════════════════
    // Cleanup
    // ════════════════════════════════════════════════════════════════

    test('18.14 — Cleanup: delete test leads and campaign', async ({ request }) => {
        // Delete all E2E campaign leads (fetch fresh list since statuses may have changed)
        const listRes = await request.get(`${API}/leads`, {
            headers: authHeaders(),
        })
        const allLeads = await listRes.json()
        const e2eLeads = allLeads.filter(l =>
            l.name?.startsWith('E2E Campaign') || l.email?.includes('campaign-lead')
        )
        for (const lead of e2eLeads) {
            const del = await request.delete(`${API}/leads/${lead.id}`, {
                headers: authHeaders(),
            })
            expect([200, 204].includes(del.status())).toBeTruthy()
        }

        // Verify
        const afterRes = await request.get(`${API}/leads`, {
            headers: authHeaders(),
        })
        const remaining = await afterRes.json()
        const leftover = remaining.filter(l => l.name?.startsWith('E2E Campaign'))
        expect(leftover.length).toBe(0)
    })
})
