import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  Calendar, Film, Users, LayoutGrid, Briefcase, FileText, GraduationCap,
  Menu, X, ChevronLeft, ChevronRight, Phone, Zap, LayoutDashboard, BrainCircuit, Handshake
} from 'lucide-react'

const modules = [
  {
    id: 'dashboard',
    name: 'Command Center',
    icon: LayoutDashboard,
    description: 'Real-time business overview',
    color: 'from-indigo-500 to-purple-600',
    accentBg: 'bg-indigo-500/15',
    accentText: 'text-indigo-400',
    accentBorder: 'border-indigo-500/40',
    glow: 'glow-module-indigo',
    path: '/dashboard'
  },
  {
    id: 'schedule',
    name: 'Calendar',
    icon: Calendar,
    description: 'Unified scheduling hub',
    color: 'from-blue-500 to-cyan-600',
    accentBg: 'bg-blue-500/15',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500/40',
    glow: 'glow-module-blue',
    path: '/'
  },
  {
    id: 'contentstudio',
    name: 'Content Studio',
    icon: Film,
    description: 'Video production pipeline',
    color: 'from-rose-500 to-pink-600',
    accentBg: 'bg-rose-500/15',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/40',
    glow: 'glow-module-rose',
    path: '/content'
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: Users,
    description: 'Lead management & outreach',
    color: 'from-emerald-500 to-teal-600',
    accentBg: 'bg-emerald-500/15',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    glow: 'glow-module-emerald',
    path: '/leads'
  },
  {
    id: 'taskboards',
    name: 'Task Boards',
    icon: LayoutGrid,
    description: 'Project task management',
    color: 'from-orange-500 to-amber-600',
    accentBg: 'bg-orange-500/15',
    accentText: 'text-orange-400',
    accentBorder: 'border-orange-500/40',
    glow: 'glow-module-orange',
    path: '/taskboards'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: Briefcase,
    description: 'Job search & applications',
    color: 'from-blue-600 to-indigo-600',
    accentBg: 'bg-blue-500/15',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500/40',
    glow: 'glow-module-blue',
    path: '/jobs'
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: FileText,
    description: 'Reusable content templates',
    color: 'from-purple-500 to-pink-600',
    accentBg: 'bg-purple-500/15',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/40',
    glow: 'glow-module-purple',
    path: '/templates'
  },
  {
    id: 'skillmastery',
    name: 'Skill Mastery',
    icon: GraduationCap,
    description: 'Learn & master new skills',
    color: 'from-violet-500 to-purple-600',
    accentBg: 'bg-violet-500/15',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/40',
    glow: 'glow-module-violet',
    path: '/skills'
  },
  {
    id: 'calling',
    name: 'AI Calling',
    icon: Phone,
    description: 'AI-powered outbound calls',
    color: 'from-cyan-500 to-blue-600',
    accentBg: 'bg-cyan-500/15',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/40',
    glow: 'glow-module-cyan',
    path: '/calling'
  },
  {
    id: 'automation',
    name: 'Automation',
    icon: Zap,
    description: 'Lead scraping & outreach',
    color: 'from-amber-500 to-orange-600',
    accentBg: 'bg-amber-500/15',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    glow: 'glow-module-amber',
    path: '/automation'
  },
  {
    id: 'brain',
    name: 'Neural Brain',
    icon: BrainCircuit,
    description: 'AI insights & lead intelligence',
    color: 'from-violet-600 to-indigo-600',
    accentBg: 'bg-violet-500/15',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/40',
    glow: 'glow-module-violet',
    path: '/brain'
  },
  {
    id: 'dealdesk',
    name: 'Deal Desk',
    icon: Handshake,
    description: 'Pipeline & proposals',
    color: 'from-emerald-600 to-green-600',
    accentBg: 'bg-emerald-500/15',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    glow: 'glow-module-emerald',
    path: '/dealdesk'
  }
]

// Core modules (indices 0-7) vs AI modules (indices 8-11)
const coreModules = modules.slice(0, 8)
const aiModules = modules.slice(8)

