import { useState, useCallback, useEffect } from 'react'

const JSON_SERVER = 'http://localhost:3005'

const LEAD_STATUSES = ['new', 'contacted', 'replied', 'meeting', 'won', 'lost']

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/leads`)
      const data = await res.json()
      setLeads(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createLead = useCallback(async (leadData) => {
    setLoading(true)
    setError(null)
    try {
      const newLead = {
        ...leadData,
        id: crypto.randomUUID(),
        status: leadData.status || 'new',
        websiteIssues: leadData.websiteIssues || [],
        tags: leadData.tags || [],
        createdAt: new Date().toISOString(),
        lastContactedAt: null,
        linkedBoardId: null
      }

      const res = await fetch(`${JSON_SERVER}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      })
      const data = await res.json()
      setLeads(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateLead = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? data : l))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteLead = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${JSON_SERVER}/leads/${id}`, {
        method: 'DELETE'
      })
      setLeads(prev => prev.filter(l => l.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

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
    setLoading(true)
    setError(null)
    const imported = []
    try {
      for (const lead of leadsArray) {
        const newLead = {
          ...lead,
          id: lead.id || crypto.randomUUID(),
          status: lead.status || 'new',
          websiteIssues: lead.websiteIssues || [],
          tags: lead.tags || [],
          createdAt: lead.createdAt || new Date().toISOString(),
          lastContactedAt: null,
          linkedBoardId: null
        }

        const res = await fetch(`${JSON_SERVER}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead)
        })
        const data = await res.json()
        imported.push(data)
      }
      setLeads(prev => [...prev, ...imported])
      return imported
    } catch (err) {
      setError(err.message)
      return imported
    } finally {
      setLoading(false)
    }
  }, [])

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
