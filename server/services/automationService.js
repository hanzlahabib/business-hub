import prisma from '../config/prisma.js'
import eventBus from './eventBus.js'
import logger from '../config/logger.js'

// ── Action Executors ──────────────────────────────────

async function executeCreateTask(userId, event, config) {
    const title = config.title
        ?.replace('{leadName}', event.data?.leadName || 'Unknown')
        ?.replace('{outcome}', event.data?.outcome || '')
        ?.replace('{status}', event.data?.status || '')
        || `Follow up on ${event.entityType}`

    const description = config.description
        ?.replace('{leadName}', event.data?.leadName || 'Unknown')
        ?.replace('{outcome}', event.data?.outcome || '')
        || ''

    // Find user's first board or create one with a default column
    let board = await prisma.taskBoard.findFirst({ where: { userId } })
    if (!board) {
        const defaultCol = { id: `col-${Date.now()}`, name: 'To Do', color: '#3b82f6' }
        board = await prisma.taskBoard.create({
            data: { name: 'Automation Tasks', userId, columns: [defaultCol] }
        })
    }

    // Ensure board has at least one column
    let columns = Array.isArray(board.columns) ? board.columns : []
    if (columns.length === 0) {
        const defaultCol = { id: `col-${Date.now()}`, name: 'To Do', color: '#3b82f6' }
        columns = [defaultCol]
        await prisma.taskBoard.update({
            where: { id: board.id },
            data: { columns }
        })
    }
    const firstColId = columns[0].id

    await prisma.task.create({
        data: {
            title,
            description,
            status: 'todo',
            priority: config.priority || 'medium',
            boardId: board.id,
            columnId: firstColId,
            userId
        }
    })
}

async function executeSendNotification(userId, event, config) {
    const title = config.title
        ?.replace('{leadName}', event.data?.leadName || 'Unknown')
        ?.replace('{outcome}', event.data?.outcome || '')
        ?.replace('{status}', event.data?.status || '')
        || `${event.event} occurred`

    const message = config.message
        ?.replace('{leadName}', event.data?.leadName || 'Unknown')
        ?.replace('{outcome}', event.data?.outcome || '')
        ?.replace('{status}', event.data?.status || '')
        || ''

    const notification = await prisma.notification.create({
        data: {
            type: config.type || event.entityType || 'system',
            title,
            message,
            actionUrl: config.actionUrl || null,
            metadata: { eventName: event.event, entityId: event.entityId, ...event.data },
            userId
        }
    })

    // Broadcast via WebSocket (lazy import to avoid circular deps)
    try {
        const { emitNotification } = await import('./callWebSocket.js')
        emitNotification(userId, notification)
    } catch (e) { logger.warn('[AutomationService] WS notification push failed:', { error: e.message }) }
}

async function executeUpdateLeadStatus(userId, event, config) {
    if (event.entityType !== 'lead' && !event.data?.leadId) return
    const leadId = event.data?.leadId || event.entityId

    await prisma.lead.updateMany({
        where: { id: leadId, userId },
        data: { status: config.newStatus }
    })
}

async function executeInitiateCall(userId, event, config) {
    const lead = event.data?.lead
    if (!lead?.id || !lead?.phone) {
        logger.info('[AutomationService] Skipping initiate-call: lead missing id or phone')
        return
    }

    // If lead has a type, use type-specific config
    const leadType = event.data?.leadType
    const typeConfig = leadType?.agentConfig || {}

    // Skip if auto-call disabled on this type
    if (leadType && leadType.autoCallEnabled === false) {
        logger.info(`[AutomationService] Auto-call disabled for type "${leadType.name}", skipping`)
        return
    }

    // Type delay > rule config > default 30s
    const delayMs = leadType?.autoCallDelay ?? config.delayMs ?? 30000

    logger.info(`[AutomationService] Scheduling auto-call to ${lead.name} in ${delayMs / 1000}s${leadType ? ` (type: ${leadType.name})` : ''}`)

    const scheduledAt = new Date(Date.now() + delayMs)

    // Persist the scheduled action so it survives server restarts
    try {
        const action = await prisma.scheduledAction.create({
            data: {
                type: 'initiate-call',
                payload: {
                    leadId: lead.id,
                    leadName: lead.name,
                    assistantConfig: {
                        agentName: typeConfig.agentName || config.agentName || 'Alex',
                        businessName: typeConfig.businessName || config.businessName || undefined,
                        businessWebsite: typeConfig.businessWebsite || undefined,
                        industry: typeConfig.industry || undefined,
                    }
                },
                scheduledAt,
                userId
            }
        })

        // Also set an in-memory timer for immediate execution
        setTimeout(() => executeScheduledAction(action.id), delayMs)
    } catch (err) {
        logger.error(`[AutomationService] Failed to schedule auto-call for ${lead.name}:`, { error: err.message })
    }
}

