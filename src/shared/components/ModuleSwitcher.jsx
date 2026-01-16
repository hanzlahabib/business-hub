import { motion } from 'framer-motion'
import { Calendar, Users, LayoutGrid, Briefcase } from 'lucide-react'

const modules = [
  {
    id: 'schedule',
    name: 'Schedule',
    icon: Calendar,
    description: 'Content calendar & pipeline',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: Users,
    description: 'Lead management & outreach',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'taskboards',
    name: 'Task Boards',
    icon: LayoutGrid,
    description: 'Project task management',
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: Briefcase,
    description: 'Job search & applications',
    color: 'from-purple-500 to-pink-600'
  }
]

export function ModuleSwitcher({ activeModule, onModuleChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
      {modules.map(module => {
        const Icon = module.icon
        const isActive = activeModule === module.id

        return (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? 'text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
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
          </button>
        )
      })}
    </div>
  )
}

// Compact version for smaller screens
export function ModuleSwitcherCompact({ activeModule, onModuleChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
      {modules.map(module => {
        const Icon = module.icon
        const isActive = activeModule === module.id

        return (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            title={module.name}
            className={`relative p-2 rounded-md transition-all ${
              isActive
                ? 'text-white bg-gradient-to-r ' + module.color
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
}

// Dropdown version
export function ModuleSwitcherDropdown({ activeModule, onModuleChange, open, onOpenChange }) {
  const active = modules.find(m => m.id === activeModule)
  const Icon = active?.icon || Calendar

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Icon className="w-4 h-4 text-white/60" />
        <span className="text-sm font-medium text-white">{active?.name}</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
        >
          {modules.map(module => {
            const ModuleIcon = module.icon
            const isActive = activeModule === module.id

            return (
              <button
                key={module.id}
                onClick={() => {
                  onModuleChange(module.id)
                  onOpenChange(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${module.color}`}>
                  <ModuleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{module.name}</p>
                  <p className="text-xs opacity-60">{module.description}</p>
                </div>
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

export default ModuleSwitcher
