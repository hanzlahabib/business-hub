import { useState, useCallback, useEffect } from 'react'
import { API_SERVER } from '../../config/api'

function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    try {
        const stored = localStorage.getItem('auth_user')
        if (stored) { headers['x-user-id'] = JSON.parse(stored).id }
    } catch { }
    return headers
}

export function useCV() {
    const [cvFiles, setCvFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchCvFiles = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_SERVER}/api/cvs`, {
                headers: getAuthHeaders()
            })
            const data = await res.json()
            setCvFiles(data)
            return data
        } catch (err: any) {
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    const getDefaultCv = useCallback(() => {
        return cvFiles.find((cv: any) => cv.isDefault) || cvFiles[0] || null
    }, [cvFiles])

    useEffect(() => {
        fetchCvFiles()
    }, [fetchCvFiles])

    return {
        cvFiles,
        loading,
        error,
        fetchCvFiles,
        getDefaultCv
    }
}

export default useCV