async function executeScheduledAction(actionId) {
    try {
        const action = await prisma.scheduledAction.findUnique({ where: { id: actionId } })
        if (!action || action.executed) return

        if (action.type === 'initiate-call') {
            const { callService } = await import('./callService.js')
            const payload = action.payload
            await callService.initiateCall(action.userId, {
                leadId: payload.leadId,
                assistantConfig: payload.assistantConfig
            })
            logger.info(`[AutomationService] Auto-call initiated for lead ${payload.leadName}`)
        }

        await prisma.scheduledAction.update({
            where: { id: actionId },
            data: { executed: true, executedAt: new Date() }
        })
    } catch (err) {
        logger.error(`[AutomationService] Scheduled action ${actionId} failed:`, { error: err.message })
        await prisma.scheduledAction.update({
            where: { id: actionId },
            data: { executed: true, executedAt: new Date(), error: err.message }
        }).catch(() => {})
    }
}

// Recover pending scheduled actions on server startup
async function recoverScheduledActions() {
    try {
        const pending = await prisma.scheduledAction.findMany({
            where: { executed: false }
        })

        if (pending.length === 0) return
        logger.info(`[AutomationService] Recovering ${pending.length} pending scheduled action(s)`)

        const now = Date.now()
        for (const action of pending) {
            const delay = Math.max(action.scheduledAt.getTime() - now, 1000) // at least 1s delay
            setTimeout(() => executeScheduledAction(action.id), delay)
        }
    } catch (err) {
        logger.error('[AutomationService] Failed to recover scheduled actions:', { error: err.message })
    }
}

// ── Condition Evaluator ───────────────────────────────

function evaluateConditions(conditions, eventData) {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true

    return conditions.every(cond => {
        const value = eventData[cond.field]
        switch (cond.op) {
            case 'eq': return value === cond.value
            case 'neq': return value !== cond.value
            case 'in': return Array.isArray(cond.value) && cond.value.includes(value)
            case 'contains': return typeof value === 'string' && value.includes(cond.value)
            case 'exists': return value !== undefined && value !== null
            default:
                logger.warn(`[AutomationService] Unknown operator "${cond.op}", failing safe`)
                return false
        }
    })
}

// ── Core Engine ───────────────────────────────────────

const actionExecutors = {
    'create-task': executeCreateTask,
    'send-notification': executeSendNotification,
    'update-lead-status': executeUpdateLeadStatus,
    'initiate-call': executeInitiateCall,
}

async function evaluateRules(event) {
    try {
        const rules = await prisma.automationRule.findMany({
            where: {
                userId: event.userId,
                trigger: event.event,
                enabled: true
            }
        })

        for (const rule of rules) {
            const conditions = Array.isArray(rule.conditions) ? rule.conditions : []
            if (!evaluateConditions(conditions, event.data || {})) continue

            const actions = Array.isArray(rule.actions) ? rule.actions : []
            for (const action of actions) {
                const executor = actionExecutors[action.type]
                if (!executor) continue

                try {
                    await executor(event.userId, event, action.config || {})
                } catch (err) {
                    logger.error(`[AutomationService] Action ${action.type} failed for rule ${rule.name}:`, { error: err.message })
                }
            }

            // Update run count
            await prisma.automationRule.update({
                where: { id: rule.id },
                data: { runCount: { increment: 1 }, lastRunAt: new Date() }
            }).catch(() => { })
        }
    } catch (err) {
        logger.error('[AutomationService] Rule evaluation failed:', { error: err.message })
    }
}

