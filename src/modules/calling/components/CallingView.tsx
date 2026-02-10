import { Phone, BarChart3, ScrollText, Bot, Zap, PieChart, Settings, Keyboard } from 'lucide-react'
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
import { useCalls } from '../hooks/useCalls'
import { useCallScripts } from '../hooks/useCallScripts'
import { useAgents } from '../hooks/useAgents'

const TABS = [
    { id: 'overview', label: 'Overview', icon: Phone, path: '/calling' },
    { id: 'calls', label: 'Call Logs', icon: BarChart3, path: '/calling' },
    { id: 'scripts', label: 'Scripts', icon: ScrollText, path: '/calling' },
    { id: 'agents', label: 'AI Agents', icon: Bot, path: '/calling/agents' },
    { id: 'batch', label: 'Batch Calls', icon: Zap, path: '/calling' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, path: '/calling' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/calling' },
]

export function CallingView() {
    const location = useLocation()
    const navigate = useNavigate()
    const isAgentsPath = location.pathname === '/calling/agents'
    const [activeTab, setActiveTab] = useState(isAgentsPath ? 'agents' : 'overview')

    const callsHook = useCalls()
    const scriptsHook = useCallScripts()
    const agentsHook = useAgents()

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Phone className="w-5 h-5 text-cyan-500" />
                        AI Calling System
                    </h1>
                    <p className="text-xs text-text-muted mt-0.5">AI-powered outbound calling & lead engagement</p>
                </div>
                <button
                    onClick={() => setShowShortcuts(prev => !prev)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary border border-border text-[10px] text-text-muted hover:text-text-primary transition-colors"
                    title="Keyboard shortcuts (?)"
                >
                    <Keyboard className="w-3 h-3" />
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

            {/* Tab Bar */}
            <div className="flex items-center gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-hide">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[1px] ${isActive
                                ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5'
                                : 'text-text-muted border-transparent hover:text-text-primary hover:bg-bg-tertiary'
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

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

                {activeTab === 'analytics' && (
                    <CallingAnalytics />
                )}

                {activeTab === 'settings' && (
                    <CallingSettings />
                )}
            </div>
        </div>
    )
}

export default CallingView
