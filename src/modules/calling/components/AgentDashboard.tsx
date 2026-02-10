import { useState } from 'react'
import { Bot, Play, Pause, Square, Plus, Trash2, Activity, Clock, CheckCircle2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Agent, FlowConfig } from '../hooks/useAgents'
import type { CallScript } from '../hooks/useCalls'
import { useAgentFlow } from '../hooks/useAgentFlow'
import { useAuth } from '../../../hooks/useAuth'

interface Props {
    agents: Agent[]
    selectedAgent: Agent | null
    flowConfig: FlowConfig | null
    loading: boolean
    scripts: CallScript[]
    onSelectAgent: (id: string) => void
    onStartAgent: (id: string) => void
    onPauseAgent: (id: string) => void
    onResumeAgent: (id: string) => void
    onStopAgent: (id: string) => void
    onSpawnAgent: (params: { name?: string; scriptId?: string; leadIds: string[]; config?: any }) => Promise<any>
    onDeleteAgent: (id: string) => Promise<boolean>
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
    idle: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Clock },
    running: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: Activity },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Pause },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle2 },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: Square },
}

export function AgentDashboard({
    agents, selectedAgent, flowConfig, loading, scripts,
    onSelectAgent, onStartAgent, onPauseAgent, onResumeAgent, onStopAgent, onSpawnAgent, onDeleteAgent
}: Props) {
    const { user } = useAuth()
    const [showSpawn, setShowSpawn] = useState(false)
    const [spawnName, setSpawnName] = useState('')
    const [spawnScriptId, setSpawnScriptId] = useState('')
    const [spawnLeadIds, setSpawnLeadIds] = useState('')

    const agentFlow = useAgentFlow(
        selectedAgent?.id || null,
        user?.id || null
    )

    const handleSpawn = async () => {
        const leadIds = spawnLeadIds.split(',').map(s => s.trim()).filter(Boolean)
        if (leadIds.length === 0) {
            toast.error('Enter at least one lead ID')
            return
        }
        const agent = await onSpawnAgent({
            name: spawnName || undefined,
            scriptId: spawnScriptId || undefined,
            leadIds,
        })
        if (agent) {
            toast.success(`🤖 Agent "${agent.name}" spawned!`)
            setShowSpawn(false)
            setSpawnName('')
            setSpawnScriptId('')
            setSpawnLeadIds('')
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Agent List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Bot size={14} className="text-cyan-500" />
                        Agents
                    </h3>
                    <button
                        onClick={() => setShowSpawn(!showSpawn)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500"
                    >
                        <Plus size={12} />
                        New Agent
                    </button>
                </div>

                {/* Spawn Form */}
                {showSpawn && (
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                        <input
                            type="text"
                            value={spawnName}
                            onChange={e => setSpawnName(e.target.value)}
                            placeholder="Agent name (optional)"
                            className="w-full text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50"
                        />
                        <select
                            value={spawnScriptId}
                            onChange={e => setSpawnScriptId(e.target.value)}
                            className="w-full text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-500/50"
                        >
                            <option value="">Select script...</option>
                            {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input
                            type="text"
                            value={spawnLeadIds}
                            onChange={e => setSpawnLeadIds(e.target.value)}
                            placeholder="Lead IDs (comma separated)"
                            className="w-full text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500/50"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleSpawn} className="flex-1 py-2 bg-cyan-500 text-white text-xs font-semibold rounded-lg hover:bg-cyan-400">
                                🚀 Spawn
                            </button>
                            <button onClick={() => setShowSpawn(false)} className="px-3 py-2 text-xs text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Agent List */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-bg-secondary rounded-xl border border-border animate-pulse" />
                        ))}
                    </div>
                ) : agents.length === 0 ? (
                    <div className="text-center py-8 bg-bg-secondary rounded-xl border border-border">
                        <Bot size={24} className="mx-auto text-text-muted/30 mb-2" />
                        <p className="text-xs text-text-muted">No agents yet</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {agents.map(agent => {
                            const status = STATUS_STYLES[agent.status] || STATUS_STYLES.idle
                            const StatusIcon = status.icon
                            const isSelected = selectedAgent?.id === agent.id
                            const progress = agent.completedLeads.length + agent.leadQueue.length > 0
                                ? (agent.completedLeads.length / (agent.completedLeads.length + agent.leadQueue.length)) * 100
                                : 0

                            return (
                                <div
                                    key={agent.id}
                                    onClick={() => onSelectAgent(agent.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                            ? 'bg-cyan-500/5 border-cyan-500/30'
                                            : 'bg-bg-secondary border-border hover:border-border/80'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot size={14} className={isSelected ? 'text-cyan-400' : 'text-text-muted'} />
                                        <span className="text-xs font-medium text-text-primary flex-1 truncate">{agent.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${status.bg} ${status.text} font-medium flex items-center gap-0.5`}>
                                            <StatusIcon size={9} />
                                            {agent.status}
                                        </span>
                                    </div>
                                    {/* Progress */}
                                    <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[9px] text-text-muted">{agent.stats?.totalCalls || 0} calls</span>
                                        <span className="text-[9px] text-emerald-400">{agent.stats?.booked || 0} booked</span>
                                        <span className="text-[9px] text-text-muted ml-auto">{agent.leadQueue.length} remaining</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Right Panel: Agent Detail */}
            <div className="lg:col-span-2">
                {selectedAgent ? (
                    <div className="space-y-4">
                        {/* Agent Header */}
                        <div className="bg-bg-secondary rounded-xl border border-border p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Bot size={16} className="text-cyan-400" />
                                    <h3 className="text-sm font-semibold text-text-primary">{selectedAgent.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedAgent.status]?.bg} ${STATUS_STYLES[selectedAgent.status]?.text} font-medium`}>
                                        {selectedAgent.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {selectedAgent.status === 'idle' && (
                                        <button onClick={() => onStartAgent(selectedAgent.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-lg hover:bg-emerald-400 flex items-center gap-1">
                                            <Play size={10} /> Start
                                        </button>
                                    )}
                                    {selectedAgent.status === 'running' && (
                                        <button onClick={() => onPauseAgent(selectedAgent.id)} className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-semibold rounded-lg hover:bg-amber-400 flex items-center gap-1">
                                            <Pause size={10} /> Pause
                                        </button>
                                    )}
                                    {selectedAgent.status === 'paused' && (
                                        <button onClick={() => onResumeAgent(selectedAgent.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-lg hover:bg-emerald-400 flex items-center gap-1">
                                            <Play size={10} /> Resume
                                        </button>
                                    )}
                                    {(selectedAgent.status === 'running' || selectedAgent.status === 'paused') && (
                                        <button onClick={() => onStopAgent(selectedAgent.id)} className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-semibold rounded-lg hover:bg-red-400 flex items-center gap-1">
                                            <Square size={10} /> Stop
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            const ok = await onDeleteAgent(selectedAgent.id)
                                            if (ok) toast.success('Agent deleted')
                                        }}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-bg-tertiary/50 rounded-lg p-2 text-center">
                                    <p className="text-sm font-bold text-text-primary">{selectedAgent.stats?.totalCalls || 0}</p>
                                    <p className="text-[9px] text-text-muted">Calls</p>
                                </div>
                                <div className="bg-emerald-500/5 rounded-lg p-2 text-center">
                                    <p className="text-sm font-bold text-emerald-400">{selectedAgent.stats?.booked || 0}</p>
                                    <p className="text-[9px] text-text-muted">Booked</p>
                                </div>
                                <div className="bg-bg-tertiary/50 rounded-lg p-2 text-center">
                                    <p className="text-sm font-bold text-text-primary">{selectedAgent.stats?.skipped || 0}</p>
                                    <p className="text-[9px] text-text-muted">Skipped</p>
                                </div>
                                <div className="bg-bg-tertiary/50 rounded-lg p-2 text-center">
                                    <p className="text-sm font-bold text-text-primary">{selectedAgent.leadQueue.length}</p>
                                    <p className="text-[9px] text-text-muted">Remaining</p>
                                </div>
                            </div>

                            {/* Current Lead */}
                            {selectedAgent.currentLeadName && (
                                <div className="mt-3 px-3 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                                    <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                                        <Users size={10} /> Currently talking to: {selectedAgent.currentLeadName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Step Machine Visualization */}
                        <div className="bg-bg-secondary rounded-xl border border-border p-4">
                            <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <Activity size={12} className="text-cyan-500" />
                                Agent Flow
                                {agentFlow.connected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                            </h4>

                            {/* Simple step visualization (non-React-Flow fallback) */}
                            {flowConfig ? (
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(flowConfig.steps).map(([stepId, step]) => {
                                        const isActive = selectedAgent.currentStep === stepId
                                        const isCompleted = selectedAgent.completedLeads.length > 0 && ['completed', 'notes-generated'].includes(stepId)
                                        const color = flowConfig.colors[stepId] || '#475569'

                                        return (
                                            <div
                                                key={stepId}
                                                className={`px-3 py-2 rounded-lg border text-[10px] font-medium transition-all ${isActive
                                                        ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                                        : 'border-border/50'
                                                    }`}
                                                style={{
                                                    backgroundColor: isActive ? color + '20' : 'var(--bg-tertiary)',
                                                    color: isActive ? color : 'var(--text-muted)',
                                                    borderColor: isActive ? color : undefined,
                                                    boxShadow: isActive ? `0 0 12px ${color}30` : undefined
                                                }}
                                            >
                                                {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: color }} />}
                                                {step.label}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-text-muted">Loading flow config...</p>
                            )}
                        </div>

                        {/* Activity Log */}
                        <div className="bg-bg-secondary rounded-xl border border-border p-4">
                            <h4 className="text-xs font-semibold text-text-primary mb-3">Activity Log</h4>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {agentFlow.logs.length === 0 ? (
                                    <p className="text-xs text-text-muted text-center py-4">No activity yet</p>
                                ) : (
                                    agentFlow.logs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-2 text-[10px] py-1">
                                            <span className="text-text-muted whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className={`${log.level === 'error' ? 'text-red-400' :
                                                    log.level === 'warn' ? 'text-amber-400' : 'text-text-primary'
                                                }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 bg-bg-secondary rounded-xl border border-border">
                        <div className="text-center">
                            <Bot size={32} className="mx-auto text-text-muted/30 mb-3" />
                            <p className="text-xs text-text-muted">Select an agent to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