// ── Default Rules Seeder ──────────────────────────────

const DEFAULT_RULES = [
    {
        name: 'Call Failed → Notify',
        description: 'Get notified when a call fails',
        trigger: 'call:failed',
        conditions: [],
        actions: [
            {
                type: 'send-notification',
                config: {
                    type: 'call',
                    title: '📞 Call Failed: {leadName}',
                    message: 'The call to {leadName} could not be completed.',
                    actionUrl: '/calling'
                }
            }
        ]
    },
    {
        name: 'Call Booked → Create Follow-up Task',
        description: 'Auto-create a task when a call results in a booking',
        trigger: 'call:completed',
        conditions: [{ field: 'outcome', op: 'eq', value: 'booked' }],
        actions: [
            {
                type: 'create-task',
                config: {
                    title: 'Follow up with {leadName} — booked',
                    description: 'Call was booked. Prepare for the meeting.',
                    priority: 'high'
                }
            },
            {
                type: 'send-notification',
                config: {
                    type: 'call',
                    title: '🎉 Meeting Booked: {leadName}',
                    message: '{leadName} has been booked! Follow-up task created.',
                    actionUrl: '/calling'
                }
            }
        ]
    },
    {
        name: 'Lead Won → Notify',
        description: 'Get notified when a lead is marked as won',
        trigger: 'lead:status-changed',
        conditions: [{ field: 'status', op: 'eq', value: 'won' }],
        actions: [
            {
                type: 'send-notification',
                config: {
                    type: 'lead',
                    title: '🏆 Lead Won: {leadName}',
                    message: '{leadName} has been marked as won!',
                    actionUrl: '/leads'
                }
            }
        ]
    },
    {
        name: 'New Lead → Auto-Call (30s delay)',
        description: 'Automatically initiate an AI call to new leads within 30 seconds',
        trigger: 'lead:created',
        conditions: [],
        actions: [
            {
                type: 'send-notification',
                config: {
                    type: 'lead',
                    title: 'New Lead: {leadName}',
                    message: 'New lead from {leadName}. Auto-call scheduled in 30s.',
                    actionUrl: '/leads'
                }
            },
            {
                type: 'initiate-call',
                config: {
                    delayMs: 30000,
                    agentName: 'Alex'
                }
            }
        ]
    },
    {
        name: 'Campaign Lead Processed → Update Stats',
        description: 'Notify when a campaign finishes processing a lead',
        trigger: 'campaign:lead-processed',
        conditions: [{ field: 'outcome', op: 'eq', value: 'booked' }],
        actions: [
            {
                type: 'send-notification',
                config: {
                    type: 'campaign',
                    title: '🤖 Campaign Booking: {leadName}',
                    message: 'AI agent booked {leadName} during campaign.',
                    actionUrl: '/calling'
                }
            }
        ]
    }
]

async function registerDefaultRules(userId) {
    const existing = await prisma.automationRule.count({
        where: { userId, isSystem: true }
    })
    if (existing > 0) return // Already seeded

    for (const rule of DEFAULT_RULES) {
        await prisma.automationRule.create({
            data: { ...rule, isSystem: true, userId }
        })
    }
}

// ── Initialization ────────────────────────────────────

function init() {
    eventBus.on('*', (event) => {
        evaluateRules(event).catch(err =>
            logger.error('[AutomationService] Unhandled error:', { error: err.message })
        )
    })

    // Recover any pending scheduled actions from before restart
    recoverScheduledActions()

    logger.info('[AutomationService] Listening for events')
}

export default { init, registerDefaultRules, evaluateRules }
