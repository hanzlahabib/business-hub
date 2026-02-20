/**
 * E2E Test Helpers
 * Shared utilities for API and UI tests.
 */

const API_URL = process.env.API_URL || 'http://localhost:3002'
const TEST_EMAIL = 'e2e-playwright@test.com'
const TEST_PASSWORD = 'test123'
const TEST_NAME = 'E2E Playwright'

/** State shared across test files via this module */
export const testState = {
    userId: null,
    token: null,
    leadId: null,
    jobId: null,
    boardId: null,
    templateId: null,
}

/**
 * Register test user (idempotent — if already exists, just logs in)
 */
export async function registerOrLogin(request) {
    // Try register first
    const regRes = await request.post(`${API_URL}/api/auth/register`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
    })

    if (regRes.ok()) {
        const body = await regRes.json()
        testState.userId = body.user.id
        testState.token = body.token
        return body.user
    }

    // Already exists — login instead
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    const body = await loginRes.json()
    testState.userId = body.user.id
    testState.token = body.token
    return body.user
}

/**
 * Login and return userId
 */
export async function login(request) {
    const res = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    const body = await res.json()
    testState.userId = body.user.id
    testState.token = body.token
    return body.user
}

/**
 * Build common headers with JWT Bearer token
 */
export function authHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    if (testState.token) {
        headers['Authorization'] = `Bearer ${testState.token}`
    }
    return headers
}

/**
 * Create a lead and return it
 */
export async function createLead(request, data = {}) {
    const res = await request.post(`${API_URL}/api/leads`, {
        headers: authHeaders(),
        data: {
            name: 'Test Corp',
            email: 'info@testcorp.com',
            status: 'new',
            company: 'Test Corp Inc',
            ...data,
        },
    })
    const body = await res.json()
    testState.leadId = body.id
    return body
}

/**
 * Create a job and return it
 */
export async function createJob(request, data = {}) {
    const res = await request.post(`${API_URL}/api/jobs`, {
        headers: authHeaders(),
        data: {
            title: 'Senior Dev',
            company: 'Acme',
            status: 'saved',
            ...data,
        },
    })
    const body = await res.json()
    testState.jobId = body.id
    return body
}

/**
 * Create a task board and return it
 */
export async function createBoard(request, data = {}) {
    const res = await request.post(`${API_URL}/api/resources/taskboards`, {
        headers: authHeaders(),
        data: { name: 'Sprint Board', ...data },
    })
    const body = await res.json()
    testState.boardId = body.id
    return body
}

/**
 * Delete a resource by URL
 */
export async function deleteResource(request, url) {
    return request.delete(url, { headers: authHeaders() })
}

export { API_URL, TEST_EMAIL, TEST_PASSWORD, TEST_NAME }
