/**
 * Template History Hook
 *
 * Provides version control functionality for templates.
 * Uses the abstracted historyApi service for database operations.
 */

import { useState, useCallback } from 'react'
import { historyApi, templateApi } from '../services/templateApi'

export function useTemplateHistory(templateId = null) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch history for a template
  const fetchHistory = useCallback(async (id = templateId) => {
    if (!id) return []

    setLoading(true)
    setError(null)

    try {
      const data = await historyApi.getByTemplateId(id)
      setHistory(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [templateId])

  // Save a version snapshot
  const saveVersion = useCallback(async (template, changeType = 'edited', changeSummary = '') => {
    if (!template?.id) return null

    try {
      // Get current version count
      const nextVersion = await historyApi.getLatestVersion(template.id) + 1

      const historyEntry = {
        id: `history-${Date.now()}`,
        templateId: template.id,
        version: nextVersion,
        content: template.content || null,
        rawMarkdown: template.rawMarkdown || '',
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags || [],
        changedBy: template.updatedBy || 'user-1', // TODO: Replace with actual user ID
        changeType,
        changeSummary: changeSummary || getAutoSummary(changeType)
      }

      const saved = await historyApi.create(historyEntry)
      setHistory(prev => [saved, ...prev])

      return saved
    } catch (err) {
      console.error('Error saving version:', err)
      return null
    }
  }, [])

  // Restore a previous version
  const restoreVersion = useCallback(async (historyId) => {
    try {
      // Get the history entry
      const historyEntry = await historyApi.getById(historyId)

      // Get current template
      const currentTemplate = await templateApi.getById(historyEntry.templateId)

      // Save current state as a version before restoring
      await saveVersion(currentTemplate, 'edited', 'Auto-saved before restore')

      // Update template with historical content
      const restored = await templateApi.update(historyEntry.templateId, {
        content: historyEntry.content,
        rawMarkdown: historyEntry.rawMarkdown,
        name: historyEntry.name,
        description: historyEntry.description,
        category: historyEntry.category,
        tags: historyEntry.tags,
        version: (currentTemplate.version || 1) + 1
      })

      // Save restoration as new version
      await saveVersion(
        { ...restored, content: historyEntry.content, rawMarkdown: historyEntry.rawMarkdown },
        'restored',
        `Restored from version ${historyEntry.version}`
      )

      return restored
    } catch (err) {
      setError(err.message)
      console.error('Error restoring version:', err)
      return null
    }
  }, [saveVersion])

  // Get a specific version
  const getVersion = useCallback(async (historyId) => {
    try {
      return await historyApi.getById(historyId)
    } catch (err) {
      console.error('Error fetching version:', err)
      return null
    }
  }, [])

  // Compare two versions (simple diff)
  const compareVersions = useCallback((version1, version2) => {
    if (!version1 || !version2) return null

    const changes = []

    // Compare name
    if (version1.name !== version2.name) {
      changes.push({
        field: 'name',
        from: version1.name,
        to: version2.name
      })
    }

    // Compare description
    if (version1.description !== version2.description) {
      changes.push({
        field: 'description',
        from: version1.description,
        to: version2.description
      })
    }

    // Compare category
    if (version1.category !== version2.category) {
      changes.push({
        field: 'category',
        from: version1.category,
        to: version2.category
      })
    }

    // Compare rawMarkdown (content)
    if (version1.rawMarkdown !== version2.rawMarkdown) {
      changes.push({
        field: 'content',
        from: version1.rawMarkdown,
        to: version2.rawMarkdown
      })
    }

    // Compare tags
    const tags1 = (version1.tags || []).sort().join(',')
    const tags2 = (version2.tags || []).sort().join(',')
    if (tags1 !== tags2) {
      changes.push({
        field: 'tags',
        from: version1.tags,
        to: version2.tags
      })
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      version1: version1.version,
      version2: version2.version
    }
  }, [])

  // Delete old versions (keep last N)
  const pruneHistory = useCallback(async (id = templateId, keepCount = 20) => {
    if (!id) return

    try {
      const allHistory = await historyApi.getByTemplateId(id)

      if (allHistory.length <= keepCount) return

      // Delete old versions
      const toDelete = allHistory.slice(keepCount)
      await Promise.all(toDelete.map(entry => historyApi.delete(entry.id)))

      // Update local state
      setHistory(allHistory.slice(0, keepCount))
    } catch (err) {
      console.error('Error pruning history:', err)
    }
  }, [templateId])

  return {
    history,
    loading,
    error,
    fetchHistory,
    saveVersion,
    restoreVersion,
    getVersion,
    compareVersions,
    pruneHistory
  }
}

// Helper to generate auto summary
function getAutoSummary(changeType) {
  switch (changeType) {
    case 'created':
      return 'Template created'
    case 'edited':
      return 'Content updated'
    case 'restored':
      return 'Restored from previous version'
    default:
      return 'Changes saved'
  }
}

export default useTemplateHistory
