/**
 * Shared auth header helper — returns Authorization Bearer header from stored JWT.
 * Use this instead of manually setting x-user-id headers.
 */
export function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token')
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
}

/**
 * Returns auth headers merged with Content-Type: application/json.
 */
export function getJsonAuthHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', ...getAuthHeaders() }
}
