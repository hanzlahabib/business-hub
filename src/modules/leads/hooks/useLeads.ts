import { useState, useCallback, useEffect, useRef } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { useWebSocket } from '../../../hooks/useWebSocket'
import { toast } from 'sonner'

const LEAD_STATUSES = ['new', 'contacted', 'replied', 'meeting', 'won', 'lost']

export interface Lead {
  id: string
  name: string
  company?: string
  email: string
  status: string
  industry?: string
  source?: string
  contactPerson?: string
  websiteIssues?: string[]
  tags?: string[]
  createdAt: string
  lastContactedAt?: string | null
  linkedBoardId?: string | null
  typeId?: string | null
  leadType?: { id: string; name: string; slug: string } | null
}

export function useLeads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(ENDPOINTS.LEADS, {
        headers: { 'x-user-id': user.id }
      })
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  const createLead = useCallback(async (leadData) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const newLead = {
        ...leadData,
        status: leadData.status || 'new',
        websiteIssues: leadData.websiteIssues || [],
        tags: leadData.tags || [],
        createdAt: new Date().toISOString(),
        lastContactedAt: null,
        linkedBoardId: null
      }

      const res = await fetch(ENDPOINTS.LEADS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(newLead)
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create lead')
      const data = await res.json()
      setLeads(prev => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateLead = useCallback(async (id, updates) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${ENDPOINTS.LEADS}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? data : l))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteLead = useCallback(async (id) => {
    if (!user) return false
    setLoading(true)
    setError(null)
    try {
      await fetch(`${ENDPOINTS.LEADS}/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      })
      setLeads(prev => prev.filter(l => l.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const changeStatus = useCallback(async (id, newStatus) => {
    return updateLead(id, { status: newStatus })
  }, [updateLead])

  const markContacted = useCallback(async (id) => {
    return updateLead(id, {
      status: 'contacted',
      lastContactedAt: new Date().toISOString()
    })
  }, [updateLead])

  const bulkUpdate = useCallback(async (ids: string[], updates: Record<string, any>) => {
    if (!user) return []
    try {
      const res = await fetch(ENDPOINTS.LEADS_BULK, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ ids, updates })
      })
      if (!res.ok) throw new Error('Bulk update failed')
      const updated = await res.json()
      setLeads(prev => prev.map(l => {
        const match = updated.find((u: Lead) => u.id === l.id)
        return match ? match : l
      }))
      toast.success(`${updated.length} leads updated`)
      return updated
    } catch (err: any) {
      toast.error(err.message || 'Bulk update failed')
      return []
    }
  }, [user])

  const bulkDelete = useCallback(async (ids: string[]) => {
    if (!user) return false
    try {
      const res = await fetch(ENDPOINTS.LEADS_BULK, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error('Bulk delete failed')
      setLeads(prev => prev.filter(l => !ids.includes(l.id)))
      toast.success(`${ids.length} leads deleted`)
      return true
    } catch (err: any) {
      toast.error(err.message || 'Bulk delete failed')
      return false
    }
  }, [user])

  const importLeads = useCallback(async (leadsArray) => {
    if (!user) return []
    setLoading(true)
    setError(null)
    const imported: any[] = []
    try {
      for (const lead of leadsArray) {
        const newLead = {
          ...lead,
          status: lead.status || 'new',
          websiteIssues: lead.websiteIssues || [],
          tags: lead.tags || [],
          createdAt: lead.createdAt || new Date().toISOString(),
          lastContactedAt: null,
          linkedBoardId: null
        }

        const res = await fetch(ENDPOINTS.LEADS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify(newLead)
        })
        const data = await res.json()
        imported.push(data)
      }
      setLeads(prev => [...prev, ...imported])
      return imported
    } catch (err: any) {
      setError(err.message)
      return imported
    } finally {
      setLoading(false)
    }
  }, [user])

  const getLeadsByStatus = useCallback((status) => {
    return leads.filter(l => l.status === status)
  }, [leads])

  const getLeadsByIndustry = useCallback((industry) => {
    return leads.filter(l => l.industry === industry)
  }, [leads])

  const searchLeads = useCallback((query) => {
    const q = query.toLowerCase()
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.contactPerson?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q)
    )
  }, [leads])

  const getStats = useCallback(() => {
    const stats = {
      total: leads.length,
      byStatus: {} as Record<string, number>,
      byIndustry: {} as Record<string, number>,
      bySource: {} as Record<string, number>
    }

    LEAD_STATUSES.forEach(status => {
      stats.byStatus[status] = leads.filter(l => l.status === status).length
    })

    leads.forEach(lead => {
      if (lead.industry) {
        stats.byIndustry[lead.industry] = (stats.byIndustry[lead.industry] || 0) + 1
      }
      if (lead.source) {
        stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1
      }
    })

    return stats
  }, [leads])

  // WebSocket: real-time lead updates
  const leadsRef = useRef(leads)
  leadsRef.current = leads
  const wsSendRef = useRef<(data: any) => void>(() => {})

  const handleWsMessage = useCallback((data: any) => {
    // Authenticate on initial connection so server routes events to us
    if (data.type === 'connected' && user) {
      wsSendRef.current({ type: 'auth', userId: user.id })
      return
    }

    if (data.type === 'lead:created' && data.lead) {
      // Add new lead to state if not already present
      setLeads(prev => {
        if (prev.some(l => l.id === data.lead.id)) return prev
        return [data.lead, ...prev]
      })
      toast.success(`New lead: ${data.lead.name || 'Unknown'}`, {
        description: data.lead.source ? `Source: ${data.lead.source}` : undefined,
      })
    }

    if (data.type === 'lead:updated' && data.lead) {
      setLeads(prev => prev.map(l => l.id === data.lead.id ? { ...l, ...data.lead } : l))
    }

    if (data.type === 'lead:status-changed' && data.leadId) {
      setLeads(prev => prev.map(l =>
        l.id === data.leadId ? { ...l, status: data.status || l.status } : l
      ))
    }
  }, [user])

  const { send: wsSend } = useWebSocket('/ws/calls', {
    onMessage: handleWsMessage,
    autoConnect: true,
    maxRetries: 5,
  })

  // Keep send ref in sync
  wsSendRef.current = wsSend

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  return {
    leads,
    loading,
    error,
    statuses: LEAD_STATUSES,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    changeStatus,
    markContacted,
    bulkUpdate,
    bulkDelete,
    importLeads,
    getLeadsByStatus,
    getLeadsByIndustry,
    searchLeads,
    getStats
  }
}


export default useLeads
