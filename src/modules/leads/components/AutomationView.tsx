import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Download, Send, Loader2, Globe, Mail, Phone,
    CheckCircle, XCircle, Users, Zap, ArrowRight, RefreshCw,
    Target, History, AlertCircle
} from 'lucide-react'
import { API_SERVER } from '../../../config/api'
import { fetchGet, fetchMutation } from '../../../utils/authHeaders'

interface ScrapedLead {
    name: string
    website?: string
    email?: string
    phone?: string
    industry?: string
    source?: string
    query?: string
    selected?: boolean
}

interface OutreachResult {
    leadId: string
    leadName: string
    success: boolean
    error?: string
}

export function AutomationView() {
    // Tab state
    const [activeTab, setActiveTab] = useState<'scraper' | 'outreach' | 'history'>('scraper')

    // Scraper state
    const [searchQuery, setSearchQuery] = useState('')
    const [enrichContacts, setEnrichContacts] = useState(true)
    const [searching, setSearching] = useState(false)
    const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([])
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)

    // Outreach state
    const [uncontactedLeads, setUncontactedLeads] = useState<any[]>([])
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
    const [templateId, setTemplateId] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [delaySeconds, setDelaySeconds] = useState(30)
    const [executing, setExecuting] = useState(false)
    const [campaignResult, setCampaignResult] = useState<any>(null)

    // History state
    const [history, setHistory] = useState<any>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Load templates and uncontacted leads on mount
    useEffect(() => {
        if (activeTab === 'outreach') {
            fetchUncontactedLeads()
            fetchTemplates()
        }
        if (activeTab === 'history') {
            fetchHistory()
        }
    }, [activeTab])

    async function handleSearch() {
        if (!searchQuery.trim()) return
        setSearching(true)
        setScrapedLeads([])
        setImportResult(null)
        try {
            const data = await fetchMutation(`${API_SERVER}/api/scraper/search`, 'POST', { query: searchQuery, maxResults: 15, enrichContacts })
            if (data.success) {
                setScrapedLeads(data.leads.map((l: any) => ({ ...l, selected: true })))
            }
        } catch (err: any) {
            console.error('Search failed:', err)
        } finally {
            setSearching(false)
        }
    }

    async function handleImport() {
        const selected = scrapedLeads.filter(l => l.selected)
        if (selected.length === 0) return
        setImporting(true)
        try {
            const data = await fetchMutation(`${API_SERVER}/api/scraper/import`, 'POST', { leads: selected })
            setImportResult(data)
            if (data.success) {
                setScrapedLeads([])
            }
        } catch (err: any) {
            console.error('Import failed:', err)
        } finally {
            setImporting(false)
        }
    }

    async function fetchUncontactedLeads() {
        try {
            const data = await fetchGet(`${API_SERVER}/api/outreach/uncontacted`)
            if (data.success) setUncontactedLeads(data.leads)
        } catch { }
    }

    async function fetchTemplates() {
        try {
            const data = await fetchGet(`${API_SERVER}/api/resources/emailtemplates`)
            if (Array.isArray(data)) setTemplates(data)
        } catch { }
    }

    async function fetchHistory() {
        setLoadingHistory(true)
        try {
            const data = await fetchGet(`${API_SERVER}/api/outreach/history`)
            if (data.success) setHistory(data)
        } catch { }
        setLoadingHistory(false)
    }

    async function handleCampaign() {
        if (selectedLeadIds.size === 0 || !templateId) return
        setExecuting(true)
        setCampaignResult(null)
        try {
            const data = await fetchMutation(`${API_SERVER}/api/outreach/campaign`, 'POST', {
                    leadIds: Array.from(selectedLeadIds),
                    templateId,
                    delaySeconds
                })
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
    }

    function toggleLeadSelection(id: string) {
        setSelectedLeadIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function selectAllLeads() {
        if (selectedLeadIds.size === uncontactedLeads.length) {
            setSelectedLeadIds(new Set())
        } else {
            setSelectedLeadIds(new Set(uncontactedLeads.map(l => l.id)))
        }
    }

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 border border-border">
                {[
                    { id: 'scraper' as const, label: 'Lead Scraper', icon: Search },
                    { id: 'outreach' as const, label: 'Auto-Outreach', icon: Zap },
                    { id: 'history' as const, label: 'History', icon: History }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-bg-primary shadow-sm'
                                : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scraper Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'scraper' && (
                    <motion.div
                        key="scraper"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Search Input */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" />
                                Search for Leads
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder='e.g. "web design agency Toronto" or "software freelancer Pakistan"'
                                    className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    className="px-4 py-2 bg-primary text-bg-primary rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Search
                                </button>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enrichContacts}
                                    onChange={e => setEnrichContacts(e.target.checked)}
                                    className="rounded border-border accent-primary"
                                />
                                Enrich with contact info (emails, phones) — slower but more useful
                            </label>
                        </div>

                        {/* Searching indicator */}
                        {searching && (
                            <div className="flex items-center justify-center gap-3 py-8 text-text-muted">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-sm">Scraping Google results{enrichContacts ? ' and extracting contacts' : ''}...</span>
                            </div>
                        )}

                        {/* Scraped Results */}
                        {scrapedLeads.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Found {scrapedLeads.length} potential leads
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setScrapedLeads(prev => prev.map(l => ({ ...l, selected: !prev.every(p => p.selected) })))}
                                            className="text-xs text-text-muted hover:text-text-primary"
                                        >
                                            Toggle All
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={importing || !scrapedLeads.some(l => l.selected)}
                                            className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium hover:bg-green-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                            Import {scrapedLeads.filter(l => l.selected).length} Selected
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    {scrapedLeads.map((lead, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            onClick={() => setScrapedLeads(prev => prev.map((l, j) => j === i ? { ...l, selected: !l.selected } : l))}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${lead.selected
                                                    ? 'bg-primary/5 border-primary/30'
                                                    : 'bg-bg-secondary border-border opacity-60'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={lead.selected || false}
                                                onChange={() => { }}
                                                className="accent-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-text-primary truncate">{lead.name}</div>
                                                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                                                    {lead.website && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Globe className="w-3 h-3" />{new URL(lead.website).hostname}
                                                        </span>
                                                    )}
                                                    {lead.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />{lead.email}
                                                        </span>
                                                    )}
                                                    {lead.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />{lead.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {lead.industry && (
                                                <span className="px-2 py-0.5 rounded-full bg-bg-tertiary text-xs text-text-muted">
                                                    {lead.industry}
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Import Result */}
                        {importResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                            >
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-green-400">
                                    Successfully imported {importResult.imported} leads! They're now in your Leads board.
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Outreach Tab */}
                {activeTab === 'outreach' && (
                    <motion.div
                        key="outreach"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Template Selection */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" />
                                Email Template
                            </h3>
                            <select
                                value={templateId}
                                onChange={e => setTemplateId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Select a template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-text-muted">Delay between emails:</label>
                                <select
                                    value={delaySeconds}
                                    onChange={e => setDelaySeconds(Number(e.target.value))}
                                    className="px-2 py-1 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs"
                                >
                                    <option value="10">10 seconds</option>
                                    <option value="30">30 seconds</option>
                                    <option value="60">1 minute</option>
                                    <option value="120">2 minutes</option>
                                    <option value="300">5 minutes</option>
                                </select>
                            </div>
                        </div>

                        {/* Lead Selection */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Uncontacted Leads ({uncontactedLeads.length})
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchUncontactedLeads}
                                        className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Refresh
                                    </button>
                                    <button
                                        onClick={selectAllLeads}
                                        className="text-xs text-primary hover:text-primary/80"
                                    >
                                        {selectedLeadIds.size === uncontactedLeads.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            </div>

                            {uncontactedLeads.length === 0 ? (
                                <div className="text-center py-6 text-text-muted text-sm">
                                    No uncontacted leads found. Use the scraper to find new leads!
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                    {uncontactedLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => toggleLeadSelection(lead.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm ${selectedLeadIds.has(lead.id)
                                                    ? 'bg-primary/5 border border-primary/30'
                                                    : 'hover:bg-bg-tertiary border border-transparent'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedLeadIds.has(lead.id)}
                                                onChange={() => { }}
                                                className="accent-primary"
                                            />
                                            <span className="font-medium text-text-primary flex-1 truncate">{lead.name}</span>
                                            {lead.email ? (
                                                <span className="text-xs text-text-muted flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />{lead.email}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />No email
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Execute Campaign Button */}
                        <button
                            onClick={handleCampaign}
                            disabled={executing || selectedLeadIds.size === 0 || !templateId}
                            className="w-full py-3 bg-primary text-bg-primary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                            {executing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending emails... ({selectedLeadIds.size} leads)
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Launch Campaign ({selectedLeadIds.size} leads)
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Campaign Results */}
                        {campaignResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3"
                            >
                                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    Campaign Results
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-2 rounded-lg bg-bg-tertiary">
                                        <div className="text-lg font-bold text-text-primary">{campaignResult.totalLeads}</div>
                                        <div className="text-xs text-text-muted">Total</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-green-500/10">
                                        <div className="text-lg font-bold text-green-500">{campaignResult.sent}</div>
                                        <div className="text-xs text-text-muted">Sent</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                                        <div className="text-lg font-bold text-red-500">{campaignResult.failed}</div>
                                        <div className="text-xs text-text-muted">Failed</div>
                                    </div>
                                </div>
                                {campaignResult.results && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {campaignResult.results.map((r: OutreachResult, i: number) => (
                                            <div key={i} className="flex items-center gap-2 text-xs py-1">
                                                {r.success ? (
                                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                )}
                                                <span className="text-text-primary truncate">{r.leadName}</span>
                                                {r.error && <span className="text-red-400 ml-auto text-xs">{r.error}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                        ) : history ? (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                        <div className="text-2xl font-bold text-primary">{history.stats.sentToday}</div>
                                        <div className="text-xs text-text-muted mt-1">Sent Today</div>
                                    </div>
                                    <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                        <div className="text-2xl font-bold text-text-primary">{history.stats.sentThisWeek}</div>
                                        <div className="text-xs text-text-muted mt-1">This Week</div>
                                    </div>
                                    <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                        <div className="text-2xl font-bold text-text-muted">{history.stats.totalSent}</div>
                                        <div className="text-xs text-text-muted mt-1">All Time</div>
                                    </div>
                                </div>

                                {/* Recent Messages */}
                                <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                                    <h3 className="text-sm font-semibold text-text-primary">Recent Outreach</h3>
                                    {history.messages.length === 0 ? (
                                        <div className="text-center py-4 text-text-muted text-sm">
                                            No outreach emails sent yet. Start a campaign!
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {history.messages.slice(0, 30).map((msg: any) => (
                                                <div key={msg.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary text-sm">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-text-primary truncate">
                                                            {msg.lead?.name || 'Unknown'} — {msg.subject || 'No subject'}
                                                        </div>
                                                        <div className="text-xs text-text-muted">
                                                            {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    <span className={`px-1.5 py-0.5 rounded text-xs ${msg.status === 'sent' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                        {msg.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-text-muted text-sm">
                                Failed to load history. Try refreshing.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AutomationView
