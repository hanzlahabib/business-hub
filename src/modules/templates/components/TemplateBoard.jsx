import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Linkedin, Mail, ClipboardList, FileText, File } from 'lucide-react'
import TemplateCard from './TemplateCard'
import { useTemplates } from '../hooks/useTemplates'

// Note: Search and Plus icons kept for potential future use

const categoryConfig = {
  linkedin: {
    label: 'LinkedIn',
    color: 'from-blue-500 to-cyan-600',
    icon: Linkedin
  },
  email: {
    label: 'Email',
    color: 'from-red-500 to-orange-600',
    icon: Mail
  },
  proposal: {
    label: 'Proposals',
    color: 'from-green-500 to-emerald-600',
    icon: ClipboardList
  },
  document: {
    label: 'Documents',
    color: 'from-amber-500 to-yellow-600',
    icon: FileText
  },
  custom: {
    label: 'Custom',
    color: 'from-purple-500 to-pink-600',
    icon: File
  }
}

function CategoryColumn({
  category,
  templates,
  onTemplateClick,
  onAddClick,
  onDrop,
  onCopy
}) {
  const config = categoryConfig[category]
  const Icon = config.icon
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const templateId = e.dataTransfer.getData('templateId')
    if (templateId) {
      onDrop(templateId, category)
    }
  }

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-bg-secondary rounded-xl border transition-colors ${
        isDragOver ? 'border-accent-primary bg-bg-tertiary' : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 bg-gradient-to-r ${config.color} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">{config.label}</h3>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
              {templates.length}
            </span>
          </div>
          <button
            onClick={() => onAddClick(category)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        <AnimatePresence>
          {templates.map(template => (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('templateId', template.id)
              }}
            >
              <TemplateCard
                template={template}
                onClick={onTemplateClick}
                onCopy={onCopy}
              />
            </div>
          ))}
        </AnimatePresence>

        {templates.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">No templates</p>
            <button
              onClick={() => onAddClick(category)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function TemplateBoard({
  templates = [],
  onTemplateClick,
  onAddClick,
  onCopy
}) {
  const { updateTemplate } = useTemplates()

  const templatesByCategory = useMemo(() => {
    const grouped = {}
    Object.keys(categoryConfig).forEach(category => {
      grouped[category] = templates.filter(t => t.category === category)
    })
    return grouped
  }, [templates])

  const handleDrop = async (templateId, newCategory) => {
    await updateTemplate(templateId, { category: newCategory })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {Object.keys(categoryConfig).map(category => (
            <CategoryColumn
              key={category}
              category={category}
              templates={templatesByCategory[category]}
              onTemplateClick={onTemplateClick}
              onAddClick={onAddClick}
              onDrop={handleDrop}
              onCopy={onCopy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemplateBoard
