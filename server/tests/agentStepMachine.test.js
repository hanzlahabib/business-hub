import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    AGENT_STEPS,
    FLOW_LAYOUT,
    STEP_COLORS,
    isValidTransition,
    getStepMeta,
    generateFlowGraph
} from '../services/agentStepMachine.js'

// ─── AGENT_STEPS Structure ──────────────────────────────────

describe('AGENT_STEPS', () => {
    const allSteps = Object.keys(AGENT_STEPS)

    it('should have exactly 18 states', () => {
        assert.equal(allSteps.length, 18)
    })

    it('should include all expected state names', () => {
        const expected = [
            'idle', 'lead-selected', 'dialing', 'speaking', 'discovery',
            'objection-handling', 'negotiating', 'booked', 'follow-up', 'rejected',
            'no-answer', 'busy', 'failed', 'ended', 'skipped',
            'notes-generated', 'next-lead', 'completed'
        ]
        for (const step of expected) {
            assert.ok(allSteps.includes(step), `Missing state: ${step}`)
        }
    })

    it('every state should have a label string', () => {
        for (const [name, def] of Object.entries(AGENT_STEPS)) {
            assert.ok(typeof def.label === 'string', `${name} missing label`)
            assert.ok(def.label.length > 0, `${name} has empty label`)
        }
    })

    it('every state should have a "next" array', () => {
        for (const [name, def] of Object.entries(AGENT_STEPS)) {
            assert.ok(Array.isArray(def.next), `${name}.next is not an array`)
        }
    })

    it('all transition targets should reference valid states', () => {
        for (const [name, def] of Object.entries(AGENT_STEPS)) {
            for (const target of def.next) {
                assert.ok(allSteps.includes(target),
                    `${name} → ${target} references non-existent state`)
            }
        }
    })

    it('"completed" should be a terminal state (no transitions)', () => {
        assert.deepEqual(AGENT_STEPS['completed'].next, [])
    })

    it('"idle" should only transition to lead-selected', () => {
        assert.deepEqual(AGENT_STEPS['idle'].next, ['lead-selected'])
    })

    it('"dialing" should branch to speaking/no-answer/busy/failed', () => {
        const expected = ['speaking', 'no-answer', 'busy', 'failed']
        assert.deepEqual(AGENT_STEPS['dialing'].next, expected)
    })
})

// ─── FLOW_LAYOUT ────────────────────────────────────────────

describe('FLOW_LAYOUT', () => {
    it('should have a position for every state', () => {
        for (const step of Object.keys(AGENT_STEPS)) {
            assert.ok(FLOW_LAYOUT[step], `Missing layout for ${step}`)
            assert.ok(typeof FLOW_LAYOUT[step].x === 'number')
            assert.ok(typeof FLOW_LAYOUT[step].y === 'number')
        }
    })
})

// ─── STEP_COLORS ────────────────────────────────────────────

describe('STEP_COLORS', () => {
    it('should have a color for every state', () => {
        for (const step of Object.keys(AGENT_STEPS)) {
            assert.ok(typeof STEP_COLORS[step] === 'string', `Missing color for ${step}`)
            assert.ok(STEP_COLORS[step].startsWith('#'), `${step} color is not a hex string`)
        }
    })
})

// ─── isValidTransition ─────────────────────────────────────

describe('isValidTransition', () => {
    it('should accept valid transition: idle → lead-selected', () => {
        assert.equal(isValidTransition('idle', 'lead-selected'), true)
    })

    it('should accept valid transition: dialing → speaking', () => {
        assert.equal(isValidTransition('dialing', 'speaking'), true)
    })

    it('should accept valid transition: negotiating → booked', () => {
        assert.equal(isValidTransition('negotiating', 'booked'), true)
    })

    it('should reject invalid transition: idle → speaking', () => {
        assert.equal(isValidTransition('idle', 'speaking'), false)
    })

    it('should reject invalid transition: completed → idle', () => {
        assert.equal(isValidTransition('completed', 'idle'), false)
    })

    it('should reject invalid transition: booked → idle', () => {
        assert.equal(isValidTransition('booked', 'idle'), false)
    })

    it('should return false for unknown states', () => {
        assert.equal(isValidTransition('nonexistent', 'idle'), false)
    })
})

// ─── getStepMeta ────────────────────────────────────────────

describe('getStepMeta', () => {
    it('should return metadata for a valid step', () => {
        const meta = getStepMeta('idle')
        assert.ok(meta)
        assert.equal(meta.id, 'idle')
        assert.equal(meta.label, '⏸️ Idle')
        assert.ok(meta.color)
        assert.ok(meta.position)
        assert.deepEqual(meta.allowedNext, ['lead-selected'])
    })

    it('should return null for an unknown step', () => {
        assert.equal(getStepMeta('nonexistent'), null)
    })

    it('should include position coordinates', () => {
        const meta = getStepMeta('dialing')
        assert.equal(typeof meta.position.x, 'number')
        assert.equal(typeof meta.position.y, 'number')
    })
})

// ─── generateFlowGraph ─────────────────────────────────────

describe('generateFlowGraph', () => {
    it('should return nodes and edges arrays', () => {
        const graph = generateFlowGraph()
        assert.ok(Array.isArray(graph.nodes))
        assert.ok(Array.isArray(graph.edges))
    })

    it('should generate 18 nodes (one per state)', () => {
        const graph = generateFlowGraph()
        assert.equal(graph.nodes.length, 18)
    })

    it('should generate correct number of edges from transitions', () => {
        // Count total transitions
        let totalEdges = 0
        for (const def of Object.values(AGENT_STEPS)) {
            totalEdges += def.next.length
        }
        const graph = generateFlowGraph()
        assert.equal(graph.edges.length, totalEdges)
    })

    it('should mark the current step as active', () => {
        const graph = generateFlowGraph('dialing')
        const dialingNode = graph.nodes.find(n => n.id === 'dialing')
        assert.ok(dialingNode.data.isActive)
        assert.ok(dialingNode.data.isCurrent)
    })

    it('should only animate edges from the current step', () => {
        const graph = generateFlowGraph('dialing')
        const animatedEdges = graph.edges.filter(e => e.animated)
        const fromDialing = graph.edges.filter(e => e.source === 'dialing')
        assert.equal(animatedEdges.length, fromDialing.length)
        for (const edge of animatedEdges) {
            assert.equal(edge.source, 'dialing')
        }
    })

    it('should default to idle as current step', () => {
        const graph = generateFlowGraph()
        const idleNode = graph.nodes.find(n => n.id === 'idle')
        assert.ok(idleNode.data.isActive)
    })

    it('non-current nodes should not be marked active', () => {
        const graph = generateFlowGraph('booked')
        const idleNode = graph.nodes.find(n => n.id === 'idle')
        assert.equal(idleNode.data.isActive, false)
    })
})
