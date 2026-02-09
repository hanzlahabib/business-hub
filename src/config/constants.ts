/**
 * Application-wide constants.
 * Centralized to avoid magic strings scattered across the codebase.
 */

/** Application name */
export const APP_NAME = 'Business Hub'

/** Local storage keys */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebarCollapsed',
} as const

/** Default pagination */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const

/** Content statuses */
export const CONTENT_STATUSES = [
    'idea',
    'script',
    'recording',
    'editing',
    'thumbnail',
    'published',
] as const

/** Content types */
export const CONTENT_TYPES = ['long', 'short'] as const

/** Animation durations (ms) */
export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const

/** Feature flags — toggle experimental features */
export const FEATURES = {
    ENABLE_CONTENT_STUDIO: true,
    ENABLE_SKILL_MASTERY: true,
    ENABLE_PIPELINE: true,
    ENABLE_TEMPLATES: true,
} as const
