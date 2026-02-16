import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Download, Send, Loader2, Globe, Mail, Phone,
    CheckCircle, XCircle, Users, Zap, ArrowRight, RefreshCw,
    Target, History, AlertCircle, Sparkles, TrendingUp
} from 'lucide-react'
import { useLeadScraper } from '../hooks/useLeadScraper'
import { useOutreach, type OutreachResult } from '../hooks/useOutreach'

export function AutomationView() {
    const [activeTab, setActiveTab] = useState<'scraper' | 'outreach' | 'history'>('scraper')

    const scraper = useLeadScraper()
    const outreach = useOutreach()

    // Load outreach data when switching tabs
    useEffect(() => {
        if (activeTab === 'outreach') {
            outreach.fetchUncontactedLeads()
            outreach.fetchTemplates()
        }
        if (activeTab === 'history') {
            outreach.fetchHistory()
        }
    }, [activeTab])

    return (
        <div className="h-full flex flex-col">
            {/* Stitch Header */}
            <div className="px-8 pt-6 pb-2 shrink-0">
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Zap className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Automation Hub</h1>
                        </div>
                        {/* Live stats chips */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs">
                                <Users className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-text-muted">Leads:</span>
                                <span className="font-semibold text-text-primary">{scraper.totalCount || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-text-muted">Sent:</span>
                                <span className="font-semibold text-text-primary">
                                    {outreach.history?.stats?.totalSent ?? '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stitch Tab Bar */}
                    <div className="flex items-center border-b border-border">
                        {[
                            { id: 'scraper' as const, label: 'Lead Scraper', icon: Search },
                            { id: 'outreach' as const, label: 'Auto-Outreach', icon: Zap },
                            { id: 'history' as const, label: 'History', icon: History }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'text-emerald-500 border-emerald-500'
                                    : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto px-8 pb-8">

                {/* ============================================================
                TAB CONTENT
               ============================================================ */}
                <AnimatePresence mode="wait">
                    {/* ---- SCRAPER TAB ---- */}
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
                                    <Globe className="w-4 h-4 text-accent-primary" />
                                    Search for Leads
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={scraper.searchQuery}
                                        onChange={e => scraper.setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && scraper.handleSearch()}
                                        placeholder='e.g. "web design agency Toronto" or "software freelancer Pakistan"'
                                        className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                                    />
                                    <button
                                        onClick={scraper.handleSearch}
                                        disabled={scraper.searching || !scraper.searchQuery.trim()}
                                        className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
                                    >
                                        {scraper.searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        Search
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={scraper.enrichContacts}
                                        onChange={e => scraper.setEnrichContacts(e.target.checked)}
                                        className="rounded border-border accent-accent-primary"
                                    />
                                    Enrich with contact info (emails, phones) — slower but more useful
                                </label>
                            </div>

                            {/* Searching indicator */}
                            {scraper.searching && (
                                <div className="flex items-center justify-center gap-3 py-8 text-text-muted">
                                    <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                                    <span className="text-sm">Scraping Google results{scraper.enrichContacts ? ' and extracting contacts' : ''}...</span>
                                </div>
                            )}

                            {/* Scraped Results */}
                            {scraper.scrapedLeads.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            Found {scraper.totalCount} potential leads
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={scraper.toggleSelectAll}
                                                className="text-xs text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                Toggle All
                                            </button>
                                            <button
                                                onClick={scraper.handleImport}
                                                disabled={scraper.importing || scraper.selectedCount === 0}
                                                className="px-3 py-1.5 bg-accent-success/10 text-accent-success rounded-lg text-xs font-medium hover:bg-accent-success/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                                            >
                                                {scraper.importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                Import {scraper.selectedCount} Selected
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        {scraper.scrapedLeads.map((lead, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => scraper.toggleLead(i)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${lead.selected
                                                    ? 'bg-accent-primary/5 border-accent-primary/30'
                                                    : 'bg-bg-secondary border-border opacity-60'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={lead.selected || false}
                                                    onChange={() => { }}
                                                    className="accent-accent-primary"
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
                            {scraper.importResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-accent-success/10 border border-accent-success/30"
                                >
                                    <CheckCircle className="w-5 h-5 text-accent-success flex-shrink-0" />
                                    <span className="text-sm text-accent-success">
                                        Successfully imported {scraper.importResult.imported} leads! They're now in your Leads board.
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ---- OUTREACH TAB ---- */}
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
                                    <Mail className="w-4 h-4 text-accent-primary" />
                                    Email Template
                                </h3>
                                <select
                                    value={outreach.templateId}
                                    onChange={e => outreach.setTemplateId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                                >
                                    <option value="">Select a template...</option>
                                    {outreach.templates.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-text-muted">Delay between emails:</label>
                                    <select
                                        value={outreach.delaySeconds}
                                        onChange={e => outreach.setDelaySeconds(Number(e.target.value))}
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
                                        <Users className="w-4 h-4 text-accent-primary" />
                                        Uncontacted Leads ({outreach.uncontactedLeads.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={outreach.fetchUncontactedLeads}
                                            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Refresh
                                        </button>
                                        <button
                                            onClick={outreach.selectAllLeads}
                                            className="text-xs text-accent-primary hover:opacity-80 transition-opacity"
                                        >
                                            {outreach.selectedLeadIds.size === outreach.uncontactedLeads.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {outreach.uncontactedLeads.length === 0 ? (
                                    <div className="text-center py-6 text-text-muted text-sm">
                                        No uncontacted leads found. Use the scraper to find new leads!
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        {outreach.uncontactedLeads.map((lead: any) => (
                                            <div
                                                key={lead.id}
                                                onClick={() => outreach.toggleLeadSelection(lead.id)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm ${outreach.selectedLeadIds.has(lead.id)
                                                    ? 'bg-accent-primary/5 border border-accent-primary/30'
                                                    : 'hover:bg-bg-tertiary border border-transparent'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={outreach.selectedLeadIds.has(lead.id)}
                                                    onChange={() => { }}
                                                    className="accent-accent-primary"
                                                />
                                                <span className="font-medium text-text-primary flex-1 truncate">{lead.name}</span>
                                                {lead.email ? (
                                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />{lead.email}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-accent-warning flex items-center gap-1">
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
                                onClick={outreach.handleCampaign}
                                disabled={outreach.executing || outreach.selectedLeadIds.size === 0 || !outreach.templateId}
                                className="w-full py-3 bg-accent-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {outreach.executing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending emails... ({outreach.selectedLeadIds.size} leads)
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Launch Campaign ({outreach.selectedLeadIds.size} leads)
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* Campaign Results */}
                            {outreach.campaignResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3"
                                >
                                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                        <Target className="w-4 h-4 text-accent-primary" />
                                        Campaign Results
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-2 rounded-lg bg-bg-tertiary">
                                            <div className="text-lg font-bold text-text-primary">{outreach.campaignResult.totalLeads}</div>
                                            <div className="text-xs text-text-muted">Total</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-accent-success/10">
                                            <div className="text-lg font-bold text-accent-success">{outreach.campaignResult.sent}</div>
                                            <div className="text-xs text-text-muted">Sent</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-accent-danger/10">
                                            <div className="text-lg font-bold text-accent-danger">{outreach.campaignResult.failed}</div>
                                            <div className="text-xs text-text-muted">Failed</div>
                                        </div>
                                    </div>
                                    {outreach.campaignResult.results && (
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {outreach.campaignResult.results.map((r: OutreachResult, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-xs py-1">
                                                    {r.success ? (
                                                        <CheckCircle className="w-3 h-3 text-accent-success flex-shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3 text-accent-danger flex-shrink-0" />
                                                    )}
                                                    <span className="text-text-primary truncate">{r.leadName}</span>
                                                    {r.error && <span className="text-accent-danger ml-auto text-xs">{r.error}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ---- HISTORY TAB ---- */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {outreach.loadingHistory ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                                </div>
                            ) : outreach.history ? (
                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                            <div className="text-2xl font-bold text-accent-primary">{outreach.history.stats.sentToday}</div>
                                            <div className="text-xs text-text-muted mt-1">Sent Today</div>
                                        </div>
                                        <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                            <div className="text-2xl font-bold text-text-primary">{outreach.history.stats.sentThisWeek}</div>
                                            <div className="text-xs text-text-muted mt-1">This Week</div>
                                        </div>
                                        <div className="bg-bg-secondary rounded-xl p-4 border border-border text-center">
                                            <div className="text-2xl font-bold text-text-muted">{outreach.history.stats.totalSent}</div>
                                            <div className="text-xs text-text-muted mt-1">All Time</div>
                                        </div>
                                    </div>

                                    {/* Recent Messages */}
                                    <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                                        <h3 className="text-sm font-semibold text-text-primary">Recent Outreach</h3>
                                        {outreach.history.messages.length === 0 ? (
                                            <div className="text-center py-4 text-text-muted text-sm">
                                                No outreach emails sent yet. Start a campaign!
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                                {outreach.history.messages.slice(0, 30).map((msg: any) => (
                                                    <div key={msg.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary text-sm">
                                                        <CheckCircle className="w-3.5 h-3.5 text-accent-success flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-text-primary truncate">
                                                                {msg.lead?.name || 'Unknown'} — {msg.subject || 'No subject'}
                                                            </div>
                                                            <div className="text-xs text-text-muted">
                                                                {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                        <span className={`px-1.5 py-0.5 rounded text-xs ${msg.status === 'sent' ? 'bg-accent-success/10 text-accent-success' : 'bg-accent-danger/10 text-accent-danger'
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
        </div>
    )
}

export default AutomationView
