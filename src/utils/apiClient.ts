/**
 * Centralized API client with retry logic and error handling.
 * Use this for all fetch calls instead of raw fetch().
 */

import { API_SERVER } from '../config/api'

interface ApiClientOptions extends RequestInit {
    /** Number of retries on failure (default: 2) */
    retries?: number
    /** Timeout in ms (default: 10000) */
    timeout?: number
}

interface ApiError {
    status: number
    message: string
    url: string
}

class ApiClientError extends Error {
    status: number
    url: string

    constructor({ status, message, url }: ApiError) {
        super(message)
        this.name = 'ApiClientError'
        this.status = status
        this.url = url
    }
}

async function request<T = any>(url: string, options: ApiClientOptions = {}): Promise<T> {
    const { retries = 2, timeout = 10000, ...fetchOptions } = options

    // Set default headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>)
    }

    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '')
                throw new ApiClientError({
                    status: response.status,
                    message: errorBody || `HTTP ${response.status}: ${response.statusText}`,
                    url
                })
            }

            // Handle empty responses (204 No Content, DELETE responses)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return undefined as unknown as T
            }

            return await response.json()
        } catch (error: any) {
            clearTimeout(timeoutId)
            lastError = error

            // Don't retry on client errors (4xx) or abort
            if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
                throw error
            }
            if (error.name === 'AbortError') {
                throw new ApiClientError({ status: 408, message: 'Request timed out', url })
            }

            // Wait before retry (exponential backoff)
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500))
            }
        }
    }

    throw lastError || new Error('Request failed')
}

export const apiClient = {
    get: <T = any>(url: string, options?: ApiClientOptions) =>
        request<T>(url, { ...options, method: 'GET' }),

    post: <T = any>(url: string, body: any, options?: ApiClientOptions) =>
        request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),

    put: <T = any>(url: string, body: any, options?: ApiClientOptions) =>
        request<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),

    patch: <T = any>(url: string, body: any, options?: ApiClientOptions) =>
        request<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

    delete: <T = any>(url: string, options?: ApiClientOptions) =>
        request<T>(url, { ...options, method: 'DELETE' })
}

// Convenience: pre-bound to API Server
export const serverClient = {
    get: <T = any>(path: string, options?: ApiClientOptions) =>
        apiClient.get<T>(`${API_SERVER}${path}`, options),

    post: <T = any>(path: string, body: any, options?: ApiClientOptions) =>
        apiClient.post<T>(`${API_SERVER}${path}`, body, options),

    put: <T = any>(path: string, body: any, options?: ApiClientOptions) =>
        apiClient.put<T>(`${API_SERVER}${path}`, body, options),

    patch: <T = any>(path: string, body: any, options?: ApiClientOptions) =>
        apiClient.patch<T>(`${API_SERVER}${path}`, body, options),

    delete: <T = any>(path: string, options?: ApiClientOptions) =>
        apiClient.delete<T>(`${API_SERVER}${path}`, options)
}

export { ApiClientError }
export default apiClient
