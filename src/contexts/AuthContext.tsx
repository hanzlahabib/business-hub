import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { JSON_SERVER } from '../config/api'

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
                    // Verify user still exists in DB
                    const res = await fetch(`${JSON_SERVER}/users/${parsed.id}`)
                    if (res.ok) {
                        const userData = await res.json()
                        const { password: _, ...safeUser } = userData
                        setUser(safeUser)
                    } else {
                        // User no longer exists
                        localStorage.removeItem(AUTH_TOKEN_KEY)
                        localStorage.removeItem(AUTH_USER_KEY)
                        setUser(null)
                    }
                } catch {
                    setUser(null)
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
            // Query JSON Server for user by email
            const res = await fetch(`${JSON_SERVER}/users?email=${encodeURIComponent(email)}`)
            const users = await res.json()

            if (users.length === 0) {
                setError('No account found with this email')
                setLoading(false)
                return false
            }

            const found = users[0]
            // Simple password check (in production, use bcrypt on server)
            if (found.password !== password) {
                setError('Invalid password')
                setLoading(false)
                return false
            }

            const { password: _, ...safeUser } = found
            // Create a simple token (dev-grade)
            const token = btoa(JSON.stringify({ userId: found.id, ts: Date.now() }))

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
            // Check if email already exists
            const checkRes = await fetch(`${JSON_SERVER}/users?email=${encodeURIComponent(email)}`)
            const existing = await checkRes.json()

            if (existing.length > 0) {
                setError('An account with this email already exists')
                setLoading(false)
                return false
            }

            // Create user via JSON Server REST endpoint
            const newUser = {
                name,
                email,
                password, // In production, hash this server-side
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
                role: 'user',
                createdAt: new Date().toISOString()
            }

            const res = await fetch(`${JSON_SERVER}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })

            if (!res.ok) throw new Error('Failed to create account')

            const created = await res.json()
            const { password: _, ...safeUser } = created
            const token = btoa(JSON.stringify({ userId: created.id, ts: Date.now() }))

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
