import { useState, useCallback, useEffect } from 'react'

import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../utils/authHeaders'

export function useEmailTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGet(ENDPOINTS.EMAIL_TEMPLATES)
      setTemplates(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  const createTemplate = useCallback(async (template) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const newTemplate = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }

      const data = await fetchMutation(ENDPOINTS.EMAIL_TEMPLATES, 'POST', newTemplate)
      setTemplates(prev => [...prev, data])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateTemplate = useCallback(async (id, updates) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.EMAIL_TEMPLATES}/${id}`, 'PATCH', updates)
      setTemplates(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteTemplate = useCallback(async (id) => {
    if (!user) return false
    setLoading(true)
    setError(null)
    try {
      await fetchMutation(`${ENDPOINTS.EMAIL_TEMPLATES}/${id}`, 'DELETE')
      setTemplates(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Process template with lead data
  const processTemplate = useCallback((template, lead) => {
    if (!template || !lead) return { subject: '', body: '' }

    const variables = {
      company: lead.name || '',
      contactPerson: lead.contactPerson || '',
      email: lead.email || '',
      industry: lead.industry || '',
      website: lead.website || ''
    }

    let subject = template.subject
    let body = template.body

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    }

    return { subject, body }
  }, [])

  const getTemplatesByCategory = useCallback((category) => {
    return templates.filter(t => t.category === category)
  }, [templates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    processTemplate,
    getTemplatesByCategory
  }
}

export default useEmailTemplates
