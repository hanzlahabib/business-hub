import { useState, useCallback, useEffect } from 'react'

const JSON_SERVER = 'http://localhost:3001'

export function useEmailTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/emailTemplates`)
      const data = await res.json()
      setTemplates(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (template) => {
    setLoading(true)
    setError(null)
    try {
      const newTemplate = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }

      const res = await fetch(`${JSON_SERVER}/emailTemplates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })
      const data = await res.json()
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
      const res = await fetch(`${JSON_SERVER}/emailTemplates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
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
      await fetch(`${JSON_SERVER}/emailTemplates/${id}`, {
        method: 'DELETE'
      })
      setTemplates(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

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
