
import { useState, useEffect } from 'react'
import { Phone, Mail, Bell, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getAuthHeaders } from '../../../utils/authHeaders'

interface ActivityItem {
    id: string
    type: 'call' | 'email' | 'notification'
    icon: string
    title: string
    subtitle: string
    timestamp: string
    metadata: Record<string, unknown>
}

const iconMap = {
    call: Phone,
    email: Mail,
    notification: Bell
}

const colorMap = {
    call: 'text-blue-400 bg-blue-500/10',
    email: 'text-purple-400 bg-purple-500/10',
    notification: 'text-amber-400 bg-amber-500/10'
}

export function LeadActivityTimeline({ leadId }: { leadId: string }) {
    const [items, setItems] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (!leadId || !user?.id) return
        setLoading(true)

        fetch(ENDPOINTS.LEAD_ACTIVITY(leadId), {
            headers: getAuthHeaders()
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => setItems(data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [leadId, user?.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-text-muted text-sm">
                No activity recorded yet
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {items.map((item, i) => {
                const Icon = iconMap[item.type] || Bell
                const color = colorMap[item.type] || 'text-text-muted bg-bg-tertiary'

                return (
                    <div key={item.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-bg-tertiary transition-colors">
                        {/* Timeline connector */}
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                                <Icon size={14} />
                            </div>
                            {i < items.length - 1 && (
                                <div className="w-px h-6 bg-border mt-1" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{item.title}</p>
                            {item.subtitle && (
                                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{item.subtitle}</p>
                            )}
                            <p className="text-[10px] text-text-muted/60 mt-1">
                                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
