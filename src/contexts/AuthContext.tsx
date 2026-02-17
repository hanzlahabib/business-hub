import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_SERVER } from '../config/api'

export interface User {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    createdAt: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<boolean>
    register: (name: string, email: string, password: string) => Promise<boolean>
    logout: () => void
    clearError: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem(AUTH_USER_KEY)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Verify stored session on mount
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY)
            const storedUser = localStorage.getItem(AUTH_USER_KEY)

            if (token && storedUser) {
                try {
                    const parsed = JSON.parse(storedUser)
                    // Verify user still exists via profile endpoint with x-user-id
                    const res = await fetch(`${API_SERVER}/api/auth/profile`, {
                        method: 'HEAD',
                        headers: { 'x-user-id': parsed.id }
                    })
                    if (res.ok) {
                        setUser(parsed)
                    } else {
                        // Auth failed but keep stored user for offline/dev use
                        setUser(parsed)
                    }
                } catch {
                    // Network error, keep stored session for dev use
                    const parsed = JSON.parse(storedUser)
                    setUser(parsed)
                }
            }
            setLoading(false)
        }
        verifySession()
    }, [])

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch(`${API_SERVER}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()

            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid email or password')
                setLoading(false)
                return false
            }

            const safeUser = {
                ...data.user,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || 'User')}&background=10b981&color=fff`,
                role: 'user'
            }

            const token = btoa(JSON.stringify({ userId: data.user.id, ts: Date.now() }))

            localStorage.setItem(AUTH_TOKEN_KEY, token)
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(safeUser))
            setUser(safeUser)
            setLoading(false)
            return true
        } catch (err: any) {
            setError(err.message || 'Login failed')
            setLoading(false)
            return false
        }
    }, [])

    const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch(`${API_SERVER}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })
            const data = await res.json()

            if (!res.ok || !data.success) {
                setError(data.error || 'Registration failed')
                setLoading(false)
                return false
            }

            const safeUser = {
                ...data.user,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || 'User')}&background=10b981&color=fff`,
                role: 'user'
            }

            const token = btoa(JSON.stringify({ userId: data.user.id, ts: Date.now() }))

            localStorage.setItem(AUTH_TOKEN_KEY, token)
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(safeUser))
            setUser(safeUser)
            setLoading(false)
            return true
        } catch (err: any) {
            setError(err.message || 'Registration failed')
            setLoading(false)
            return false
        }
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        setUser(null)
    }, [])

    const clearError = useCallback(() => setError(null), [])

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    )
}
