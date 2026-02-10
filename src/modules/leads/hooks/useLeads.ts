import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'

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
      const data = await res.json()
      setLeads(prev => [...prev, data])
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
      byStatus: {},
      byIndustry: {},
      bySource: {}
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
    importLeads,
    getLeadsByStatus,
    getLeadsByIndustry,
    searchLeads,
    getStats
  }
}


export default useLeads
