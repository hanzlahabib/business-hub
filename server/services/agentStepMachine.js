/**
 * Agent Step Machine
 * 
 * Defines the state transitions for an AI calling agent.
 * Each step emits events consumed by WebSocket → React Flow frontend.
 * 
 * States: idle → lead-selected → dialing → speaking → discovery → 
 *         objection-handling → negotiating → booked / skipped / follow-up → 
 *         notes-generated → next-lead
 */

// Valid agent steps and their allowed transitions
export const AGENT_STEPS = {
    'idle': { label: '⏸️ Idle', next: ['lead-selected'] },
    'lead-selected': { label: '📋 Lead Selected', next: ['dialing'] },
    'dialing': { label: '📞 Dialing', next: ['speaking', 'no-answer', 'busy', 'failed'] },
    'speaking': { label: '🎙️ Opening Script', next: ['discovery', 'objection-handling', 'negotiating', 'ended'] },
    'discovery': { label: '💬 Discovery', next: ['objection-handling', 'negotiating', 'ended'] },
    'objection-handling': { label: '🛡️ Objection Handler', next: ['discovery', 'negotiating', 'ended'] },
    'negotiating': { label: '💰 Rate Negotiation', next: ['booked', 'follow-up', 'rejected', 'ended'] },
    'booked': { label: '✅ Booked!', next: ['notes-generated'] },
    'follow-up': { label: '📅 Follow-up Scheduled', next: ['notes-generated'] },
    'rejected': { label: '❌ Not Interested', next: ['notes-generated'] },
    'no-answer': { label: '⏭️ No Answer', next: ['skipped'] },
    'busy': { label: '📵 Busy', next: ['skipped'] },
    'failed': { label: '⚠️ Call Failed', next: ['skipped'] },
    'ended': { label: '📴 Call Ended', next: ['notes-generated'] },
    'skipped': { label: '⏭️ Skipped', next: ['next-lead', 'completed'] },
    'notes-generated': { label: '📝 Notes Generated', next: ['next-lead', 'completed'] },
    'next-lead': { label: '➡️ Next Lead', next: ['lead-selected'] },
    'completed': { label: '🏁 All Done', next: [] }
}

// React Flow node positions (for initial layout)
export const FLOW_LAYOUT = {
    'idle': { x: 0, y: 250 },
    'lead-selected': { x: 200, y: 250 },
    'dialing': { x: 400, y: 250 },
    'speaking': { x: 600, y: 250 },
    'discovery': { x: 800, y: 150 },
    'objection-handling': { x: 800, y: 350 },
    'negotiating': { x: 1000, y: 250 },
    'booked': { x: 1200, y: 100 },
    'follow-up': { x: 1200, y: 250 },
    'rejected': { x: 1200, y: 400 },
    'no-answer': { x: 600, y: 450 },
    'busy': { x: 600, y: 50 },
    'failed': { x: 600, y: 550 },
    'ended': { x: 1000, y: 450 },
    'skipped': { x: 800, y: 500 },
    'notes-generated': { x: 1400, y: 250 },
    'next-lead': { x: 1600, y: 250 },
    'completed': { x: 1600, y: 450 }
}

// Color scheme per step category
export const STEP_COLORS = {
    'idle': '#94a3b8', // gray
    'lead-selected': '#818cf8', // indigo
    'dialing': '#fbbf24', // yellow
    'speaking': '#60a5fa', // blue
    'discovery': '#60a5fa', // blue
    'objection-handling': '#fb923c', // orange
    'negotiating': '#f97316', // deep orange
    'booked': '#34d399', // green
    'follow-up': '#a78bfa', // purple
    'rejected': '#f87171', // red
    'no-answer': '#94a3b8', // gray
    'busy': '#94a3b8', // gray
    'failed': '#ef4444', // red
    'ended': '#94a3b8', // gray
    'skipped': '#94a3b8', // gray
    'notes-generated': '#2dd4bf', // teal
    'next-lead': '#818cf8', // indigo
    'completed': '#34d399'  // green
}

/**
 * Validate a step transition
 */
export function isValidTransition(fromStep, toStep) {
    const from = AGENT_STEPS[fromStep]
    if (!from) return false
    return from.next.includes(toStep)
}

/**
 * Get step metadata for React Flow nodes
 */
export function getStepMeta(step) {
    const def = AGENT_STEPS[step]
    if (!def) return null
    return {
        id: step,
        label: def.label,
        color: STEP_COLORS[step] || '#94a3b8',
        position: FLOW_LAYOUT[step] || { x: 0, y: 0 },
        allowedNext: def.next
    }
}

/**
 * Generate React Flow nodes + edges for an agent's workflow
 */
export function generateFlowGraph(currentStep = 'idle') {
    const nodes = Object.entries(AGENT_STEPS).map(([id, def]) => ({
        id,
        type: 'agentStep',
        position: FLOW_LAYOUT[id] || { x: 0, y: 0 },
        data: {
            label: def.label,
            color: STEP_COLORS[id],
            isActive: id === currentStep,
            isCurrent: id === currentStep
        }
    }))

    const edges = []
    for (const [fromId, def] of Object.entries(AGENT_STEPS)) {
        for (const toId of def.next) {
            edges.push({
                id: `${fromId}-${toId}`,
                source: fromId,
                target: toId,
                animated: fromId === currentStep,
                style: {
                    stroke: fromId === currentStep ? STEP_COLORS[fromId] : '#475569',
                    strokeWidth: fromId === currentStep ? 3 : 1
                }
            })
        }
    }

    return { nodes, edges }
}

export default { AGENT_STEPS, FLOW_LAYOUT, STEP_COLORS, isValidTransition, getStepMeta, generateFlowGraph }
