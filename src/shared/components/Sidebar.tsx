import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  Calendar, Film, Users, LayoutGrid, Briefcase, FileText, GraduationCap,
  Menu, X, ChevronLeft, ChevronRight, Phone, Zap
} from 'lucide-react'

const modules = [
  {
    id: 'schedule',
    name: 'Calendar',
    icon: Calendar,
    description: 'Unified scheduling hub',
    color: 'from-blue-500 to-cyan-600',
    path: '/'
  },
  {
    id: 'contentstudio',
    name: 'Content Studio',
    icon: Film,
    description: 'Video production pipeline',
    color: 'from-rose-500 to-pink-600',
    path: '/content'
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: Users,
    description: 'Lead management & outreach',
    color: 'from-emerald-500 to-teal-600',
    path: '/leads'
  },
  {
    id: 'taskboards',
    name: 'Task Boards',
    icon: LayoutGrid,
    description: 'Project task management',
    color: 'from-orange-500 to-amber-600',
    path: '/taskboards'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: Briefcase,
    description: 'Job search & applications',
    color: 'from-blue-600 to-indigo-600',
    path: '/jobs'
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: FileText,
    description: 'Reusable content templates',
    color: 'from-purple-500 to-pink-600',
    path: '/templates'
  },
  {
    id: 'skillmastery',
    name: 'Skill Mastery',
    icon: GraduationCap,
    description: 'Learn & master new skills',
    color: 'from-violet-500 to-purple-600',
    path: '/skills'
  },
  {
    id: 'calling',
    name: 'AI Calling',
    icon: Phone,
    description: 'AI-powered outbound calls',
    color: 'from-cyan-500 to-blue-600',
    path: '/calling'
  },
  {
    id: 'automation',
    name: 'Automation',
    icon: Zap,
    description: 'Lead scraping & outreach',
    color: 'from-amber-500 to-orange-600',
    path: '/automation'
  }
]

export function Sidebar({ activeModule, isOpen, onToggle, isCollapsed, onCollapse }) {
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-52'

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

      {/* Sidebar - always visible on desktop, drawer on mobile */}
      <aside
        className={`fixed left-0 top-0 bottom-0 ${sidebarWidth} bg-bg-secondary border-r border-border z-50 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <Calendar size={14} className="text-white" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-text-primary">Business Hub</h1>
              </div>
            </div>
          )}

          {/* Collapse toggle - Desktop only */}
          <button
            onClick={onCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Close button - Mobile only */}
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <div className="space-y-0.5">
            {modules.map(module => {
              const Icon = module.icon
              const isActive = activeModule === module.id

              return (
                <NavLink
                  key={module.id}
                  to={module.path}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      onToggle()
                    }
                  }}
                  className={`relative flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${isActive
                    ? 'text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  title={isCollapsed ? module.name : ''}
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

                  {/* Icon */}
                  <div className={`relative flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}>
                    <Icon className="w-4 h-4 relative z-10" />
                  </div>

                  {/* Label */}
                  {!isCollapsed && (
                    <div className="relative flex-1">
                      <p className="font-medium text-xs">{module.name}</p>
                    </div>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-2 border-t border-border">
            <div className="text-[10px] text-text-muted text-center">
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
