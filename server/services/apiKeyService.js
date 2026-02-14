/**
 * Per-User API Key Service
 *
 * Stores API keys per-user in memory (loaded from DB).
 * Creates per-user adapter instances — no process.env mutation,
 * so keys never bleed between users.
 *
 * Usage:
 *   import { getAdaptersForUser, loadUserKeys } from './apiKeyService.js'
 *   const { telephony, llm } = getAdaptersForUser(userId)
 */

import prisma from '../config/prisma.js'
import { createAdapters } from '../adapters/index.js'

// Per-user caches — userId → data
const _keyCache = new Map()       // userId → apiKeys object from DB
const _adapterCache = new Map()   // userId → { telephony, voice, llm, stt }

/**
 * Load a single user's API keys from DB into memory cache.
 * Called at startup for all users and after a user saves new keys.
 */
export async function loadUserKeys(userId) {
    try {
        const settings = await prisma.settings.findUnique({ where: { userId } })
        const apiKeys = settings?.config?.apiKeys
        if (apiKeys) {
            _keyCache.set(userId, apiKeys)
            // Invalidate cached adapters so they get recreated with new keys
            _adapterCache.delete(userId)
            return true
        }
        return false
    } catch (error) {
        console.error(`  Failed to load API keys for user ${userId}:`, error.message)
        return false
    }
}

/**
 * Load API keys for ALL users at server startup.
 * Each user's keys stay isolated in the per-user cache.
 */
export async function loadAllUserKeys() {
    try {
        const allSettings = await prisma.settings.findMany({
            where: { config: { not: null } }
        })

        let count = 0
        for (const settings of allSettings) {
            if (settings.config?.apiKeys) {
                _keyCache.set(settings.userId, settings.config.apiKeys)
                count++
            }
        }

        if (count > 0) {
            console.log(`  API keys loaded for ${count} user(s)`)
        } else {
            console.log('  No saved API keys found in DB')
        }
    } catch (error) {
        console.error('  Failed to load API keys:', error.message)
    }
}

/**
 * Get raw API keys object for a user (from cache).
 * Returns {} if no keys are cached.
 */
export function getUserKeys(userId) {
    return _keyCache.get(userId) || {}
}

/**
 * Get per-user adapter instances.
 * Creates adapters with that user's DB keys passed via config
 * (adapters fall back to process.env/.env for any missing keys).
 * Instances are cached per-user and invalidated on key save.
 */
export function getAdaptersForUser(userId) {
    if (_adapterCache.has(userId)) return _adapterCache.get(userId)

    const keys = _keyCache.get(userId)
    if (!keys) {
        // No DB keys — adapters will use process.env/.env defaults
        return createAdapters()
    }

    const adapters = createAdapters(keys)
    _adapterCache.set(userId, adapters)
    return adapters
}

/**
 * Invalidate cached adapters for a user (e.g. after key update).
 */
export function invalidateUserAdapters(userId) {
    _adapterCache.delete(userId)
}

/**
 * Mask API keys for safe transmission to the client.
 * Replaces all key values with masked versions showing only last 4 chars.
 * e.g. "sk-abc123def456" → "sk-****f456"
 */
export function maskApiKeys(apiKeys) {
    if (!apiKeys || typeof apiKeys !== 'object') return apiKeys
    const masked = {}
    for (const [key, value] of Object.entries(apiKeys)) {
        if (typeof value === 'object' && value !== null) {
            // Recurse into nested objects (e.g., {openai: {apiKey: "sk-xxx"}})
            masked[key] = maskApiKeys(value)
        } else if (typeof value === 'string' && value.length > 4) {
            const prefix = value.includes('-') ? value.slice(0, value.indexOf('-') + 1) : ''
            const lastFour = value.slice(-4)
            masked[key] = `${prefix}****${lastFour}`
        } else if (typeof value === 'string' && value.length > 0) {
            masked[key] = '****'
        } else {
            masked[key] = value
        }
    }
    return masked
}
