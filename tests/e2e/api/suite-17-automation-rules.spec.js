import { test, expect } from '@playwright/test'
import {
    API_URL, registerOrLogin, authHeaders,
} from '../helpers.js'

/**
 * Suite 17: Automation Rules E2E Tests
 * Covers: CRUD operations, default rule seeding, enable/disable toggle,
 *         validation, per-user isolation, and auth guards.
 */

const API = `${API_URL}/api`
let ruleId = null

test.describe('Suite 17: Automation Rules', () => {
    test.beforeAll(async ({ request }) => {
        await registerOrLogin(request)
    })

    // ════════════════════════════════════════════════════════════════
    // GET /api/automation/rules — list + default seeding
    // ════════════════════════════════════════════════════════════════

    test('17.1 — List rules seeds defaults on first access', async ({ request }) => {
        const res = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(Array.isArray(body)).toBeTruthy()
        // Default rules should have been seeded
        expect(body.length).toBeGreaterThanOrEqual(1)

        // Verify default rules have expected structure
        const firstRule = body[0]
        expect(firstRule).toHaveProperty('id')
        expect(firstRule).toHaveProperty('name')
        expect(firstRule).toHaveProperty('trigger')
        expect(firstRule).toHaveProperty('actions')
        expect(firstRule).toHaveProperty('enabled')
        expect(firstRule).toHaveProperty('isSystem')
    })

    test('17.2 — Default rules are system rules', async ({ request }) => {
        const res = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        const rules = await res.json()
        const systemRules = rules.filter(r => r.isSystem === true)
        expect(systemRules.length).toBeGreaterThanOrEqual(3)

        // Check known default rules exist
        const ruleNames = systemRules.map(r => r.name)
        expect(ruleNames).toContain('Call Failed → Notify')
        expect(ruleNames).toContain('Lead Won → Notify')
    })

    test('17.3 — Second list call does not duplicate defaults', async ({ request }) => {
        const res1 = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        const rules1 = await res1.json()

        const res2 = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        const rules2 = await res2.json()

        const systemCount1 = rules1.filter(r => r.isSystem).length
        const systemCount2 = rules2.filter(r => r.isSystem).length
        expect(systemCount1).toBe(systemCount2)
    })

    // ════════════════════════════════════════════════════════════════
    // POST /api/automation/rules — create custom rule
    // ════════════════════════════════════════════════════════════════

    test('17.4 — Create custom automation rule', async ({ request }) => {
        const res = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Test Rule',
                description: 'Auto-created by E2E test',
                trigger: 'lead:created',
                conditions: [{ field: 'status', op: 'eq', value: 'new' }],
                actions: [
                    {
                        type: 'send-notification',
                        config: {
                            title: 'New lead: {leadName}',
                            message: 'A new lead was created',
                        },
                    },
                ],
                enabled: true,
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body).toHaveProperty('id')
        expect(body.name).toBe('E2E Test Rule')
        expect(body.trigger).toBe('lead:created')
        expect(body.enabled).toBe(true)
        expect(Array.isArray(body.conditions)).toBeTruthy()
        expect(body.conditions.length).toBe(1)
        expect(Array.isArray(body.actions)).toBeTruthy()
        expect(body.actions.length).toBe(1)
        ruleId = body.id
    })

    test('17.5 — Create rule with multiple actions', async ({ request }) => {
        const res = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Multi-Action Rule',
                trigger: 'call:completed',
                conditions: [{ field: 'outcome', op: 'eq', value: 'booked' }],
                actions: [
                    {
                        type: 'create-task',
                        config: { title: 'Follow up with {leadName}', priority: 'high' },
                    },
                    {
                        type: 'send-notification',
                        config: { title: 'Call booked: {leadName}', message: 'Follow-up task created' },
                    },
                ],
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body.actions.length).toBe(2)

        // Cleanup
        await request.delete(`${API}/automation/rules/${body.id}`, {
            headers: authHeaders(),
        })
    })

    // ════════════════════════════════════════════════════════════════
    // Validation
    // ════════════════════════════════════════════════════════════════

    test('17.6 — Create rule without name → 400', async ({ request }) => {
        const res = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                trigger: 'lead:created',
                actions: [{ type: 'send-notification', config: {} }],
            },
        })
        expect(res.status()).toBe(400)
    })

    test('17.7 — Create rule without trigger → 400', async ({ request }) => {
        const res = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'Missing Trigger Rule',
                actions: [{ type: 'send-notification', config: {} }],
            },
        })
        expect(res.status()).toBe(400)
    })

    test('17.8 — Create rule without actions → 400', async ({ request }) => {
        const res = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'Missing Actions Rule',
                trigger: 'lead:created',
            },
        })
        expect(res.status()).toBe(400)
    })

    // ════════════════════════════════════════════════════════════════
    // PUT /api/automation/rules/:id — update
    // ════════════════════════════════════════════════════════════════

    test('17.9 — Update rule name and description', async ({ request }) => {
        const res = await request.put(`${API}/automation/rules/${ruleId}`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Updated Rule',
                description: 'Updated by E2E test',
            },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.name).toBe('E2E Updated Rule')
        expect(body.description).toBe('Updated by E2E test')
    })

    test('17.10 — Disable rule', async ({ request }) => {
        const res = await request.put(`${API}/automation/rules/${ruleId}`, {
            headers: authHeaders(),
            data: { enabled: false },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.enabled).toBe(false)
    })

    test('17.11 — Re-enable rule', async ({ request }) => {
        const res = await request.put(`${API}/automation/rules/${ruleId}`, {
            headers: authHeaders(),
            data: { enabled: true },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.enabled).toBe(true)
    })

    test('17.12 — Update rule conditions and actions', async ({ request }) => {
        const res = await request.put(`${API}/automation/rules/${ruleId}`, {
            headers: authHeaders(),
            data: {
                conditions: [
                    { field: 'status', op: 'eq', value: 'contacted' },
                    { field: 'leadName', op: 'contains', value: 'Corp' },
                ],
                actions: [
                    { type: 'update-lead-status', config: { newStatus: 'qualified' } },
                ],
            },
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.conditions.length).toBe(2)
        expect(body.actions.length).toBe(1)
        expect(body.actions[0].type).toBe('update-lead-status')
    })

    test('17.13 — Update non-existent rule → 404', async ({ request }) => {
        const res = await request.put(`${API}/automation/rules/non-existent-id-xyz`, {
            headers: authHeaders(),
            data: { name: 'Ghost Rule' },
        })
        expect(res.status()).toBe(404)
    })

    // ════════════════════════════════════════════════════════════════
    // DELETE /api/automation/rules/:id
    // ════════════════════════════════════════════════════════════════

    test('17.14 — Delete custom rule', async ({ request }) => {
        const res = await request.delete(`${API}/automation/rules/${ruleId}`, {
            headers: authHeaders(),
        })
        expect(res.ok()).toBeTruthy()
        const body = await res.json()
        expect(body.success).toBe(true)
    })

    test('17.15 — Deleted rule no longer in list', async ({ request }) => {
        const res = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        const rules = await res.json()
        const found = rules.find(r => r.id === ruleId)
        expect(found).toBeUndefined()
    })

    test('17.16 — Delete non-existent rule → 404', async ({ request }) => {
        const res = await request.delete(`${API}/automation/rules/non-existent-id-xyz`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    // ════════════════════════════════════════════════════════════════
    // Auth guard
    // ════════════════════════════════════════════════════════════════

    test('17.17 — Unauthenticated requests are rejected', async ({ request }) => {
        const endpoints = [
            request.get(`${API}/automation/rules`),
            request.post(`${API}/automation/rules`, {
                data: { name: 'X', trigger: 'y', actions: [] },
            }),
            request.put(`${API}/automation/rules/some-id`, {
                data: { name: 'Y' },
            }),
            request.delete(`${API}/automation/rules/some-id`),
        ]
        const responses = await Promise.all(endpoints)
        for (const res of responses) {
            expect(res.status()).toBe(401)
        }
    })
})
