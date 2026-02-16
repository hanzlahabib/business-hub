/**
 * Redis Client — Singleton connection + caching helpers
 *
 * Uses REDIS_URL env var (default: redis://localhost:6379).
 * Graceful degradation: if Redis is down, cache methods return null/false.
 */

import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redis = null
let isConnected = false

try {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 5) return null // Stop retrying after 5 attempts
            return Math.min(times * 200, 2000)
        },
        lazyConnect: false,
        enableReadyCheck: true
    })

    redis.on('connect', () => {
        isConnected = true
        console.log('🔴 Redis connected')
    })

    redis.on('error', (err) => {
        if (isConnected) {
            console.error('🔴 Redis error:', err.message)
        }
        isConnected = false
    })

    redis.on('close', () => {
        isConnected = false
    })
} catch (err) {
    console.warn('🔴 Redis unavailable:', err.message)
}

// ── Cache Helpers ─────────────────────────────────────

/**
 * Get cached JSON value by key
 * @returns {object|null} Parsed JSON or null if not found/error
 */
export async function cacheGet(key) {
    if (!redis || !isConnected) return null
    try {
        const raw = await redis.get(key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

/**
 * Set cached JSON value with TTL
 * @param {string} key
 * @param {*} data — will be JSON.stringify'd
 * @param {number} ttlSec — TTL in seconds
 * @returns {boolean} success
 */
export async function cacheSet(key, data, ttlSec = 300) {
    if (!redis || !isConnected) return false
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttlSec)
        return true
    } catch {
        return false
    }
}

/**
 * Delete keys matching a pattern (e.g. "intel:*")
 * For single key, pass exact key string.
 */
export async function cacheDelete(keyOrPattern) {
    if (!redis || !isConnected) return false
    try {
        if (keyOrPattern.includes('*')) {
            const keys = await redis.keys(keyOrPattern)
            if (keys.length > 0) await redis.del(...keys)
        } else {
            await redis.del(keyOrPattern)
        }
        return true
    } catch {
        return false
    }
}

/**
 * Redis INCR + EXPIRE for rate limiting
 * Returns current count after increment
 */
export async function rateLimitIncr(key, windowSec) {
    if (!redis || !isConnected) return null
    try {
        const count = await redis.incr(key)
        if (count === 1) {
            await redis.expire(key, windowSec)
        }
        return count
    } catch {
        return null
    }
}

/**
 * Get remaining TTL for a rate limit key
 */
export async function rateLimitTTL(key) {
    if (!redis || !isConnected) return -1
    try {
        return await redis.ttl(key)
    } catch {
        return -1
    }
}

export function isRedisConnected() {
    return isConnected
}

export default redis
