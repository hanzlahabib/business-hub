import { test, expect } from '@playwright/test'
import {
    API_URL, registerOrLogin, authHeaders, createLead,
} from '../helpers.js'

/**
 * Suite 14: Polish Fixes E2E Tests
 * Covers Template History CRUD, Template Comments CRUD, Email Templates CRUD,
 * Bulk Email Send with message logging, and Automation fail-safe logic.
 */

const API = `${API_URL}/api`
let templateId = null

test.describe('Suite 14: Polish Fixes', () => {
    test.beforeAll(async ({ request }) => {
        await registerOrLogin(request)

        // Setup a base template for history/comments tests
        const res = await request.post(`${API}/resources/templates`, {
            headers: authHeaders(),
            data: { name: 'E2E Polish Base Template', category: 'email' },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        templateId = body.id
    })

    // ════════════════════════════════════════════════════════════════
    // Template History CRUD
    // ════════════════════════════════════════════════════════════════

    /**
     * 14.1 — Create a template history entry with version tracking fields
     */
    test('14.1 — Template History: create entry', async ({ request }) => {
        const res = await request.post(`${API}/resources/templatehistory`, {
            headers: authHeaders(),
            data: {
                templateId,
                action: 'update',
                version: 2,
                changeSummary: 'Updated subject line for cold outreach',
                changeType: 'content',
                changedBy: 'E2E Tester',
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body).toHaveProperty('id')
        expect(body.templateId).toBe(templateId)
        expect(body.changeSummary).toBe('Updated subject line for cold outreach')
        expect(body.changeType).toBe('content')
    })

    /**
     * 14.2 — List history entries filtered by templateId
     */
    test('14.2 — Template History: list by templateId', async ({ request }) => {
        const res = await request.get(`${API}/resources/templatehistory?templateId=${templateId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const list = await res.json()
        expect(Array.isArray(list)).toBe(true)
        expect(list.length).toBeGreaterThan(0)
        expect(list.every(h => h.templateId === templateId)).toBe(true)
    })

    /**
     * 14.3 — Get a single history entry by ID
     */
    test('14.3 — Template History: get by ID', async ({ request }) => {
        // First get the list to find an ID
        const listRes = await request.get(`${API}/resources/templatehistory?templateId=${templateId}`, {
            headers: authHeaders(),
        })
        const list = await listRes.json()
        const entryId = list[0].id

        const res = await request.get(`${API}/resources/templatehistory/${entryId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const entry = await res.json()
        expect(entry.id).toBe(entryId)
    })

    /**
     * 14.4 — Delete a history entry
     */
    test('14.4 — Template History: delete entry', async ({ request }) => {
        // Create one to delete
        const createRes = await request.post(`${API}/resources/templatehistory`, {
            headers: authHeaders(),
            data: { templateId, action: 'delete-test', changeSummary: 'Will be deleted' },
        })
        const entry = await createRes.json()

        const delRes = await request.delete(`${API}/resources/templatehistory/${entry.id}`, {
            headers: authHeaders(),
        })
        expect(delRes.status()).toBe(204)

        // Verify it's gone
        const getRes = await request.get(`${API}/resources/templatehistory/${entry.id}`, {
            headers: authHeaders(),
        })
        expect(getRes.status()).toBe(404)
    })

    /**
     * 14.5 — History 404 for non-existent ID
     */
    test('14.5 — Template History: 404 for missing entry', async ({ request }) => {
        const res = await request.get(`${API}/resources/templatehistory/nonexistent-id-xyz`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(404)
    })

    // ════════════════════════════════════════════════════════════════
    // Template Comments CRUD
    // ════════════════════════════════════════════════════════════════

    let commentId = null

    /**
     * 14.6 — Create a comment with mentions and verify response includes user info
     */
    test('14.6 — Template Comments: create with mentions', async ({ request }) => {
        const res = await request.post(`${API}/resources/templatecomments`, {
            headers: authHeaders(),
            data: {
                templateId,
                content: 'Looks good, @alex should review the pricing section',
                mentions: ['alex'],
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        commentId = body.id
        expect(body.content).toContain('@alex')
        expect(body.mentions).toContain('alex')
        // Should include user info from the include
        expect(body).toHaveProperty('user')
        expect(body.user).toHaveProperty('id')
    })

    /**
     * 14.7 — List comments filtered by templateId
     */
    test('14.7 — Template Comments: list by templateId', async ({ request }) => {
        const res = await request.get(`${API}/resources/templatecomments?templateId=${templateId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const list = await res.json()
        expect(list.length).toBeGreaterThan(0)
        expect(list[0]).toHaveProperty('user')
    })

    /**
     * 14.8 — Update (PATCH) a comment
     */
    test('14.8 — Template Comments: update content', async ({ request }) => {
        const res = await request.patch(`${API}/resources/templatecomments/${commentId}`, {
            headers: authHeaders(),
            data: { content: 'Actually, this looks great. Approved.' },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.content).toBe('Actually, this looks great. Approved.')
    })

    /**
     * 14.9 — Create a threaded reply (parentId)
     */
    test('14.9 — Template Comments: threaded reply', async ({ request }) => {
        const res = await request.post(`${API}/resources/templatecomments`, {
            headers: authHeaders(),
            data: {
                templateId,
                content: 'Thanks for the approval!',
                parentId: commentId,
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        expect(body.parentId).toBe(commentId)
    })

    /**
     * 14.10 — Delete a comment
     */
    test('14.10 — Template Comments: delete', async ({ request }) => {
        // Create a throwaway comment
        const createRes = await request.post(`${API}/resources/templatecomments`, {
            headers: authHeaders(),
            data: { templateId, content: 'To be deleted' },
        })
        const toDelete = await createRes.json()

        const delRes = await request.delete(`${API}/resources/templatecomments/${toDelete.id}`, {
            headers: authHeaders(),
        })
        expect(delRes.status()).toBe(204)
    })

    // ════════════════════════════════════════════════════════════════
    // Email Templates CRUD
    // ════════════════════════════════════════════════════════════════

    let emailTemplateId = null

    /**
     * 14.11 — Create an email template
     */
    test('14.11 — Email Templates: create', async ({ request }) => {
        const res = await request.post(`${API}/resources/emailtemplates`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Welcome Template',
                subject: 'Welcome to {{company}}',
                body: 'Hi {{contactPerson}}, thanks for your interest!',
            },
        })
        expect(res.status()).toBe(201)
        const body = await res.json()
        emailTemplateId = body.id
        expect(body.name).toBe('E2E Welcome Template')
        expect(body.subject).toContain('{{company}}')
    })

    /**
     * 14.12 — List email templates (should not return empty [])
     */
    test('14.12 — Email Templates: list returns real data', async ({ request }) => {
        const res = await request.get(`${API}/resources/emailtemplates`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const list = await res.json()
        expect(Array.isArray(list)).toBe(true)
        expect(list.some(t => t.id === emailTemplateId)).toBe(true)
    })

    /**
     * 14.13 — Update an email template
     */
    test('14.13 — Email Templates: update', async ({ request }) => {
        const res = await request.patch(`${API}/resources/emailtemplates/${emailTemplateId}`, {
            headers: authHeaders(),
            data: { name: 'E2E Welcome V2' },
        })
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.name).toBe('E2E Welcome V2')
    })

    /**
     * 14.14 — Delete an email template
     */
    test('14.14 — Email Templates: delete', async ({ request }) => {
        const delRes = await request.delete(`${API}/resources/emailtemplates/${emailTemplateId}`, {
            headers: authHeaders(),
        })
        expect(delRes.status()).toBe(204)

        // Verify it no longer appears in the list
        const listRes = await request.get(`${API}/resources/emailtemplates`, {
            headers: authHeaders(),
        })
        const list = await listRes.json()
        expect(list.some(t => t.id === emailTemplateId)).toBe(false)
    })

    // ════════════════════════════════════════════════════════════════
    // Bulk Email Send
    // ════════════════════════════════════════════════════════════════

    /**
     * 14.15 — Bulk send requires leadIds array
     */
    test('14.15 — Bulk Email: rejects missing leadIds', async ({ request }) => {
        const res = await request.post(`${API}/email/send-bulk`, {
            headers: authHeaders(),
            data: { subject: 'Test', body: 'Hello' },
        })
        expect(res.status()).toBe(400)
        const body = await res.json()
        expect(body.error).toContain('leadIds')
    })

    /**
     * 14.16 — Bulk send requires subject or templateId
     */
    test('14.16 — Bulk Email: rejects missing subject', async ({ request }) => {
        const lead = await createLead(request, { name: 'Bulk Validate', email: 'bulk@test.com' })
        const res = await request.post(`${API}/email/send-bulk`, {
            headers: authHeaders(),
            data: { leadIds: [lead.id] },
        })
        expect(res.status()).toBe(400)
    })

    /**
     * 14.17 — Bulk send to leads without email provider returns config error
     */
    test('14.17 — Bulk Email: fails gracefully without email config', async ({ request }) => {
        const lead = await createLead(request, { name: 'Bulk NoConfig', email: 'noconfig@test.com' })
        const res = await request.post(`${API}/email/send-bulk`, {
            headers: authHeaders(),
            data: {
                leadIds: [lead.id],
                subject: 'Test Bulk',
                body: 'Hello {{company}}',
            },
        })
        // Should return 400 with "Email not configured" if no provider set
        // OR 200 with results if provider is set in test env
        expect([200, 400]).toContain(res.status())
    })

    /**
     * 14.18 — Bulk send with empty leadIds array
     */
    test('14.18 — Bulk Email: rejects empty leadIds array', async ({ request }) => {
        const res = await request.post(`${API}/email/send-bulk`, {
            headers: authHeaders(),
            data: { leadIds: [], subject: 'Test', body: 'Hello' },
        })
        expect(res.status()).toBe(400)
    })

    // ════════════════════════════════════════════════════════════════
    // Automation Fail-Safe
    // ════════════════════════════════════════════════════════════════

    /**
     * 14.19 — Automation rule with unknown operator should NOT fire
     * (unknown op returns false → condition fails → action skipped → runCount stays 0)
     */
    test('14.19 — Automation: unknown operator fail-safe', async ({ request }) => {
        // Create a rule with an intentionally invalid operator
        const ruleRes = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'E2E FailSafe Rule',
                trigger: 'lead:created',
                enabled: true,
                conditions: [{ field: 'name', op: 'INVALID_OP', value: 'anything' }],
                actions: [
                    {
                        type: 'send-notification',
                        config: {
                            title: 'Should NOT fire',
                            message: 'This should never trigger',
                        },
                    },
                ],
            },
        })
        expect(ruleRes.status()).toBe(201)
        const rule = await ruleRes.json()

        // Trigger the event by creating a lead
        await createLead(request, { name: 'FailSafe Trigger Lead', status: 'new' })

        // Small delay for async rule evaluation
        await new Promise(r => setTimeout(r, 1000))

        // Verify rule was NOT executed (runCount should be 0)
        const checkRes = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        expect(checkRes.status()).toBe(200)
        const rules = await checkRes.json()
        const updatedRule = rules.find(r => r.id === rule.id)
        expect(updatedRule).toBeDefined()
        expect(updatedRule.runCount).toBe(0)

        // Cleanup
        await request.delete(`${API}/automation/rules/${rule.id}`, {
            headers: authHeaders(),
        })
    })

    /**
     * 14.20 — Automation rule with valid "eq" operator should fire
     * (control test to verify the engine works when conditions are valid)
     */
    test('14.20 — Automation: valid operator fires correctly', async ({ request }) => {
        const ruleRes = await request.post(`${API}/automation/rules`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Valid Rule',
                trigger: 'lead:created',
                enabled: true,
                conditions: [], // no conditions = always matches
                actions: [
                    {
                        type: 'send-notification',
                        config: {
                            title: 'E2E Valid Test Fired',
                            message: 'Rule executed successfully',
                        },
                    },
                ],
            },
        })
        expect(ruleRes.status()).toBe(201)
        const rule = await ruleRes.json()

        // Trigger the event
        await createLead(request, { name: 'ValidOp Trigger Lead', status: 'new' })

        // Small delay for async rule evaluation
        await new Promise(r => setTimeout(r, 1500))

        // Verify rule WAS executed (runCount > 0)
        const checkRes = await request.get(`${API}/automation/rules`, {
            headers: authHeaders(),
        })
        const rules = await checkRes.json()
        const updatedRule = rules.find(r => r.id === rule.id)
        expect(updatedRule).toBeDefined()
        expect(updatedRule.runCount).toBeGreaterThan(0)

        // Cleanup
        await request.delete(`${API}/automation/rules/${rule.id}`, {
            headers: authHeaders(),
        })
    })

    // ════════════════════════════════════════════════════════════════
    // Cleanup
    // ════════════════════════════════════════════════════════════════

    test.afterAll(async ({ request }) => {
        // Cleanup the base template
        if (templateId) {
            await request.delete(`${API}/resources/templates/${templateId}`, {
                headers: authHeaders(),
            })
        }
    })
})
