import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Calendar, Users, LayoutGrid, Briefcase, FileText, GraduationCap } from 'lucide-react'

const modules = [
  {
    id: 'schedule',
    name: 'Schedule',
    icon: Calendar,
    description: 'Content calendar & pipeline',
    color: 'from-blue-500 to-cyan-600',
    path: '/'
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
  }
]

export function ModuleSwitcher({ activeModule }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
      {modules.map(module => {
        const Icon = module.icon
        const isActive = activeModule === module.id

        return (
          <NavLink
            key={module.id}
            to={module.path}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? 'text-white'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeModule"
                className={`absolute inset-0 bg-gradient-to-r ${module.color} rounded-lg`}
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icon className="relative w-4 h-4" />
            <span className="relative text-sm font-medium">{module.name}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

// Compact version for smaller screens
export function ModuleSwitcherCompact({ activeModule }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-lg border border-border">
      {modules.map(module => {
        const Icon = module.icon
        const isActive = activeModule === module.id

        return (
          <NavLink
            key={module.id}
            to={module.path}
            title={module.name}
            className={`relative p-2 rounded-md transition-all ${
              isActive
                ? 'text-white bg-gradient-to-r ' + module.color
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <Icon className="w-5 h-5" />
          </NavLink>
        )
      })}
    </div>
  )
}

// Dropdown version
export function ModuleSwitcherDropdown({ activeModule, open, onOpenChange }) {
  const active = modules.find(m => m.id === activeModule)
  const Icon = active?.icon || Calendar

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-bg-secondary rounded-lg border border-border hover:bg-bg-tertiary transition-colors"
      >
        <Icon className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-medium text-text-primary">{active?.name}</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-64 bg-bg-primary border border-border rounded-xl shadow-xl overflow-hidden z-50"
        >
          {modules.map(module => {
            const ModuleIcon = module.icon
            const isActive = activeModule === module.id

            return (
              <NavLink
                key={module.id}
                to={module.path}
                onClick={() => onOpenChange(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${module.color}`}>
                  <ModuleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{module.name}</p>
                  <p className="text-xs opacity-60">{module.description}</p>
                </div>
              </NavLink>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

export default ModuleSwitcher
