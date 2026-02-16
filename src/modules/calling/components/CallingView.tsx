import { Phone, BarChart3, ScrollText, Bot, Zap, PieChart, Settings, Keyboard, Activity, CalendarDays } from 'lucide-react'
import { CalendarFilters as CalendarFiltersType, CalendarItem } from '../../../hooks/useCalendarItems'
import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CallStatsCards } from './CallStatsCards'
import { RecentCallsList } from './RecentCallsList'
import { QuickDialer } from './QuickDialer'
import { CallLogTable } from './CallLogTable'
import { ScriptList } from './ScriptList'
import { AgentDashboard } from './AgentDashboard'
import { BatchCallLauncher } from './BatchCallLauncher'
import { CallingAnalytics } from './CallingAnalytics'
import { CallingSettings } from './CallingSettings'
import { CallActivityLog } from './CallActivityLog'
import { CallDetailPanel } from './CallDetailPanel'
import { LiveCallBanner } from './LiveCallBanner'
import { CallingSchedule } from './CallingSchedule'
import { useCalls } from '../hooks/useCalls'
import { useCallScripts } from '../hooks/useCallScripts'
import { useAgents } from '../hooks/useAgents'

const TABS = [
    { id: 'schedule', label: 'Schedule', icon: CalendarDays, path: '/calling' },
    { id: 'overview', label: 'Overview', icon: Phone, path: '/calling' },
    { id: 'calls', label: 'Call Logs', icon: BarChart3, path: '/calling' },
    { id: 'scripts', label: 'Scripts', icon: ScrollText, path: '/calling' },
    { id: 'agents', label: 'AI Agents', icon: Bot, path: '/calling/agents' },
    { id: 'batch', label: 'Batch Calls', icon: Zap, path: '/calling' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/calling' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, path: '/calling' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/calling' },
]

interface ActiveCall {
    id: string
    leadId: string
    leadName: string
    status: string
    startedAt: string
}

interface CallingViewProps {
    activeCalls?: ActiveCall[]
    contents?: any[]
    calendarItems?: CalendarItem[]
    calendarFilters?: CalendarFiltersType
    onAddContent?: (date: string) => void
    onEditContent?: (content: any) => void
    onDeleteContent?: (id: string) => void
    onDateChange?: (id: string, date: string) => void
    onItemDateChange?: (item: CalendarItem, date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: CalendarItem) => void
}

