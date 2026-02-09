/**
 * Type-safe environment variable access.
 * Uses import.meta.env with fallbacks.
 */

export const env = {
    /** Current environment mode */
    MODE: import.meta.env.MODE as 'development' | 'staging' | 'production',

    /** Whether running in development */
    isDev: import.meta.env.DEV,

    /** Whether running in production */
    isProd: import.meta.env.PROD,

    /** Base URL for the app */
    BASE_URL: import.meta.env.BASE_URL as string,
} as const
