import { useState, useCallback, useEffect, useMemo } from 'react'
import { templateApi } from '../services/templateApi'

const TEMPLATE_CATEGORIES = ['linkedin', 'email', 'proposal', 'document', 'custom']
const TEMPLATE_STATUSES = ['draft', 'published', 'archived']

export function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await templateApi.getAll()
      setTemplates(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (templateData) => {
    setLoading(true)
    setError(null)
    try {
      const newTemplate = {
        ...templateData,
        id: crypto.randomUUID(),
        status: templateData.status || 'draft',
        content: templateData.content || {
          type: 'doc',
          blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }]
        },
        rawMarkdown: templateData.rawMarkdown || '',
        tags: templateData.tags || [],
        variables: templateData.variables || [],
        isFavorite: false,
        isPinned: false,
        usageCount: 0,
        lastUsedAt: null,
        createdBy: 'user-1', // TODO: Replace with actual user ID from auth context
        updatedBy: 'user-1',
        permissions: {
          visibility: 'private',
          canEdit: [],
          canView: []
        },
        version: 1,
        isLocked: false,
        lockedBy: null
      }

      const data = await templateApi.create(newTemplate)
      setTemplates(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const data = await templateApi.update(id, {
        ...updates,
        updatedBy: 'user-1' // TODO: Replace with actual user ID
      })
      setTemplates(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await templateApi.delete(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const duplicateTemplate = useCallback(async (id) => {
    const original = templates.find(t => t.id === id)
    if (!original) return null

    const duplicated = {
      ...original,
      name: `${original.name} (Copy)`,
      isFavorite: false,
      isPinned: false,
      usageCount: 0,
      lastUsedAt: null
    }
    delete duplicated.id

    return createTemplate(duplicated)
  }, [templates, createTemplate])

  const toggleFavorite = useCallback(async (id) => {
    const template = templates.find(t => t.id === id)
    if (!template) return null
    return updateTemplate(id, { isFavorite: !template.isFavorite })
  }, [templates, updateTemplate])

  const togglePinned = useCallback(async (id) => {
    const template = templates.find(t => t.id === id)
    if (!template) return null
    return updateTemplate(id, { isPinned: !template.isPinned })
  }, [templates, updateTemplate])

  const incrementUsage = useCallback(async (id) => {
    const template = templates.find(t => t.id === id)
    if (!template) return null
    return updateTemplate(id, {
      usageCount: (template.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString()
    })
  }, [templates, updateTemplate])

  const changeStatus = useCallback(async (id, newStatus) => {
    return updateTemplate(id, { status: newStatus })
  }, [updateTemplate])

  const moveToFolder = useCallback(async (id, folderId) => {
    return updateTemplate(id, { folderId })
  }, [updateTemplate])

  const getTemplatesByCategory = useCallback((category) => {
    return templates.filter(t => t.category === category)
  }, [templates])

  const getTemplatesByStatus = useCallback((status) => {
    return templates.filter(t => t.status === status)
  }, [templates])

  const getTemplatesByFolder = useCallback((folderId) => {
    return templates.filter(t => t.folderId === folderId)
  }, [templates])

  const getFavorites = useCallback(() => {
    return templates.filter(t => t.isFavorite)
  }, [templates])

  const getPinned = useCallback(() => {
    return templates.filter(t => t.isPinned)
  }, [templates])

  const getRecent = useCallback((limit = 5) => {
    return [...templates]
      .filter(t => t.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, limit)
  }, [templates])

  const getMostUsed = useCallback((limit = 5) => {
    return [...templates]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }, [templates])

  const searchTemplates = useCallback((query) => {
    const q = query.toLowerCase()
    return templates.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.rawMarkdown?.toLowerCase().includes(q) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }, [templates])

  const getStats = useCallback(() => {
    const stats = {
      total: templates.length,
      byCategory: {},
      byStatus: {},
      favorites: 0,
      totalUsage: 0
    }

    TEMPLATE_CATEGORIES.forEach(cat => {
      stats.byCategory[cat] = templates.filter(t => t.category === cat).length
    })

    TEMPLATE_STATUSES.forEach(status => {
      stats.byStatus[status] = templates.filter(t => t.status === status).length
    })

    stats.favorites = templates.filter(t => t.isFavorite).length
    stats.totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)

    return stats
  }, [templates])

  // Extract variables from raw markdown
  const extractVariables = useCallback((content) => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = content.match(regex) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    categories: TEMPLATE_CATEGORIES,
    statuses: TEMPLATE_STATUSES,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleFavorite,
    togglePinned,
    incrementUsage,
    changeStatus,
    moveToFolder,
    getTemplatesByCategory,
    getTemplatesByStatus,
    getTemplatesByFolder,
    getFavorites,
    getPinned,
    getRecent,
    getMostUsed,
    searchTemplates,
    getStats,
    extractVariables
  }
}

export default useTemplates
