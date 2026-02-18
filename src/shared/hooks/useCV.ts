import { useState, useCallback, useEffect } from 'react'
import { API_SERVER } from '../../config/api'
import { fetchGet } from '../../utils/authHeaders'

export function useCV() {
    const [cvFiles, setCvFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchCvFiles = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchGet(`${API_SERVER}/api/cvs`)
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
