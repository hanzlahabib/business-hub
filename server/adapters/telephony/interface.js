/**
 * TelephonyAdapter Interface
 * 
 * All telephony providers must implement this interface.
 * Swap providers by changing TELEPHONY_PROVIDER in .env
 * 
 * Implementations: vapiAdapter, twilioAdapter, mockAdapter
 */

export class TelephonyAdapter {
    constructor(config = {}) {
        this.config = config
        this.providerName = 'base'
    }

    /**
     * Initiate an outbound call to a lead
     * @param {Object} params - { phoneNumber, leadId, scriptId, assistantConfig }
     * @returns {Object} - { callId, providerCallId, status }
     */
    async initiateCall(params) {
        throw new Error('initiateCall() must be implemented by adapter')
    }

    /**
     * Queue batch calls to multiple leads
     * @param {Object} params - { leads: [{ id, phone }], scriptId, delayMs }
     * @returns {Object} - { batchId, queued: number }
     */
    async batchCall(params) {
        throw new Error('batchCall() must be implemented by adapter')
    }

    /**
     * Get status of a call by provider call ID
     * @param {string} providerCallId
     * @returns {Object} - { status, duration, recordingUrl }
     */
    async getCallStatus(providerCallId) {
        throw new Error('getCallStatus() must be implemented by adapter')
    }

    /**
     * End an active call
     * @param {string} providerCallId
     * @returns {Object} - { success: boolean }
     */
    async endCall(providerCallId) {
        throw new Error('endCall() must be implemented by adapter')
    }

    /**
     * Process incoming webhook from provider
     * @param {Object} payload - Raw webhook payload
     * @returns {Object} - Normalized { callId, status, duration, recordingUrl }
     */
    async handleWebhook(payload) {
        throw new Error('handleWebhook() must be implemented by adapter')
    }

    /**
     * Get available phone numbers
     * @returns {Array} - [{ id, number, capabilities }]
     */
    async getPhoneNumbers() {
        throw new Error('getPhoneNumbers() must be implemented by adapter')
    }
}

export default TelephonyAdapter
