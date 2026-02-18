import { test, expect } from '@playwright/test'
import {
    API_URL, TEST_EMAIL, TEST_PASSWORD, TEST_NAME,
    testState, registerOrLogin, authHeaders,
    createLead, createJob, createBoard,
} from '../helpers.js'

// =====================================
// Test Suite 1: API Health & Connectivity
// =====================================

test.describe('Suite 1: Health & Connectivity', () => {
    test('1.1 — Health check returns ok', async ({ request }) => {
        const res = await request.get(`${API_URL}/api/health`)
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.status).toBe('ok')
        expect(body.database).toBeTruthy()
        expect(body.timestamp).toBeTruthy()
    })

    test('1.2 — CORS headers present', async ({ request }) => {
        const res = await request.fetch(`${API_URL}/api/health`, {
            method: 'OPTIONS',
            headers: { Origin: 'http://localhost:5175' },
        })
        const headers = res.headers()
        expect(headers['access-control-allow-origin']).toBeTruthy()
    })
})

// =====================================
// Test Suite 2: Authentication
// =====================================

test.describe('Suite 2: Authentication', () => {
    test('2.1 — Register or login test user', async ({ request }) => {
        const user = await registerOrLogin(request)
        expect(user.id).toBeTruthy()
        expect(user.email).toBeTruthy()
    })

    test('2.2 — Login', async ({ request }) => {
        const res = await request.post(`${API_URL}/api/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.user.id).toBeTruthy()
        testState.userId = body.user.id
    })

    test('2.3 — Duplicate registration fails', async ({ request }) => {
        const res = await request.post(`${API_URL}/api/auth/register`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Dup' },
        })
        expect([400, 409]).toContain(res.status())
    })

    test('2.4 — Register with bad email → 422', async ({ request }) => {
        const res = await request.post(`${API_URL}/api/auth/register`, {
            data: { email: 'notanemail', password: TEST_PASSWORD },
        })
        expect(res.status()).toBe(422)
    })

    test('2.5 — Register with short password → 422', async ({ request }) => {
        const res = await request.post(`${API_URL}/api/auth/register`, {
            data: { email: 'shortpw@test.com', password: 'ab' },
        })
        expect(res.status()).toBe(422)
    })

    test('2.6 — Login with wrong password → 401', async ({ request }) => {
        const res = await request.post(`${API_URL}/api/auth/login`, {
            data: { email: TEST_EMAIL, password: 'wrongpassword123' },
        })
        expect(res.status()).toBe(401)
    })
})

// =====================================
// Test Suite 3: Leads CRUD
// =====================================

test.describe('Suite 3: Leads CRUD', () => {
    test('3.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('3.1 — List leads', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/leads`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        expect(Array.isArray(await res.json())).toBe(true)
    })

    test('3.2 — Create lead', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const lead = await createLead(request)
        expect(lead.id).toBeTruthy()
        expect(lead.name).toBe('Test Corp')
        expect(lead.status).toBe('new')
    })

    test('3.3 — Get lead by ID', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.leadId) await createLead(request)
        const res = await request.get(`${API_URL}/api/leads/${testState.leadId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.id).toBe(testState.leadId)
    })

    test('3.4 — Update lead', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.leadId) await createLead(request)
        const res = await request.put(`${API_URL}/api/leads/${testState.leadId}`, {
            headers: authHeaders(),
            data: { status: 'contacted' },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.status).toBe('contacted')
    })

    test('3.5 — Get non-existent lead → 404', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/leads/nonexistent-id-abc`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    test('3.6 — Create lead without required fields → 422', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.post(`${API_URL}/api/leads`, {
            headers: authHeaders(),
            data: {},
        })
        expect(res.status()).toBe(422)
    })

    test('3.7 — Delete lead', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.leadId) await createLead(request)
        const res = await request.delete(`${API_URL}/api/leads/${testState.leadId}`, {
            headers: authHeaders(),
        })
        expect([200, 204]).toContain(res.status())
        testState.leadId = null
    })
})

// =====================================
// Test Suite 4: Jobs CRUD
// =====================================

test.describe('Suite 4: Jobs CRUD', () => {
    test('4.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('4.1 — List jobs', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/jobs`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        expect(Array.isArray(await res.json())).toBe(true)
    })

    test('4.2 — Create job', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const job = await createJob(request)
        expect(job.id).toBeTruthy()
        expect(job.title).toBe('Senior Dev')
        expect(job.company).toBe('Acme')
    })

    test('4.3 — Update job', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.jobId) await createJob(request)
        const res = await request.put(`${API_URL}/api/jobs/${testState.jobId}`, {
            headers: authHeaders(),
            data: { status: 'applied' },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.status).toBe('applied')
    })

    test('4.4 — Get non-existent job → 404', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/jobs/nonexistent-job-xyz`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    test('4.5 — Create job without required fields → 422', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.post(`${API_URL}/api/jobs`, {
            headers: authHeaders(),
            data: {},
        })
        expect(res.status()).toBe(422)
    })

    test('4.6 — Delete job', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.jobId) await createJob(request)
        const res = await request.delete(`${API_URL}/api/jobs/${testState.jobId}`, {
            headers: authHeaders(),
        })
        expect([200, 204]).toContain(res.status())
        testState.jobId = null
    })
})

// =====================================
// Test Suite 5: Task Boards
// =====================================

test.describe('Suite 5: Task Boards', () => {
    test('5.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('5.1 — List boards', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/taskboards`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        expect(Array.isArray(await res.json())).toBe(true)
    })

    test('5.2 — Create board', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const board = await createBoard(request)
        expect(board.id).toBeTruthy()
        expect(board.name).toBe('Sprint Board')
    })

    test('5.3 — Get board by ID', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.boardId) await createBoard(request)
        const res = await request.get(`${API_URL}/api/resources/taskboards/${testState.boardId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.id).toBe(testState.boardId)
        expect(body.tasks).toBeDefined()
    })

    test('5.4 — Get non-existent board → 404', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/taskboards/nonexistent`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    test('5.5 — Delete board', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.boardId) await createBoard(request)
        const res = await request.delete(`${API_URL}/api/resources/taskboards/${testState.boardId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(204)
        testState.boardId = null
    })
})

// =====================================
// Test Suite 6: Templates
// =====================================

test.describe('Suite 6: Templates', () => {
    test('6.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('6.1 — List templates', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/templates`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        expect(Array.isArray(await res.json())).toBe(true)
    })

    test('6.2 — Create template', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.post(`${API_URL}/api/resources/templates`, {
            headers: authHeaders(),
            data: { name: 'Cold Email', category: 'email', subject: 'Hi {{name}}', rawMarkdown: "I'd love to connect..." },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body.name).toBe('Cold Email')
        testState.templateId = body.id
    })

    test('6.3 — Get template by ID', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.templateId) {
            // Create one if not yet created
            const res = await request.post(`${API_URL}/api/resources/templates`, {
                headers: authHeaders(),
                data: { name: 'Fallback' },
            })
            const b = await res.json()
            testState.templateId = b.id
        }
        const res = await request.get(`${API_URL}/api/resources/templates/${testState.templateId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.id).toBe(testState.templateId)
    })

    test('6.4 — Delete template', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        if (!testState.templateId) {
            const res = await request.post(`${API_URL}/api/resources/templates`, {
                headers: authHeaders(),
                data: { name: 'ToDelete' },
            })
            const b = await res.json()
            testState.templateId = b.id
        }
        const res = await request.delete(`${API_URL}/api/resources/templates/${testState.templateId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(204)
        testState.templateId = null
    })
})
