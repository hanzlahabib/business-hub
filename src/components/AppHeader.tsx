import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Sun, Moon, Settings, LogOut, Bell, Check, Search, Command, ChevronDown } from 'lucide-react'
import { SidebarToggleButton } from '../shared/components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { GlobalCallIndicator } from './GlobalCallIndicator'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { API_SERVER } from '../config/api'
import { getAuthHeaders } from '../utils/authHeaders'

interface AppHeaderProps {
    theme: 'light' | 'dark'
    onToggleTheme: () => void
    onToggleSidebar: () => void
    onOpenSettings: () => void
    activeCalls?: Array<{ id: string; leadId: string; leadName: string; status: string; startedAt: string; outcome?: string; completedAt?: string }>
}

export const AppHeader = memo(function AppHeader({
    theme,
    onToggleTheme,
    onToggleSidebar,
    onOpenSettings,
    activeCalls = []
}: AppHeaderProps) {
    const { user, logout } = useAuth()
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
    const [showNotifications, setShowNotifications] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    // Real system health check
    const [systemStatus, setSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking')

    const checkHealth = useCallback(async () => {
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 5000)
            const res = await fetch(`${API_SERVER}/api/auth/profile`, {
                method: 'HEAD',
                headers: getAuthHeaders(),
                signal: controller.signal
            })
            clearTimeout(timeout)
            // Any HTTP response means the server is alive (even 401/403/429)
            setSystemStatus('online')
        } catch {
            setSystemStatus('offline')
        }
    }, [user])

    useEffect(() => {
        checkHealth()
        const interval = setInterval(checkHealth, 120000)
        return () => clearInterval(interval)
    }, [checkHealth])

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowNotifications(false)
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false)
            }
        }
        if (showNotifications || showUserMenu) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [showNotifications, showUserMenu])

    const handleNotificationClick = (n: { id: string; read: boolean; actionUrl?: string }) => {
        if (!n.read) markAsRead(n.id)
        if (n.actionUrl) {
            navigate(n.actionUrl)
            setShowNotifications(false)
        }
    }

    const typeColors: Record<string, string> = {
        call: 'activity-dot-call',
        lead: 'activity-dot-lead',
        task: 'activity-dot-task',
        campaign: 'activity-dot-campaign',
        system: 'activity-dot-system'
    }

    const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?'

    return (
        <header className="glass-panel h-16 px-6 flex items-center justify-between z-10 sticky top-0">
            {/* Left: Title + Status */}
            <div className="flex items-center gap-4">
                <div className="lg:hidden">
                    <SidebarToggleButton onClick={onToggleSidebar} />
                </div>
                <h1 className="text-lg font-semibold tracking-wide text-text-primary uppercase opacity-90 hidden md:block">Command Center</h1>
                <div className="h-4 w-px bg-border hidden md:block" />
                <div className="hidden md:flex items-center text-xs text-text-muted cursor-pointer" onClick={checkHealth} title="Click to recheck">
                    <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus === 'online'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : systemStatus === 'offline'
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                        }`} />
                    {systemStatus === 'online' ? 'System Operational' : systemStatus === 'offline' ? 'System Offline' : 'Checking...'}
                </div>
            </div>

            {/* Center: Search bar */}
            <div className="flex-1 max-w-xl mx-8 relative group hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-text-muted group-focus-within:text-accent-primary transition-colors" />
                </div>
                <input
                    className="block w-full pl-10 pr-12 py-2 bg-bg-secondary/50 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all hover:bg-bg-tertiary/50"
                    placeholder="Search leads, deals, or commands..."
                    type="text"
                    readOnly
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-[10px] font-mono bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded border border-border">
                        <Command size={10} className="inline" />K
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Live Call Indicator — visible globally */}
                <GlobalCallIndicator activeCalls={activeCalls} />

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-lg bg-bg-secondary/80 border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-colors relative"
                        title="Notifications"
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 ring-2 ring-bg-primary">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-11 w-80 max-h-96 glass-card rounded-xl shadow-2xl overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllRead()}
                                        className="text-[10px] text-accent-primary hover:underline flex items-center gap-1"
                                    >
                                        <Check size={10} /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto max-h-72">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-text-muted text-xs">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.slice(0, 15).map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-bg-tertiary/50 transition-colors ${!n.read ? 'bg-accent-primary/5' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <span className={`activity-dot mt-1.5 ${typeColors[n.type] || 'activity-dot-system'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs truncate ${!n.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[10px] text-text-muted truncate mt-0.5">{n.message}</p>
                                                    <p className="text-[9px] text-text-muted/60 mt-1">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!n.read && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0 mt-2 ring-2 ring-accent-primary/20" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-border" />

                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className="relative p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary/50"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* User Avatar + Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-bg-tertiary/50 border border-transparent hover:border-border transition-all"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-text-primary">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-text-muted">{user?.role || 'Member'}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold border border-border">
                            {userInitial}
                        </div>
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-11 w-48 glass-card rounded-xl shadow-2xl overflow-hidden z-50">
                            {user && (
                                <div className="px-3 py-2.5 border-b border-border/50">
                                    <p className="text-xs font-semibold text-text-primary truncate">{user.name}</p>
                                    <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                                </div>
                            )}
                            <div className="py-1">
                                <button
                                    onClick={() => { onOpenSettings(); setShowUserMenu(false) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary transition-colors"
                                >
                                    <Settings size={13} /> Settings
                                </button>
                                <button
                                    onClick={() => { logout(); setShowUserMenu(false) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut size={13} /> Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
})

export default AppHeader
