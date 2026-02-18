import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Users, Mail, ArrowRight, Search, Send, TrendingUp } from 'lucide-react'
import { API_SERVER } from '../../../config/api'
import { getJsonAuthHeaders } from '../../../utils/authHeaders'

interface WidgetStats {
    uncontactedCount: number
    totalSent: number
    sentToday: number
}

export function AutomationQuickWidget() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<WidgetStats>({ uncontactedCount: 0, totalSent: 0, sentToday: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const [uncontactedRes, historyRes] = await Promise.allSettled([
                    fetch(`${API_SERVER}/api/outreach/uncontacted`, { headers: getJsonAuthHeaders() }),
                    fetch(`${API_SERVER}/api/outreach/history`, { headers: getJsonAuthHeaders() })
                ])

                const newStats: WidgetStats = { uncontactedCount: 0, totalSent: 0, sentToday: 0 }

                if (uncontactedRes.status === 'fulfilled') {
                    const data = await uncontactedRes.value.json()
                    if (data.success) newStats.uncontactedCount = data.leads?.length || 0
                }
                if (historyRes.status === 'fulfilled') {
                    const data = await historyRes.value.json()
                    if (data.success && data.stats) {
                        newStats.totalSent = data.stats.totalSent || 0
                        newStats.sentToday = data.stats.sentToday || 0
                    }
                }

                setStats(newStats)
            } catch { }
            setLoading(false)
        }
        fetchStats()
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary rounded-xl border border-border overflow-hidden"
        >
            {/* Header strip */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-accent-primary/8 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-primary/15">
                        <Zap className="w-3.5 h-3.5 text-accent-primary" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">Automation</span>
                </div>
                <button
                    onClick={() => navigate('/automation')}
                    className="flex items-center gap-1 text-xs text-accent-primary hover:opacity-80 transition-opacity font-medium"
                >
                    Open Hub <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-border">
                <div className="bg-bg-secondary px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-accent-primary" />
                    </div>
                    <div className="text-base font-bold text-text-primary">
                        {loading ? '—' : stats.uncontactedCount}
                    </div>
                    <div className="text-[10px] text-text-muted">Uncontacted</div>
                </div>
                <div className="bg-bg-secondary px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Mail className="w-3 h-3 text-accent-success" />
                    </div>
                    <div className="text-base font-bold text-text-primary">
                        {loading ? '—' : stats.sentToday}
                    </div>
                    <div className="text-[10px] text-text-muted">Sent Today</div>
                </div>
                <div className="bg-bg-secondary px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-text-muted" />
                    </div>
                    <div className="text-base font-bold text-text-primary">
                        {loading ? '—' : stats.totalSent}
                    </div>
                    <div className="text-[10px] text-text-muted">All Time</div>
                </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-2 p-3">
                <button
                    onClick={() => navigate('/automation')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-bg-tertiary hover:bg-accent-primary/10 text-text-primary text-xs font-medium transition-all border border-transparent hover:border-accent-primary/20"
                >
                    <Search className="w-3 h-3" />
                    Find Leads
                </button>
                <button
                    onClick={() => navigate('/automation')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-medium transition-all border border-accent-primary/20"
                >
                    <Send className="w-3 h-3" />
                    Campaign
                </button>
            </div>
        </motion.div>
    )
}

export default AutomationQuickWidget
