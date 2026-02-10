import { useState, useCallback } from 'react'
import { API_SERVER } from '../../../config/api'

function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    try {
        const stored = localStorage.getItem('auth_user')
        if (stored) headers['x-user-id'] = JSON.parse(stored).id
    } catch { }
    return headers
}

export interface ScrapedLead {
    name: string
    website?: string
    email?: string
    phone?: string
    industry?: string
    source?: string
    query?: string
    selected?: boolean
}

export interface UseLeadScraperReturn {
    searchQuery: string
    setSearchQuery: (q: string) => void
    enrichContacts: boolean
    setEnrichContacts: (v: boolean) => void
    searching: boolean
    scrapedLeads: ScrapedLead[]
    setScrapedLeads: React.Dispatch<React.SetStateAction<ScrapedLead[]>>
    importing: boolean
    importResult: any
    handleSearch: () => Promise<void>
    handleImport: () => Promise<void>
    toggleSelectAll: () => void
    toggleLead: (index: number) => void
    selectedCount: number
    totalCount: number
}

export function useLeadScraper(): UseLeadScraperReturn {
    const [searchQuery, setSearchQuery] = useState('')
    const [enrichContacts, setEnrichContacts] = useState(true)
    const [searching, setSearching] = useState(false)
    const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([])
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        setScrapedLeads([])
        setImportResult(null)
        try {
            const res = await fetch(`${API_SERVER}/api/scraper/search`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ query: searchQuery, maxResults: 15, enrichContacts })
            })
            const data = await res.json()
            if (data.success) {
                setScrapedLeads(data.leads.map((l: any) => ({ ...l, selected: true })))
            }
        } catch (err: any) {
            console.error('Search failed:', err)
        } finally {
            setSearching(false)
        }
    }, [searchQuery, enrichContacts])

    const handleImport = useCallback(async () => {
        const selected = scrapedLeads.filter(l => l.selected)
        if (selected.length === 0) return
        setImporting(true)
        try {
            const res = await fetch(`${API_SERVER}/api/scraper/import`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ leads: selected })
            })
            const data = await res.json()
            setImportResult(data)
            if (data.success) {
                setScrapedLeads([])
            }
        } catch (err: any) {
            console.error('Import failed:', err)
        } finally {
            setImporting(false)
        }
    }, [scrapedLeads])

    const toggleSelectAll = useCallback(() => {
        setScrapedLeads(prev =>
            prev.map(l => ({ ...l, selected: !prev.every(p => p.selected) }))
        )
    }, [])

    const toggleLead = useCallback((index: number) => {
        setScrapedLeads(prev =>
            prev.map((l, j) => j === index ? { ...l, selected: !l.selected } : l)
        )
    }, [])

    return {
        searchQuery, setSearchQuery,
        enrichContacts, setEnrichContacts,
        searching,
        scrapedLeads, setScrapedLeads,
        importing,
        importResult,
        handleSearch,
        handleImport,
        toggleSelectAll,
        toggleLead,
        selectedCount: scrapedLeads.filter(l => l.selected).length,
        totalCount: scrapedLeads.length
    }
}
