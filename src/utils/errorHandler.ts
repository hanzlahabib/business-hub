/**
 * Centralized error handler utility.
 * Provides consistent error formatting and logging.
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

interface ErrorReport {
    message: string
    severity: ErrorSeverity
    context?: string
    originalError?: unknown
    timestamp: string
}

/**
 * Format any error into a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as any).message)
    }
    return 'An unexpected error occurred'
}

/**
 * Log error with consistent formatting
 */
export function logError(
    error: unknown,
    context?: string,
    severity: ErrorSeverity = 'medium'
): ErrorReport {
    const report: ErrorReport = {
        message: getErrorMessage(error),
        severity,
        context,
        originalError: error,
        timestamp: new Date().toISOString()
    }

    const prefix = `[${severity.toUpperCase()}]${context ? ` [${context}]` : ''}`

    switch (severity) {
        case 'critical':
        case 'high':
            console.error(`${prefix}`, report.message, error)
            break
        case 'medium':
            console.warn(`${prefix}`, report.message)
            break
        case 'low':
            console.log(`${prefix}`, report.message)
            break
    }

    return report
}

/**
 * Handle API errors with appropriate responses
 */
export function handleApiError(error: unknown, context?: string): string {
    const message = getErrorMessage(error)

    // Network errors
    if (error instanceof TypeError && message.includes('fetch')) {
        logError(error, context, 'high')
        return 'Unable to connect to the server. Please check your connection.'
    }

    // Timeout
    if (message.includes('timed out') || message.includes('AbortError')) {
        logError(error, context, 'medium')
        return 'Request timed out. Please try again.'
    }

    // HTTP status errors
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        logError(error, context, status >= 500 ? 'high' : 'medium')

        switch (status) {
            case 400: return 'Invalid request. Please check your input.'
            case 401: return 'You need to sign in to continue.'
            case 403: return 'You don\'t have permission to do that.'
            case 404: return 'The requested resource was not found.'
            case 409: return 'A conflict occurred. The data may have been modified.'
            case 429: return 'Too many requests. Please wait a moment.'
            case 500: return 'Server error. Please try again later.'
            default: return message
        }
    }

    logError(error, context, 'medium')
    return message
}

export default { getErrorMessage, logError, handleApiError }
