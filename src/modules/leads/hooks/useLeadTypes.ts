import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

export interface LeadTypeAgentConfig {
  agentName?: string
  businessName?: string
  businessWebsite?: string
  industry?: string
  qualifyingQuestions?: string[]
  systemPromptContext?: string
}

export interface LeadType {
  id: string
  name: string
  slug: string
  description?: string | null
  boardId?: string | null
  defaultColumns?: Array<{ id: string; name: string; color: string }> | null
  agentConfig?: LeadTypeAgentConfig | null
  webhookSecret?: string | null
  autoCallEnabled: boolean
  autoCallDelay: number
  emailFollowUp: boolean
  createdAt: string
  updatedAt: string
  _count?: { leads: number }
}

export function useLeadTypes() {
  const { user } = useAuth()
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [loading, setLoading] = useState(false)

  const userId = user?.id
  const fetchLeadTypes = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(ENDPOINTS.LEAD_TYPES, {
        headers: { 'x-user-id': userId }
      })
      if (!res.ok) return
      const data = await res.json()
      setLeadTypes(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createLeadType = useCallback(async (data: Partial<LeadType>) => {
    if (!userId) return null
    try {
      const res = await fetch(ENDPOINTS.LEAD_TYPES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }
      const created = await res.json()
      setLeadTypes(prev => [created, ...prev])
      return created
    } catch (err: any) {
      throw err
    }
  }, [userId])

  const updateLeadType = useCallback(async (id: string, data: Partial<LeadType>) => {
    if (!userId) return null
    try {
      const res = await fetch(`${ENDPOINTS.LEAD_TYPES}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      const updated = await res.json()
      setLeadTypes(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
      return updated
    } catch (err: any) {
      throw err
    }
  }, [userId])

  const deleteLeadType = useCallback(async (id: string) => {
    if (!userId) return false
    try {
      const res = await fetch(`${ENDPOINTS.LEAD_TYPES}/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      })
      if (!res.ok) throw new Error('Failed to delete')
      setLeadTypes(prev => prev.filter(t => t.id !== id))
      return true
    } catch {
      return false
    }
  }, [userId])

  const getWebhookUrl = useCallback(async (id: string) => {
    if (!userId) return null
    try {
      const res = await fetch(`${ENDPOINTS.LEAD_TYPES}/${id}/webhook-url`, {
        headers: { 'x-user-id': userId }
      })
      return await res.json()
    } catch {
      return null
    }
  }, [userId])

  useEffect(() => {
    fetchLeadTypes()
  }, [fetchLeadTypes])

  return {
    leadTypes,
    loading,
    fetchLeadTypes,
    createLeadType,
    updateLeadType,
    deleteLeadType,
    getWebhookUrl
  }
}
