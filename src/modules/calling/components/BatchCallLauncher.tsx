import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    PhoneCall, Users, FileText, Loader2, Play, Pause, Square,
    CheckCircle, XCircle, SkipForward, Clock, Zap, ChevronDown
} from 'lucide-react'
import { ENDPOINTS, WS_SERVER } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'sonner'

interface BatchCallLauncherProps {
    onAgentSpawned?: (agentId: string) => void
}

export function BatchCallLauncher({ onAgentSpawned }: BatchCallLauncherProps) {
    const { user } = useAuth()

    // Lead selection
    const [leads, setLeads] = useState<any[]>([])
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
    const [leadsLoading, setLeadsLoading] = useState(false)
    const [filterIndustry, setFilterIndustry] = useState('')
    const [filterHasPhone, setFilterHasPhone] = useState(true)

    // Script selection
    const [scripts, setScripts] = useState<any[]>([])
    const [selectedScriptId, setSelectedScriptId] = useState('')
    const [scriptsLoading, setScriptsLoading] = useState(false)

    // Agent config
    const [agentName, setAgentName] = useState('')
    const [delayBetweenCalls, setDelayBetweenCalls] = useState(5)

    // Batch state
    const [launching, setLaunching] = useState(false)
    const [spawnedAgent, setSpawnedAgent] = useState<any>(null)

    // Agent tracking state
    const [agentStatus, setAgentStatus] = useState<string>('')
    const [agentStats, setAgentStats] = useState<any>(null)
    const wsRef = useRef<WebSocket | null>(null)

    // Fetch leads with phone numbers
    const fetchLeads = useCallback(async () => {
        if (!user) return
        setLeadsLoading(true)
        try {
            const res = await fetch(`${ENDPOINTS.LEADS}`, {
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            const data = await res.json()
            const allLeads = Array.isArray(data) ? data : data.leads || []
            setLeads(filterHasPhone ? allLeads.filter((l: any) => l.phone) : allLeads)
        } catch { /* ignore */ }
        finally { setLeadsLoading(false) }
    }, [user, filterHasPhone])

    // Fetch scripts
    const fetchScripts = useCallback(async () => {
        if (!user) return
        setScriptsLoading(true)
        try {
            const res = await fetch(ENDPOINTS.CALL_SCRIPTS_LIST, {
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            const data = await res.json()
            setScripts(Array.isArray(data) ? data : data.scripts || [])
        } catch { /* ignore */ }
        finally { setScriptsLoading(false) }
    }, [user])

    useEffect(() => {
        fetchLeads()
        fetchScripts()
    }, [fetchLeads, fetchScripts])

    // Industry options from leads
    const industries = [...new Set(leads.map(l => l.industry).filter(Boolean))]

    const filteredLeads = filterIndustry
        ? leads.filter(l => l.industry === filterIndustry)
        : leads

    // Selection helpers
    function toggleLead(id: string) {
        setSelectedLeadIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function selectAll() {
        if (selectedLeadIds.size === filteredLeads.length) {
            setSelectedLeadIds(new Set())
        } else {
            setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)))
        }
    }

    // Launch batch
    async function handleLaunch() {
        if (!user || selectedLeadIds.size === 0) return
        setLaunching(true)
        try {
            const res = await fetch(ENDPOINTS.AGENTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify({
                    name: agentName || `Batch ${new Date().toLocaleDateString()}`,
                    scriptId: selectedScriptId || undefined,
                    leadIds: Array.from(selectedLeadIds),
                    config: { delayBetweenCalls }
                })
            })
            const data = await res.json()
            if (data.id || data.agent?.id) {
                const agentId = data.id || data.agent?.id
                setSpawnedAgent(data.agent || data)
                toast.success(`🚀 Agent spawned with ${selectedLeadIds.size} leads`)
                onAgentSpawned?.(agentId)

                // Auto-start the agent
                await fetch(`${ENDPOINTS.AGENTS}/${agentId}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
                })
                setAgentStatus('running')
                connectWebSocket(agentId)
            } else {
                toast.error('Failed to spawn agent')
            }
        } catch {
            toast.error('Failed to launch batch calls')
        } finally {
            setLaunching(false)
        }
    }

    // WebSocket for live tracking
    function connectWebSocket(agentId: string) {
        if (!user) return
        const ws = new WebSocket(`${WS_SERVER}/ws/calls`)
        wsRef.current = ws

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'auth', userId: user.id }))
            ws.send(JSON.stringify({ type: 'subscribe:agent', agentId }))
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === 'agent:status') {
                    setAgentStatus(msg.status || '')
                    if (msg.stats) setAgentStats(msg.stats)
                }
            } catch { /* ignore */ }
        }

        ws.onclose = () => {
            wsRef.current = null
        }
    }

    useEffect(() => {
        return () => { wsRef.current?.close() }
    }, [])

    // Agent control actions
    async function controlAgent(action: string) {
        if (!spawnedAgent?.id || !user) return
        try {
            await fetch(`${ENDPOINTS.AGENTS}/${spawnedAgent.id}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }
            })
            if (action === 'stop') setAgentStatus('completed')
            else if (action === 'pause') setAgentStatus('paused')
            else if (action === 'resume') setAgentStatus('running')
            toast.success(`Agent ${action}ed`)
        } catch { toast.error(`Failed to ${action} agent`) }
    }

    // If agent is spawned, show progress tracker
    if (spawnedAgent) {
        return (
            <div className="space-y-4">
                {/* Agent Header */}
                <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">{spawnedAgent.name || 'Batch Agent'}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${agentStatus === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                                    agentStatus === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                                        agentStatus === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-gray-500/10 text-gray-400'
                                }`}>
                                {agentStatus || 'starting'}
                            </span>
                        </div>
                        <div className="flex gap-1.5">
                            {agentStatus === 'running' && (
                                <button onClick={() => controlAgent('pause')} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                                    <Pause className="w-4 h-4" />
                                </button>
                            )}
                            {agentStatus === 'paused' && (
                                <button onClick={() => controlAgent('resume')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                    <Play className="w-4 h-4" />
                                </button>
                            )}
                            {(agentStatus === 'running' || agentStatus === 'paused') && (
                                <button onClick={() => controlAgent('stop')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                    <Square className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    {agentStats && (
                        <>
                            <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
                                <div
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${agentStats.total ? ((agentStats.completed || 0) / agentStats.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-lg font-bold text-emerald-400">{agentStats.booked || 0}</div>
                                    <div className="text-[10px] text-text-muted">Booked</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-amber-400">{agentStats.followUp || 0}</div>
                                    <div className="text-[10px] text-text-muted">Follow-up</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-400">{agentStats.skipped || 0}</div>
                                    <div className="text-[10px] text-text-muted">Skipped</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-text-muted">{agentStats.remaining || 0}</div>
                                    <div className="text-[10px] text-text-muted">Remaining</div>
                                </div>
                            </div>
                        </>
                    )}

                    {!agentStats && (
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Initializing agent...
                        </div>
                    )}
                </div>

                {/* New Batch button */}
                {(agentStatus === 'completed' || agentStatus === 'stopped') && (
                    <button
                        onClick={() => { setSpawnedAgent(null); setAgentStats(null); setAgentStatus('') }}
                        className="w-full py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        Launch New Batch
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Lead Selection */}
            <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Select Leads ({filteredLeads.length} available)
                    </h3>
                    <div className="flex gap-2">
                        <select
                            value={filterIndustry}
                            onChange={e => setFilterIndustry(e.target.value)}
                            className="px-2 py-1 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs"
                        >
                            <option value="">All Industries</option>
                            {industries.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                        <button onClick={selectAll} className="text-xs text-cyan-400 hover:text-cyan-300">
                            {selectedLeadIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filterHasPhone}
                        onChange={e => setFilterHasPhone(e.target.checked)}
                        className="rounded border-border accent-cyan-500"
                    />
                    Only leads with phone numbers
                </label>

                {leadsLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-6 text-text-muted text-sm">
                        No leads with phone numbers found
                    </div>
                ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredLeads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => toggleLead(lead.id)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm ${selectedLeadIds.has(lead.id)
                                        ? 'bg-cyan-500/5 border border-cyan-500/30'
                                        : 'hover:bg-bg-tertiary border border-transparent'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedLeadIds.has(lead.id)}
                                    onChange={() => { }}
                                    className="accent-cyan-500"
                                />
                                <span className="font-medium text-text-primary flex-1 truncate">{lead.name}</span>
                                <span className="text-xs text-text-muted">{lead.phone}</span>
                                {lead.industry && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-bg-tertiary text-text-muted">
                                        {lead.industry}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Script & Config */}
            <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Configuration
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Agent Name (optional)</label>
                        <input
                            type="text"
                            value={agentName}
                            onChange={e => setAgentName(e.target.value)}
                            placeholder="Auto-generated if empty"
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Call Script</label>
                        <select
                            value={selectedScriptId}
                            onChange={e => setSelectedScriptId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                            <option value="">Default script</option>
                            {scripts.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-text-muted mb-1 block">Delay between calls</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="1"
                            max="60"
                            value={delayBetweenCalls}
                            onChange={e => setDelayBetweenCalls(Number(e.target.value))}
                            className="flex-1 accent-cyan-500"
                        />
                        <span className="text-sm text-text-primary w-12 text-right">{delayBetweenCalls}s</span>
                    </div>
                </div>
            </div>

            {/* Launch Button */}
            <button
                onClick={handleLaunch}
                disabled={launching || selectedLeadIds.size === 0}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
                {launching ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Spawning Agent...
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4" />
                        Launch Batch Calls ({selectedLeadIds.size} leads)
                    </>
                )}
            </button>
        </div>
    )
}

export default BatchCallLauncher
