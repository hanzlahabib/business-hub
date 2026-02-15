import { memo } from 'react'
import { Calendar, Sun, Moon, Settings, LogOut } from 'lucide-react'
import { SidebarToggleButton } from '../shared/components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { GlobalCallIndicator } from './GlobalCallIndicator'

interface AppHeaderProps {
    theme: 'light' | 'dark'
    onToggleTheme: () => void
    onToggleSidebar: () => void
    onOpenSettings: () => void
    activeCalls?: Array<{ id: string; leadId: string; leadName: string; status: string; startedAt: string }>
}

export const AppHeader = memo(function AppHeader({
    theme,
    onToggleTheme,
    onToggleSidebar,
    onOpenSettings,
    activeCalls = []
}: AppHeaderProps) {
    const { user, logout } = useAuth()

    return (
        <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <SidebarToggleButton onClick={onToggleSidebar} />

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                        <Calendar size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">Business Hub</h1>
                        <p className="text-sm text-text-muted">Productivity Platform</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Live Call Indicator — visible globally */}
                <GlobalCallIndicator activeCalls={activeCalls} />

                {/* User greeting */}
                {user && (
                    <span className="text-xs text-text-muted hidden md:inline">
                        {user.name}
                    </span>
                )}

                {/* Settings */}
                <button
                    onClick={onOpenSettings}
                    className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors"
                    title="Settings"
                >
                    <Settings size={18} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Sign Out */}
                <button
                    onClick={logout}
                    className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-red-400 hover:border-red-400 transition-colors"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    )
})

export default AppHeader

