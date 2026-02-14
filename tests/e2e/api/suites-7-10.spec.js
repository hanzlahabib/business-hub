import { test, expect } from '@playwright/test'
import { API_URL, testState, registerOrLogin, authHeaders } from '../helpers.js'

// =====================================
// Test Suite 7: Outreach & Automation
// =====================================

test.describe('Suite 7: Outreach', () => {
    test('7.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('7.1 — Get uncontacted leads', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/outreach/uncontacted`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(typeof body.count).toBe('number')
    })

    test('7.2 — Get outreach history', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/outreach/history`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.stats).toBeDefined()
    })
})

// =====================================
// Test Suite 8: CV File Management
// =====================================

test.describe('Suite 8: CV Files', () => {
    test('8.1 — List CVs (empty state)', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/cvfiles`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
    })
})

// =====================================
// Test Suite 9: Email Settings
// =====================================

test.describe('Suite 9: Email Settings', () => {
    test('9.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('9.1 — Get email settings', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/emailsettings`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
    })

    test('9.2 — Get email templates', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/emailtemplates`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
    })
})

// =====================================
// Test Suite 10: Skill Mastery
// =====================================

test.describe('Suite 10: Skill Mastery', () => {
    test('10.1 — Get skill mastery data', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/skillmastery`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body).toBeDefined()
    })
})

// =====================================
// Test Suite: Settings & API Key Masking
// =====================================

test.describe('Suite Extra: Settings', () => {
    test('settings.0 — Setup: login', async ({ request }) => {
        await registerOrLogin(request)
    })

    test('settings.1 — GET returns config', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.get(`${API_URL}/api/resources/settings`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
    })

    test('settings.2 — PATCH updates config', async ({ request }) => {
        if (!testState.userId) await registerOrLogin(request)
        const res = await request.patch(`${API_URL}/api/resources/settings`, {
            headers: authHeaders(),
            data: { theme: 'dark' },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.theme).toBe('dark')
    })
})
