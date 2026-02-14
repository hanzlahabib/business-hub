import { test, expect } from '@playwright/test'
import { login, API_URL } from '../helpers.js'

const API = `${API_URL}/api`

/**
 * Cleanup Suite — Runs AFTER all other E2E tests to remove test data.
 * This makes the E2E suite idempotent: can re-run without manual cleanup.
 *
 * NOTE: This suite is intentionally run last. To enforce ordering,
 * the file is prefixed with 'z-' so it sorts after other test files.
 */

test.describe('Suite 12: Cleanup', () => {
    let testState = {}

    test('12.0 — Setup: login', async ({ request }) => {
        const user = await login(request)
        testState.userId = user.id
        expect(testState.userId).toBeTruthy()
    })

    test('12.1 — Delete all test leads', async ({ request }) => {
        if (!testState.userId) { const u = await login(request); testState.userId = u.id }

        const res = await request.get(`${API}/leads`, {
            headers: { 'x-user-id': testState.userId }
        })
        const leads = await res.json()

        if (Array.isArray(leads)) {
            for (const lead of leads) {
                // Only delete leads created by E2E tests
                if (lead.name?.startsWith('E2E') || lead.email?.includes('e2e')) {
                    await request.delete(`${API}/leads/${lead.id}`, {
                        headers: { 'x-user-id': testState.userId }
                    })
                }
            }
        }
        // Verify cleanup
        const after = await request.get(`${API}/leads`, {
            headers: { 'x-user-id': testState.userId }
        })
        expect(after.ok()).toBeTruthy()
    })

    test('12.2 — Delete all test jobs', async ({ request }) => {
        if (!testState.userId) { const u = await login(request); testState.userId = u.id }

        const res = await request.get(`${API}/jobs`, {
            headers: { 'x-user-id': testState.userId }
        })
        const jobs = await res.json()

        if (Array.isArray(jobs)) {
            for (const job of jobs) {
                if (job.title?.startsWith('E2E') || job.company?.includes('E2E')) {
                    await request.delete(`${API}/jobs/${job.id}`, {
                        headers: { 'x-user-id': testState.userId }
                    })
                }
            }
        }
        const after = await request.get(`${API}/jobs`, {
            headers: { 'x-user-id': testState.userId }
        })
        expect(after.ok()).toBeTruthy()
    })

    test('12.3 — Delete all test taskboards', async ({ request }) => {
        if (!testState.userId) { const u = await login(request); testState.userId = u.id }

        const res = await request.get(`${API}/resources/taskboards`, {
            headers: { 'x-user-id': testState.userId }
        })
        const boards = await res.json()

        if (Array.isArray(boards)) {
            for (const board of boards) {
                if (board.name?.startsWith('E2E')) {
                    await request.delete(`${API}/resources/taskboards/${board.id}`, {
                        headers: { 'x-user-id': testState.userId }
                    })
                }
            }
        }
        expect(true).toBeTruthy()
    })

    test('12.4 — Delete all test templates', async ({ request }) => {
        if (!testState.userId) { const u = await login(request); testState.userId = u.id }

        const res = await request.get(`${API}/resources/templates`, {
            headers: { 'x-user-id': testState.userId }
        })
        const templates = await res.json()

        if (Array.isArray(templates)) {
            for (const tmpl of templates) {
                if (tmpl.name?.startsWith('E2E')) {
                    await request.delete(`${API}/resources/templates/${tmpl.id}`, {
                        headers: { 'x-user-id': testState.userId }
                    })
                }
            }
        }
        expect(true).toBeTruthy()
    })

    test('12.5 — Verify clean state', async ({ request }) => {
        if (!testState.userId) { const u = await login(request); testState.userId = u.id }

        // Verify no E2E data remains
        const [leads, jobs] = await Promise.all([
            request.get(`${API}/leads`, { headers: { 'x-user-id': testState.userId } }),
            request.get(`${API}/jobs`, { headers: { 'x-user-id': testState.userId } })
        ])

        expect(leads.ok()).toBeTruthy()
        expect(jobs.ok()).toBeTruthy()

        const leadsData = await leads.json()
        const jobsData = await jobs.json()

        // Should have no E2E-prefixed items left
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
