import { test, expect } from '@playwright/test'
import { registerOrLogin, authHeaders, testState as sharedState, API_URL } from '../helpers.js'

const API = `${API_URL}/api`

/**
 * Cleanup Suite — Runs AFTER all other E2E tests to remove test data.
 * This makes the E2E suite idempotent: can re-run without manual cleanup.
 *
 * NOTE: This suite is intentionally run last. To enforce ordering,
 * the file is prefixed with 'z-' so it sorts after other test files.
 */

test.describe('Suite Z: Cleanup', () => {
    async function ensureLoggedIn(request) {
        if (!sharedState.token) {
            await registerOrLogin(request)
        }
    }

    test('12.0 — Setup: login', async ({ request }) => {
        const user = await registerOrLogin(request)
        expect(sharedState.userId).toBeTruthy()
        expect(sharedState.token).toBeTruthy()
    })

    test('12.1 — Delete all test leads (and their proposals)', async ({ request }) => {
        await ensureLoggedIn(request)

        const res = await request.get(`${API}/leads`, {
            headers: authHeaders()
        })
        const leads = await res.json()

        if (Array.isArray(leads)) {
            for (const lead of leads) {
                if (lead.name?.startsWith('E2E') || lead.email?.includes('e2e')) {
                    // Delete proposals linked to this lead first (FK constraint)
                    const propRes = await request.get(`${API}/proposals?leadId=${lead.id}`, {
                        headers: authHeaders()
                    })
                    if (propRes.ok()) {
                        const proposals = await propRes.json()
                        if (Array.isArray(proposals)) {
                            for (const p of proposals) {
                                await request.delete(`${API}/proposals/${p.id}`, {
                                    headers: authHeaders()
                                })
                            }
                        }
                    }
                    await request.delete(`${API}/leads/${lead.id}`, {
                        headers: authHeaders()
                    })
                }
            }
        }
        const after = await request.get(`${API}/leads`, {
            headers: authHeaders()
        })
        expect(after.ok()).toBeTruthy()
    })

    test('12.2 — Delete all test jobs', async ({ request }) => {
        await ensureLoggedIn(request)

        const res = await request.get(`${API}/jobs`, {
            headers: authHeaders()
        })
        const jobs = await res.json()

        if (Array.isArray(jobs)) {
            for (const job of jobs) {
                if (job.title?.startsWith('E2E') || job.company?.includes('E2E')) {
                    await request.delete(`${API}/jobs/${job.id}`, {
                        headers: authHeaders()
                    })
                }
            }
        }
        const after = await request.get(`${API}/jobs`, {
            headers: authHeaders()
        })
        expect(after.ok()).toBeTruthy()
    })

    test('12.3 — Delete all test taskboards', async ({ request }) => {
        await ensureLoggedIn(request)

        const res = await request.get(`${API}/resources/taskboards`, {
            headers: authHeaders()
        })
        const boards = await res.json()

        if (Array.isArray(boards)) {
            for (const board of boards) {
                if (board.name?.startsWith('E2E')) {
                    await request.delete(`${API}/resources/taskboards/${board.id}`, {
                        headers: authHeaders()
                    })
                }
            }
        }
        expect(true).toBeTruthy()
    })

    test('12.4 — Delete all test templates', async ({ request }) => {
        await ensureLoggedIn(request)

        const res = await request.get(`${API}/resources/templates`, {
            headers: authHeaders()
        })
        const templates = await res.json()

        if (Array.isArray(templates)) {
            for (const tmpl of templates) {
                if (tmpl.name?.startsWith('E2E')) {
                    await request.delete(`${API}/resources/templates/${tmpl.id}`, {
                        headers: authHeaders()
                    })
                }
            }
        }
        expect(true).toBeTruthy()
    })

    test('12.5 — Verify clean state', async ({ request }) => {
        await ensureLoggedIn(request)

        const [leads, jobs] = await Promise.all([
            request.get(`${API}/leads`, { headers: authHeaders() }),
            request.get(`${API}/jobs`, { headers: authHeaders() })
        ])

        expect(leads.ok()).toBeTruthy()
        expect(jobs.ok()).toBeTruthy()

        const leadsData = await leads.json()
        const jobsData = await jobs.json()

        if (Array.isArray(leadsData)) {
            const e2eLeads = leadsData.filter(l => l.name?.startsWith('E2E'))
            expect(e2eLeads.length).toBe(0)
        }
        if (Array.isArray(jobsData)) {
            const e2eJobs = jobsData.filter(j => j.title?.startsWith('E2E'))
            expect(e2eJobs.length).toBe(0)
        }
    })
})
