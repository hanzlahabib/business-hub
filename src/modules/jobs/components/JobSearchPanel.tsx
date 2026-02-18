// @ts-nocheck
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ExternalLink, Star, Globe, Briefcase, Rocket, Building2, Filter } from 'lucide-react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { fetchGet } from '../../../utils/authHeaders'

const sourceIcons = {
  remoteok: { icon: Globe, color: 'text-green-400', bg: 'bg-green-500/20' },
  weworkremotely: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  linkedin: { icon: '🔗', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  wellfound: { icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  ycombinator: { icon: '🚀', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  direct: { icon: Building2, color: 'text-pink-400', bg: 'bg-pink-500/20' }
}

export function JobSearchPanel({ isOpen, onClose }) {
  const { user } = useAuth()
  const [searchPrompts, setSearchPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchPrompts = async () => {
      if (!user) return
      try {
        const data = await fetchGet(ENDPOINTS.JOB_SEARCH_PROMPTS)
        setSearchPrompts(data)
      } catch (err: any) {
        console.error('Failed to fetch search prompts:', err)
      } finally {
        setLoading(false)
      }
    }
    if (isOpen && user) {
      fetchPrompts()
    }
  }, [isOpen, user])

  const sources = [...new Set(searchPrompts.map(p => p.source))]

  const filteredPrompts = searchPrompts.filter(prompt => {
    const matchesFilter = filter === 'all' || prompt.source === filter
    const matchesSearch = !searchQuery ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    const source = prompt.source
    if (!acc[source]) acc[source] = []
    acc[source].push(prompt)
    return acc
  }, {})

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[85vh] bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Find Remote Jobs</h2>
                  <p className="text-sm text-text-muted">Curated job search links for React/Frontend developers</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search job boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedPrompts).map(([source, prompts]) => {
                  const sourceConfig = sourceIcons[source] || sourceIcons.direct
                  const IconComponent = typeof sourceConfig.icon === 'string' ? null : sourceConfig.icon

                  return (
                    <div key={source}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`p-1.5 rounded-lg ${sourceConfig.bg}`}>
                          {IconComponent ? (
                            <IconComponent className={`w-4 h-4 ${sourceConfig.color}`} />
                          ) : (
                            <span>{sourceConfig.icon}</span>
                          )}
                        </div>
                        <h3 className={`font-semibold ${sourceConfig.color}`}>
                          {source.charAt(0).toUpperCase() + source.slice(1).replace(/([A-Z])/g, ' $1')}
                        </h3>
                        <span className="text-xs text-text-muted">({prompts.length} links)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prompts.map(prompt => (
                          <a
                            key={prompt.id}
                            href={prompt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-xl border border-border hover:border-border-hover transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-text-primary group-hover:text-blue-300 transition-colors">
                                  {prompt.name}
                                </h4>
                                <p className="text-sm text-text-muted mt-1">
                                  {prompt.description}
                                </p>
                                {prompt.tags && prompt.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {prompt.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {Object.keys(groupedPrompts).length === 0 && (
                  <div className="text-center py-12 text-text-muted">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No job search links found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Tips */}
          <div className="p-4 border-t border-border bg-bg-secondary">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Star className="w-3 h-3 text-amber-400" />
              <span>
                <strong className="text-text-secondary">Pro tip:</strong> Save interesting jobs to your board, then use email templates to reach out!
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default JobSearchPanel
