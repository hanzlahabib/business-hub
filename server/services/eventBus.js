import { EventEmitter } from 'events'

/**
 * Central Event Bus — connects all Business Hub modules.
 *
 * Event payload convention:
 *   { userId, entityId, entityType, data, timestamp }
 *
 * Supported events:
 *   call:initiated, call:completed, call:failed, call:status-changed
 *   lead:status-changed
 *   campaign:lead-processed
 *   email:sent
 *   task:completed
 *   notification:created
 */
class BusinessEventBus extends EventEmitter {
    constructor() {
        super()
        this.setMaxListeners(50)
    }

    /**
     * Emit a typed business event with standard payload shape.
     * @param {string} event
     * @param {{ userId: string, entityId: string, entityType: string, data: object }} payload
     */
    publish(event, payload) {
        const enriched = {
            ...payload,
            event,
            timestamp: new Date().toISOString()
        }
        this.emit(event, enriched)

        // Also emit a wildcard so automation service can listen once
        this.emit('*', enriched)
    }
}

const eventBus = new BusinessEventBus()
export default eventBus
