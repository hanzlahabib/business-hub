import { useState, useCallback, useEffect } from 'react'
import { API_SERVER } from '../../../config/api'
import { getJsonAuthHeaders } from '../../../utils/authHeaders'

export interface OutreachResult {
    leadId: string
    leadName: string
    success: boolean
    error?: string
}

export interface OutreachHistory {
    stats: {
        sentToday: number
        sentThisWeek: number
        totalSent: number
    }
    messages: any[]
}

export interface UseOutreachReturn {
    // Leads & templates
    uncontactedLeads: any[]
    selectedLeadIds: Set<string>
    templateId: string
    setTemplateId: (id: string) => void
    templates: any[]
    delaySeconds: number
    setDelaySeconds: (s: number) => void

    // Campaign execution
    executing: boolean
    campaignResult: any

    // History
    history: OutreachHistory | null
    loadingHistory: boolean

    // Actions
    handleCampaign: () => Promise<void>
    fetchUncontactedLeads: () => Promise<void>
    fetchTemplates: () => Promise<void>
    fetchHistory: () => Promise<void>
    toggleLeadSelection: (id: string) => void
    selectAllLeads: () => void
}

export function useOutreach(): UseOutreachReturn {
    const [uncontactedLeads, setUncontactedLeads] = useState<any[]>([])
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
    const [templateId, setTemplateId] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [delaySeconds, setDelaySeconds] = useState(30)
    const [executing, setExecuting] = useState(false)
    const [campaignResult, setCampaignResult] = useState<any>(null)

    const [history, setHistory] = useState<OutreachHistory | null>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)

    const fetchUncontactedLeads = useCallback(async () => {
        try {
            const res = await fetch(`${API_SERVER}/api/outreach/uncontacted`, {
                headers: getJsonAuthHeaders()
            })
            const data = await res.json()
            if (data.success) setUncontactedLeads(data.leads)
        } catch { }
    }, [])

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch(`${API_SERVER}/api/resources/emailtemplates`, {
                headers: getJsonAuthHeaders()
            })
            const data = await res.json()
            if (Array.isArray(data)) setTemplates(data)
        } catch { }
    }, [])

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch(`${API_SERVER}/api/outreach/history`, {
                headers: getJsonAuthHeaders()
            })
            const data = await res.json()
            if (data.success) setHistory(data)
        } catch { }
        setLoadingHistory(false)
    }, [])

    const handleCampaign = useCallback(async () => {
        if (selectedLeadIds.size === 0 || !templateId) return
        setExecuting(true)
        setCampaignResult(null)
        try {
            const res = await fetch(`${API_SERVER}/api/outreach/campaign`, {
                method: 'POST',
                headers: getJsonAuthHeaders(),
                body: JSON.stringify({
                    leadIds: Array.from(selectedLeadIds),
                    templateId,
                    delaySeconds
                })
            })
            const data = await res.json()
            setCampaignResult(data)
            if (data.success) {
                fetchUncontactedLeads()
                setSelectedLeadIds(new Set())
            }
        } catch (err: any) {
            console.error('Campaign failed:', err)
        } finally {
            setExecuting(false)
        }
    }, [selectedLeadIds, templateId, delaySeconds, fetchUncontactedLeads])

    const toggleLeadSelection = useCallback((id: string) => {
        setSelectedLeadIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const selectAllLeads = useCallback(() => {
        if (selectedLeadIds.size === uncontactedLeads.length) {
            setSelectedLeadIds(new Set())
        } else {
            setSelectedLeadIds(new Set(uncontactedLeads.map((l: any) => l.id)))
        }
    }, [selectedLeadIds.size, uncontactedLeads])

    return {
        uncontactedLeads, selectedLeadIds,
        templateId, setTemplateId,
        templates,
        delaySeconds, setDelaySeconds,
        executing, campaignResult,
        history, loadingHistory,
        handleCampaign,
        fetchUncontactedLeads,
        fetchTemplates,
        fetchHistory,
        toggleLeadSelection,
        selectAllLeads
    }
}
