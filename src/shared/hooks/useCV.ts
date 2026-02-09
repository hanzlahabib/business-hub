import { useState, useCallback, useEffect } from 'react'
import { API_SERVER } from '../../config/api'

export function useCV() {
    const [cvFiles, setCvFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchCvFiles = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_SERVER}/api/cvs`)
            const data = await res.json()
            setCvFiles(data)
            return data
        } catch (err) {
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    const getDefaultCv = useCallback(() => {
        return cvFiles.find(cv => cv.isDefault) || cvFiles[0] || null
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
