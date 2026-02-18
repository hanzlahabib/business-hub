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

/**
 * Fetch wrapper with res.ok check. Throws on non-2xx responses.
 * Use instead of raw fetch() for API calls.
 */
export async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options)
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}: ${res.statusText}`)
    }
    if (res.status === 204) return undefined as unknown as T
    return res.json()
}

/**
 * Fetch wrapper for mutations (POST/PUT/PATCH/DELETE) with auth + JSON headers.
 */
export async function fetchMutation<T = any>(url: string, method: string, body?: any): Promise<T> {
    return fetchJson<T>(url, {
        method,
        headers: getJsonAuthHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
}

/**
 * Fetch wrapper for GET requests with auth headers.
 */
export async function fetchGet<T = any>(url: string): Promise<T> {
    return fetchJson<T>(url, { headers: getAuthHeaders() })
}
