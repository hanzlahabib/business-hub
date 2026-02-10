import { Phone, PhoneOff, ScrollText, Bot, Zap, BarChart3 } from 'lucide-react'

interface EmptyStateProps {
    type: 'calls' | 'scripts' | 'agents' | 'batch' | 'analytics'
    onAction?: () => void
}

const EMPTY_STATES: Record<string, { icon: any; title: string; description: string; action: string; gradient: string }> = {
    calls: {
        icon: Phone,
        title: 'No calls yet',
        description: 'Start your first AI-powered call to a lead. Track outcomes, listen to recordings, and analyze performance.',
        action: 'Make First Call',
        gradient: 'from-cyan-500/20 to-blue-500/20',
    },
    scripts: {
        icon: ScrollText,
        title: 'No scripts created',
        description: 'Create a call script manually or use AI to generate one based on your industry and goals.',
        action: 'Create Script',
        gradient: 'from-violet-500/20 to-purple-500/20',
    },
    agents: {
        icon: Bot,
        title: 'No AI agents spawned',
        description: 'Spawn an AI agent to automate outbound calling. Agents handle the conversation, negotiate, and book meetings.',
        action: 'Spawn Agent',
        gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    batch: {
        icon: Zap,
        title: 'No batch runs yet',
        description: 'Select multiple leads and launch a batch calling campaign. The AI agent will call each lead sequentially.',
        action: 'Launch Batch',
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
    analytics: {
        icon: BarChart3,
        title: 'No analytics data',
        description: 'Analytics will populate after you make your first calls. Track conversion rates, outcomes, and agent performance.',
        action: 'Go to Overview',
        gradient: 'from-rose-500/20 to-pink-500/20',
    },
}

export function CallingEmptyState({ type, onAction }: EmptyStateProps) {
    const config = EMPTY_STATES[type]
    if (!config) return null
    const Icon = config.icon

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-4`}>
                <Icon className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{config.title}</h3>
            <p className="text-xs text-text-muted max-w-xs mb-4">{config.description}</p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                    {config.action}
                </button>
            )}
        </div>
    )
}

export default CallingEmptyState
