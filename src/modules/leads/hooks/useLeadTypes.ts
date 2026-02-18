import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../../utils/authHeaders'

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
      const data = await fetchGet(ENDPOINTS.LEAD_TYPES)
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
      const created = await fetchMutation(ENDPOINTS.LEAD_TYPES, 'POST', data)
      setLeadTypes(prev => [created, ...prev])
      return created
    } catch (err: any) {
      throw err
    }
  }, [userId])

  const updateLeadType = useCallback(async (id: string, data: Partial<LeadType>) => {
    if (!userId) return null
    try {
      const updated = await fetchMutation(`${ENDPOINTS.LEAD_TYPES}/${id}`, 'PATCH', data)
      setLeadTypes(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
      return updated
    } catch (err: any) {
      throw err
    }
  }, [userId])

  const deleteLeadType = useCallback(async (id: string) => {
    if (!userId) return false
    try {
      await fetchMutation(`${ENDPOINTS.LEAD_TYPES}/${id}`, 'DELETE')
      setLeadTypes(prev => prev.filter(t => t.id !== id))
      return true
    } catch {
      return false
    }
  }, [userId])

  const getWebhookUrl = useCallback(async (id: string) => {
    if (!userId) return null
    try {
      return await fetchGet(`${ENDPOINTS.LEAD_TYPES}/${id}/webhook-url`)
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