export function CallingView({
    activeCalls = [],
    contents = [],
    calendarItems = [],
    calendarFilters,
    onAddContent,
    onEditContent,
    onDeleteContent,
    onDateChange,
    onItemDateChange,
    onOpenDetail,
    onItemClick
}: CallingViewProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const isAgentsPath = location.pathname === '/calling/agents'
    const [activeTab, setActiveTab] = useState(isAgentsPath ? 'agents' : 'schedule')

    const [selectedCallId, setSelectedCallId] = useState<string | null>(null)

    const callsHook = useCalls()
    const scriptsHook = useCallScripts()
    const agentsHook = useAgents()

    // Listen for global call update events (from App-level WebSocket) — silent refresh
    useEffect(() => {
        const handler = () => {
            callsHook.fetchCalls({ silent: true })
            callsHook.fetchStats({ silent: true })
        }
        window.addEventListener('call:updated', handler)
        return () => window.removeEventListener('call:updated', handler)
    }, [callsHook.fetchCalls, callsHook.fetchStats])

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        const tab = TABS.find(t => t.id === tabId)
        if (tab) navigate(tab.path)
    }

    // Keyboard shortcuts
    const [showShortcuts, setShowShortcuts] = useState(false)

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger in input/textarea
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

        switch (e.key.toLowerCase()) {
            case 'n': handleTabChange('overview'); break
            case 's': handleTabChange('scripts'); break
            case 'a': handleTabChange('agents'); break
            case 'b': handleTabChange('batch'); break
            case 'escape': handleTabChange('overview'); break
            case '?': setShowShortcuts(prev => !prev); break
        }
    }, [handleTabChange])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
        <div className="h-full flex flex-col">
            {/* Stitch Header */}
            <div className="px-8 pt-6 pb-2 shrink-0">
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Phone className="w-6 h-6 text-cyan-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">AI Calling System</h1>
                        </div>
                        <button
                            onClick={() => setShowShortcuts(prev => !prev)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs text-text-muted hover:text-text-primary transition-colors"
                            title="Keyboard shortcuts (?)"
                        >
                            <Keyboard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Shortcuts</span>
                        </button>
                    </div>

                    {/* Keyboard Shortcuts Panel */}
                    {showShortcuts && (
                        <div className="bg-bg-secondary rounded-xl p-3 border border-border grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                                ['N', 'New Call (Overview)'],
                                ['S', 'Scripts'],
                                ['A', 'AI Agents'],
                                ['B', 'Batch Calls'],
                                ['Esc', 'Back to Overview'],
                                ['?', 'Toggle Shortcuts'],
                            ].map(([key, label]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border text-text-primary font-mono text-[10px]">{key}</kbd>
                                    <span className="text-text-muted">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stitch Tab Bar */}
                    <div className="flex items-center border-b border-border overflow-x-auto scrollbar-hide">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                        ? 'text-cyan-400 border-cyan-400'
                                        : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className={`flex-1 overflow-auto ${activeTab === 'schedule' ? '' : 'px-8 pb-8 space-y-6'}`}>

                {/* Schedule Tab — full bleed, no padding */}
                {activeTab === 'schedule' && (
                    <CallingSchedule
                        contents={contents}
                        items={calendarItems}
                        calendarFilters={calendarFilters}
                        onAddContent={onAddContent}
                        onEditContent={onEditContent}
                        onDeleteContent={onDeleteContent}
                        onDateChange={onDateChange}
                        onItemDateChange={onItemDateChange}
                        onOpenDetail={onOpenDetail}
                        onItemClick={onItemClick}
                    />
                )}

                {/* Live Call Banner — non-schedule tabs only */}
                {activeTab !== 'schedule' && (
                    <LiveCallBanner activeCalls={activeCalls} onViewCall={setSelectedCallId} />
                )}

                {/* Tab Content */}
                <div>
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <CallStatsCards stats={callsHook.stats} loading={callsHook.loading} />
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <RecentCallsList
                                        calls={callsHook.calls.slice(0, 10)}
                                        loading={callsHook.loading}
                                        onCallSelect={setSelectedCallId}
                                    />
                                </div>
                                <div>
                                    <QuickDialer
                                        scripts={scriptsHook.scripts}
                                        onInitiateCall={callsHook.initiateCall}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'calls' && (
                        <CallLogTable
                            calls={callsHook.calls}
                            loading={callsHook.loading}
                            total={callsHook.total}
                            onRefresh={callsHook.fetchCalls}
                            onCallSelect={setSelectedCallId}
                        />
                    )}

                    {activeTab === 'scripts' && (
                        <ScriptList
                            scripts={scriptsHook.scripts}
                            loading={scriptsHook.loading}
                            generating={scriptsHook.generating}
                            onCreateScript={scriptsHook.createScript}
                            onUpdateScript={scriptsHook.updateScript}
                            onDeleteScript={scriptsHook.deleteScript}
                            onGenerateScript={scriptsHook.generateScript}
                        />
                    )}

                    {activeTab === 'agents' && (
                        <AgentDashboard
                            agents={agentsHook.agents}
                            selectedAgent={agentsHook.selectedAgent}
                            flowConfig={agentsHook.flowConfig}
                            loading={agentsHook.loading}
                            onSelectAgent={agentsHook.fetchAgent}
                            onStartAgent={agentsHook.startAgent}
                            onPauseAgent={agentsHook.pauseAgent}
                            onResumeAgent={agentsHook.resumeAgent}
                            onStopAgent={agentsHook.stopAgent}
                            onSpawnAgent={agentsHook.spawnAgent}
                            onDeleteAgent={agentsHook.deleteAgent}
                            scripts={scriptsHook.scripts}
                        />
                    )}

                    {activeTab === 'batch' && (
                        <BatchCallLauncher />
                    )}

                    {activeTab === 'activity' && (
                        <CallActivityLog onCallSelect={setSelectedCallId} />
                    )}

                    {activeTab === 'analytics' && (
                        <CallingAnalytics />
                    )}

                    {activeTab === 'settings' && (
                        <CallingSettings />
                    )}
                </div>

                {/* Call Detail Panel */}
                <CallDetailPanel
                    callId={selectedCallId}
                    isOpen={!!selectedCallId}
                    onClose={() => setSelectedCallId(null)}
                />
            </div>
        </div>
    )
}

export default CallingView