export function Sidebar({ activeModule, isOpen, onToggle, isCollapsed, onCollapse, hasActiveCalls = false }) {
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-52'

  const renderNavItem = (module) => {
    const Icon = module.icon
    const isActive = activeModule === module.id

    if (isCollapsed) {
      // Stitch-style collapsed: square aspect-ratio icon buttons with tooltip
      return (
        <NavLink
          key={module.id}
          to={module.path}
          onClick={() => {
            if (window.innerWidth < 1024) onToggle()
          }}
          className={`group relative w-full aspect-square flex items-center justify-center rounded-lg transition-colors
            ${isActive
              ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(60,131,246,0.2)] border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          title={module.name}
        >
          <Icon className="w-5 h-5" />
          {/* Left active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(60,131,246,0.5)]" />
          )}
          {/* Tooltip */}
          <span className="absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
            {module.name}
          </span>
          {/* Calling pulse dot */}
          {module.id === 'calling' && hasActiveCalls && (
            <span className="absolute top-1 right-1 flex h-2 w-2 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </NavLink>
      )
    }

    // Expanded state
    return (
      <NavLink
        key={module.id}
        to={module.path}
        onClick={() => {
          if (window.innerWidth < 1024) onToggle()
        }}
        className={`relative flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${isActive
          ? 'text-white'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50'
          }`}
        title=""
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeSidebarModule"
            className={`absolute inset-0 bg-gradient-to-r ${module.color} rounded-lg`}
            initial={false}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}

        <div className="relative flex items-center justify-center">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all">
            <Icon className="w-4 h-4 relative z-10" />
          </div>
          {module.id === 'calling' && hasActiveCalls && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>

        <div className="relative flex-1 flex items-center gap-1.5">
          <p className="font-medium text-xs">{module.name}</p>
          {module.id === 'calling' && hasActiveCalls && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium relative z-10">
              LIVE
            </span>
          )}
        </div>
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile overlay - only show when sidebar is open on mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 ${sidebarWidth} bg-[#0b0e11] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Header / Logo */}
        <div className={`flex items-center justify-between ${isCollapsed ? 'py-6 px-2 justify-center' : 'h-14 px-3 border-b border-white/5'}`}>
          {isCollapsed ? (
            /* Stitch-style logo: gradient square with icon */
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(60,131,246,0.5)] cursor-pointer" onClick={onCollapse}>
              <BrainCircuit size={20} className="text-white" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(60,131,246,0.5)] flex items-center justify-center">
                  <BrainCircuit size={14} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xs font-bold text-text-primary">Business Hub</h1>
                </div>
              </div>
              <button
                onClick={onCollapse}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}

          {/* Close button - Mobile only */}
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'overflow-y-auto overflow-x-hidden py-4 px-2' : 'overflow-y-auto py-2 px-2'} flex flex-col`}>
          {/* Core modules */}
          <div className={`${isCollapsed ? 'space-y-2' : 'space-y-0.5'}`}>
            {coreModules.map(renderNavItem)}
          </div>

          {/* Separator */}
          <div className={`my-2 border-t border-white/5 ${isCollapsed ? 'mx-1' : 'mx-1'}`}>
            {!isCollapsed && (
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mt-2 mb-1 px-2">
                AI & Sales
              </p>
            )}
          </div>

          {/* AI modules */}
          <div className={`${isCollapsed ? 'space-y-2' : 'space-y-0.5'}`}>
            {aiModules.map(renderNavItem)}
          </div>
        </nav>

        {/* Footer / Settings */}
        {isCollapsed ? (
          <div className="mt-auto px-2 pb-6">
            <button
              onClick={onCollapse}
              className="w-full aspect-square flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-white/5">
            <div className="text-[10px] text-slate-500 text-center">
              <p>v1.0</p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

// Hamburger menu button component - only shows on mobile
export function SidebarToggleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors lg:hidden"
      title="Open menu"
    >
      <Menu size={20} />
    </button>
  )
}

export default Sidebar
