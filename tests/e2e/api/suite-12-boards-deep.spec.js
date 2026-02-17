import { test, expect } from '@playwright/test'
import {
    API_URL, testState, registerOrLogin, authHeaders,
} from '../helpers.js'

/**
 * Suite 12: Task Boards Deep E2E Tests
 * Extended tests covering task CRUD, column drag-and-drop,
 * subtask management, and board column editing.
 */

const API = `${API_URL}/api`
let boardId = null
const taskIds = []

test.describe('Suite 12: Task Boards Deep', () => {
    test.beforeAll(async ({ request }) => {
        await registerOrLogin(request)
    })

    test('12.0 — Create test board with columns', async ({ request }) => {
        const res = await request.post(`${API}/resources/taskboards`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Deep Board',
                columns: [
                    { id: 'col-todo', name: 'To Do', color: '#3B82F6' },
                    { id: 'col-progress', name: 'In Progress', color: '#F59E0B' },
                    { id: 'col-done', name: 'Done', color: '#10B981' },
                ],
            },
        })
        expect([200, 201]).toContain(res.status())
        const board = await res.json()
        boardId = board.id
        expect(boardId).toBeTruthy()
    })

    // ── Task CRUD ──

    test('12.1 — Create task on board', async ({ request }) => {
        const res = await request.post(`${API}/resources/tasks`, {
            headers: authHeaders(),
            data: {
                boardId,
                columnId: 'col-todo',
                title: 'E2E First Task',
                description: 'Created by deep E2E test',
                priority: 'high',
                position: 0,
            },
        })
        expect([200, 201]).toContain(res.status())
        const task = await res.json()
        expect(task.id).toBeTruthy()
        expect(task.title).toBe('E2E First Task')
        expect(task.columnId).toBe('col-todo')
        taskIds.push(task.id)
    })

    test('12.2 — Create second task', async ({ request }) => {
        const res = await request.post(`${API}/resources/tasks`, {
            headers: authHeaders(),
            data: {
                boardId,
                columnId: 'col-todo',
                title: 'E2E Second Task',
                priority: 'medium',
                position: 1,
            },
        })
        expect([200, 201]).toContain(res.status())
        const task = await res.json()
        taskIds.push(task.id)
    })

    test('12.3 — List tasks by board ID', async ({ request }) => {
        const res = await request.get(`${API}/resources/tasks?boardId=${boardId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const tasks = await res.json()
        expect(Array.isArray(tasks)).toBe(true)
        expect(tasks.length).toBeGreaterThanOrEqual(2)
        const titles = tasks.map(t => t.title)
        expect(titles).toContain('E2E First Task')
        expect(titles).toContain('E2E Second Task')
    })

    test('12.4 — Update task title and priority via PATCH', async ({ request }) => {
        const res = await request.patch(`${API}/resources/tasks/${taskIds[0]}`, {
            headers: authHeaders(),
            data: { title: 'E2E Updated Task', priority: 'low' },
        })
        expect(res.status()).toBe(200)
        const task = await res.json()
        expect(task.title).toBe('E2E Updated Task')
        expect(task.priority).toBe('low')
    })

    // ── Column Drag-and-Drop ──

    test('12.5 — Move task to In Progress column', async ({ request }) => {
        const res = await request.patch(`${API}/resources/tasks/${taskIds[0]}`, {
            headers: authHeaders(),
            data: { columnId: 'col-progress' },
        })
        expect(res.status()).toBe(200)
        const task = await res.json()
        expect(task.columnId).toBe('col-progress')
    })

    test('12.6 — Move task to Done column', async ({ request }) => {
        const res = await request.patch(`${API}/resources/tasks/${taskIds[0]}`, {
            headers: authHeaders(),
            data: { columnId: 'col-done' },
        })
        expect(res.status()).toBe(200)
        const task = await res.json()
        expect(task.columnId).toBe('col-done')
    })

    // ── Subtask Management ──

    test('12.7 — Add subtasks to task', async ({ request }) => {
        const subtasks = [
            { id: 'st-1', text: 'Design mockup', done: false },
            { id: 'st-2', text: 'Write tests', done: false },
            { id: 'st-3', text: 'Code review', done: false },
        ]
        const res = await request.patch(`${API}/resources/tasks/${taskIds[1]}`, {
            headers: authHeaders(),
            data: { subtasks },
        })
        expect(res.status()).toBe(200)
        const task = await res.json()
        expect(task.subtasks).toHaveLength(3)
    })

    test('12.8 — Toggle subtask completion', async ({ request }) => {
        const subtasks = [
            { id: 'st-1', text: 'Design mockup', done: true },
            { id: 'st-2', text: 'Write tests', done: false },
            { id: 'st-3', text: 'Code review', done: true },
        ]
        const res = await request.patch(`${API}/resources/tasks/${taskIds[1]}`, {
            headers: authHeaders(),
            data: { subtasks },
        })
        expect(res.status()).toBe(200)
        const task = await res.json()
        const completed = task.subtasks.filter(s => s.done)
        expect(completed).toHaveLength(2)
    })

    // ── Board with Tasks Verification ──

    test('12.9 — Board includes tasks in response', async ({ request }) => {
        const res = await request.get(`${API}/resources/taskboards/${boardId}`, {
            headers: authHeaders(),
        })
        expect(res.status()).toBe(200)
        const board = await res.json()
        expect(board.name).toBe('E2E Deep Board')
        expect(board.tasks).toBeDefined()
        expect(board.tasks.length).toBeGreaterThanOrEqual(2)
    })

    // ── Board Column Editing ──

    test('12.10 — Update board columns', async ({ request }) => {
        const res = await request.put(`${API}/resources/taskboards/${boardId}`, {
            headers: authHeaders(),
            data: {
                name: 'E2E Deep Board',
                columns: [
                    { id: 'col-todo', name: 'Backlog', color: '#6366F1' },
                    { id: 'col-progress', name: 'Active', color: '#F59E0B' },
                    { id: 'col-review', name: 'Review', color: '#8B5CF6' },
                    { id: 'col-done', name: 'Complete', color: '#10B981' },
                ],
            },
        })
        expect(res.status()).toBe(200)
        const board = await res.json()
        expect(board.columns).toHaveLength(4)
    })

    // ── Cleanup ──

    test('12.11 — Cleanup: delete tasks', async ({ request }) => {
        for (const id of taskIds) {
            const res = await request.delete(`${API}/resources/tasks/${id}`, {
                headers: authHeaders(),
            })
            expect([200, 204]).toContain(res.status())
        }
    })

    test('12.12 — Cleanup: delete board', async ({ request }) => {
        if (!boardId) return
        const res = await request.delete(`${API}/resources/taskboards/${boardId}`, {
            headers: authHeaders(),
        })
        expect([200, 204]).toContain(res.status())
    })
})
