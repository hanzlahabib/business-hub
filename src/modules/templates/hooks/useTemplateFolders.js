import { useState, useCallback, useEffect } from 'react'
import { folderApi } from '../services/templateApi'

export function useTemplateFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await folderApi.getAll()
      setFolders(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createFolder = useCallback(async (folderData) => {
    setLoading(true)
    setError(null)
    try {
      const maxOrder = folders.reduce((max, f) => Math.max(max, f.order || 0), -1)

      const newFolder = {
        ...folderData,
        id: `folder-${crypto.randomUUID()}`,
        parentId: folderData.parentId || null,
        order: folderData.order ?? maxOrder + 1,
        createdBy: 'user-1' // TODO: Replace with actual user ID from auth context
      }

      const data = await folderApi.create(newFolder)
      setFolders(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [folders])

  const updateFolder = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const data = await folderApi.update(id, updates)
      setFolders(prev => prev.map(f => f.id === id ? data : f))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFolder = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await folderApi.delete(id)
      setFolders(prev => prev.filter(f => f.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getRootFolders = useCallback(() => {
    return folders
      .filter(f => !f.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [folders])

  const getChildFolders = useCallback((parentId) => {
    return folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [folders])

  const reorderFolders = useCallback(async (orderedIds) => {
    setLoading(true)
    try {
      const updates = orderedIds.map((id, index) =>
        folderApi.update(id, { order: index })
      )
      await Promise.all(updates)
      await fetchFolders()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchFolders])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getRootFolders,
    getChildFolders,
    reorderFolders
  }
}

export default useTemplateFolders
