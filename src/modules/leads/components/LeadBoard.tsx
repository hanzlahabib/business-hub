import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Upload, X, Building2, MapPin, Globe, Tag, AlertCircle, RefreshCw, Mail, CheckSquare, Square } from 'lucide-react'
import LeadCard from './LeadCard'
import { useLeads } from '../hooks/useLeads'
import { SearchableSelect } from '../../../components/ui/searchable-select'
import { LeadGlobalSearch } from './LeadGlobalSearch'
import { LoadingSkeleton } from '../../../components/ui/loading-skeleton'
import { EmptyState } from '../../../components/ui/empty-state'
import BulkEmailComposer from './BulkEmailComposer'

const statusConfig = {
  new: { label: 'New', color: 'from-gray-500 to-slate-600', emoji: '🆕' },
  contacted: { label: 'Contacted', color: 'from-blue-500 to-cyan-600', emoji: '📧' },
  replied: { label: 'Replied', color: 'from-blue-500 to-cyan-600', emoji: '💬' },
  meeting: { label: 'Meeting', color: 'from-amber-500 to-orange-600', emoji: '📅' },
  won: { label: 'Won', color: 'from-green-500 to-emerald-600', emoji: '🎉' },
  lost: { label: 'Lost', color: 'from-red-500 to-rose-600', emoji: '❌' }
}

// Helper to extract country from location or phone
function extractCountry(lead) {
  // Check phone prefix
  if (lead.phone?.startsWith('+968')) return 'Oman'
  if (lead.phone?.startsWith('+971')) return 'UAE'
  if (lead.phone?.startsWith('+966')) return 'Saudi Arabia'
  if (lead.phone?.startsWith('+974')) return 'Qatar'
  if (lead.phone?.startsWith('+973')) return 'Bahrain'
  if (lead.phone?.startsWith('+965')) return 'Kuwait'

  // Check location
  const loc = lead.location?.toLowerCase() || ''
  if (loc.includes('muscat') || loc.includes('oman') || loc.includes('seeb') || loc.includes('sohar')) return 'Oman'
  if (loc.includes('dubai') || loc.includes('abu dhabi') || loc.includes('sharjah') || loc.includes('uae')) return 'UAE'
  if (loc.includes('riyadh') || loc.includes('jeddah') || loc.includes('saudi')) return 'Saudi Arabia'
  if (loc.includes('doha') || loc.includes('qatar')) return 'Qatar'

  // Check tags
  if (lead.tags?.some(t => ['oman', 'muscat'].includes(t.toLowerCase()))) return 'Oman'
  if (lead.tags?.some(t => ['uae', 'dubai', 'sharjah'].includes(t.toLowerCase()))) return 'UAE'

  return 'Unknown'
}

// Helper to extract city from location
function extractCity(lead) {
  const loc = lead.location?.toLowerCase() || ''

  // Oman cities
  if (loc.includes('muscat') || loc.includes('al khuwair') || loc.includes('qurum') || loc.includes('ghubrah') || loc.includes('ruwi') || loc.includes('muttrah')) return 'Muscat'
  if (loc.includes('seeb') || loc.includes('sib')) return 'Seeb'
  if (loc.includes('sohar')) return 'Sohar'
  if (loc.includes('salalah')) return 'Salalah'
  if (loc.includes('nizwa')) return 'Nizwa'

  // UAE cities
  if (loc.includes('dubai')) return 'Dubai'
  if (loc.includes('abu dhabi')) return 'Abu Dhabi'
  if (loc.includes('sharjah')) return 'Sharjah'
  if (loc.includes('ajman')) return 'Ajman'

  // Check tags for city
  if (lead.tags?.includes('muscat')) return 'Muscat'
  if (lead.tags?.includes('seeb')) return 'Seeb'
  if (lead.tags?.includes('dubai')) return 'Dubai'
  if (lead.tags?.includes('sharjah')) return 'Sharjah'

  return 'Unknown'
}

function StatusColumn({ status, leads, onLeadClick, onAddClick, onDrop, selectedLeads, onSelectLead }) {
  const config = statusConfig[status]
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
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) {
      onDrop(leadId, status)
    }
  }

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-bg-secondary rounded-xl border transition-colors ${isDragOver ? 'border-accent-primary bg-bg-tertiary' : 'border-border'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 bg-gradient-to-r ${config.color} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <h3 className="font-semibold text-text-primary">{config.label}</h3>
            <span className="px-2 py-0.5 bg-bg-tertiary/50 rounded-full text-xs text-text-secondary min-w-[20px] text-center">
              {leads.length}
            </span>
          </div>
          {status === 'new' && (
            <button
              onClick={onAddClick}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-350px)]">
        <AnimatePresence>
          {leads.map(lead => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('leadId', lead.id)
              }}
            >
              <LeadCard
                lead={lead}
                onClick={onLeadClick}
                selected={selectedLeads.includes(lead.id)}
                onSelect={(l, checked) => onSelectLead(l.id, checked)}
              />
            </div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">No leads</p>
            {status === 'new' && (
              <button
                onClick={onAddClick}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Add your first lead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function LeadBoard({
  onLeadClick,
  onAddClick,
  onImportClick
}) {
  const { leads, loading, error, changeStatus, getStats, fetchLeads } = useLeads()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    industry: '',
    priority: '',
    tag: '',
    country: '',
    city: ''
  })

  // Selection State
  const [selectedLeads, setSelectedLeads] = useState([])
  const [showBulkComposer, setShowBulkComposer] = useState(false)

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc to clear selection
      if (e.key === 'Escape' && selectedLeads.length > 0) {
        setSelectedLeads([])
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedLeads])

  // Enrich leads with country/city
  const enrichedLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      _country: extractCountry(lead),
      _city: extractCity(lead)
    }))
  }, [leads])

  // Get unique values for filter dropdowns with counts
  const filterOptions = useMemo(() => {
    // Industries with count
    const industryCounts = {}
    enrichedLeads.forEach(l => {
      if (l.industry) {
        industryCounts[l.industry] = (industryCounts[l.industry] || 0) + 1
      }
    })
    const industries = Object.entries(industryCounts)
      .map(([value, count]) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1), count }))
      .sort((a, b) => b.count - a.count)

    // Priorities with count
    const priorityCounts = {}
    enrichedLeads.forEach(l => {
      if (l.priority) {
        priorityCounts[l.priority] = (priorityCounts[l.priority] || 0) + 1
      }
    })
    const priorities = Object.entries(priorityCounts)
      .map(([value, count]) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1), count }))
      .sort((a, b) => b.count - a.count)

    // Tags with count
    const tagCounts = {}
    enrichedLeads.forEach(l => {
      (l.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const tags = Object.entries(tagCounts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    // Countries with count
    const countryCounts = {}
    enrichedLeads.forEach(l => {
      if (l._country && l._country !== 'Unknown') {
        countryCounts[l._country] = (countryCounts[l._country] || 0) + 1
      }
    })
    const countries = Object.entries(countryCounts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    // Cities with count
    const cityCounts = {}
    enrichedLeads.forEach(l => {
      if (l._city && l._city !== 'Unknown') {
        cityCounts[l._city] = (cityCounts[l._city] || 0) + 1
      }
    })
    const cities = Object.entries(cityCounts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    return { industries, priorities, tags, countries, cities }
  }, [enrichedLeads])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filteredLeads = useMemo(() => {
    let result = enrichedLeads

    // Apply industry filter
    if (filters.industry) {
      result = result.filter(l => l.industry === filters.industry)
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(l => l.priority === filters.priority)
    }

    // Apply tag filter
    if (filters.tag) {
      result = result.filter(l => l.tags?.includes(filters.tag))
    }

    // Apply country filter
    if (filters.country) {
      result = result.filter(l => l._country === filters.country)
    }

    // Apply city filter
    if (filters.city) {
      result = result.filter(l => l._city === filters.city)
    }

    return result
  }, [enrichedLeads, filters])

  const clearFilters = () => {
    setFilters({ industry: '', priority: '', tag: '', country: '', city: '' })
  }

  const leadsByStatus = useMemo(() => {
    const grouped = {}
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = filteredLeads.filter(l => l.status === status)
    })
    return grouped
  }, [filteredLeads])

  const handleDrop = async (leadId, newStatus) => {
    await changeStatus(leadId, newStatus)
  }

  // Selection Logic
  const handleSelectLead = (leadId, checked) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId])
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId))
    }
  }

  const handleSelectAllFiltered = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id))
    }
  }

  const selectedLeadsObjects = useMemo(() => {
    return leads.filter(l => selectedLeads.includes(l.id))
  }, [leads, selectedLeads])


  const stats = getStats()

  // Show loading state
  if (loading && leads.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Lead Board</h2>
        </div>
        <div className="flex-1 p-4 overflow-x-auto">
          <div className="flex gap-4 h-full">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} variant="board" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Leads"
          description={error}
          action={{
            label: 'Try Again',
            onClick: fetchLeads,
            variant: 'primary'
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">Lead Board</h2>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className={filteredLeads.length !== stats.total ? 'text-blue-400 font-medium' : ''}>
                {filteredLeads.length} of {stats.total} leads
              </span>
              <span>•</span>
              <span className="text-green-400">{stats.byStatus.won || 0} won</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Select All (Visible if filters active or select mode) */}
            {(showFilters || selectedLeads.length > 0) && (
              <button
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {selectedLeads.length === filteredLeads.length ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                Select All ({filteredLeads.length})
              </button>
            )}

            {/* Search Button (Ctrl+K) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-sm text-text-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-bg-tertiary rounded text-xs">Ctrl+K</kbd>
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters || activeFilterCount > 0
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Import */}
            <button
              onClick={onImportClick}
              className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>

            {/* Add Lead */}
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="bg-bg-secondary rounded-xl p-4 border border-border">
            <div className="flex items-start gap-6">
              {/* Filter Grid */}
              <div className="flex-1 grid grid-cols-5 gap-3">
                {/* Country Filter */}
                <SearchableSelect
                  value={filters.country}
                  onChange={(v) => setFilters(f => ({ ...f, country: v }))}
                  options={filterOptions.countries}
                  placeholder="All Countries"
                  searchPlaceholder="Search country..."
                  label="Country"
                  icon={Globe}
                />

                {/* City Filter */}
                <SearchableSelect
                  value={filters.city}
                  onChange={(v) => setFilters(f => ({ ...f, city: v }))}
                  options={filterOptions.cities}
                  placeholder="All Cities"
                  searchPlaceholder="Search city..."
                  label="City"
                  icon={MapPin}
                />

                {/* Industry Filter */}
                <SearchableSelect
                  value={filters.industry}
                  onChange={(v) => setFilters(f => ({ ...f, industry: v }))}
                  options={filterOptions.industries}
                  placeholder="All Industries"
                  searchPlaceholder="Search industry..."
                  label="Industry"
                  icon={Building2}
                />

                {/* Priority Filter */}
                <SearchableSelect
                  value={filters.priority}
                  onChange={(v) => setFilters(f => ({ ...f, priority: v }))}
                  options={filterOptions.priorities}
                  placeholder="All Priorities"
                  searchPlaceholder="Search priority..."
                  label="Priority"
                  icon={AlertCircle}
                />

                {/* Tag Filter */}
                <SearchableSelect
                  value={filters.tag}
                  onChange={(v) => setFilters(f => ({ ...f, tag: v }))}
                  options={filterOptions.tags}
                  placeholder="All Tags"
                  searchPlaceholder="Search tag..."
                  label="Tag"
                  icon={Tag}
                />
              </div>

              {/* Clear Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 mt-5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-xs text-text-muted">Active:</span>
                {filters.country && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {filters.country}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-text-primary"
                      onClick={() => setFilters(f => ({ ...f, country: '' }))}
                    />
                  </span>
                )}
                {filters.city && (
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {filters.city}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-text-primary"
                      onClick={() => setFilters(f => ({ ...f, city: '' }))}
                    />
                  </span>
                )}
                {filters.industry && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {filters.industry}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-text-primary"
                      onClick={() => setFilters(f => ({ ...f, industry: '' }))}
                    />
                  </span>
                )}
                {filters.priority && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {filters.priority}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-text-primary"
                      onClick={() => setFilters(f => ({ ...f, priority: '' }))}
                    />
                  </span>
                )}
                {filters.tag && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {filters.tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-text-primary"
                      onClick={() => setFilters(f => ({ ...f, tag: '' }))}
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {Object.keys(statusConfig).map(status => (
            <StatusColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onLeadClick={onLeadClick}
              onAddClick={onAddClick}
              onDrop={handleDrop}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
            />
          ))}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 bg-bg-primary border border-border shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                {selectedLeads.length}
              </div>
              Selected
            </div>

            <div className="w-px h-6 bg-border mx-2" />

            <button
              onClick={() => setShowBulkComposer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>

            <button
              onClick={() => setSelectedLeads([])}
              className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <LeadGlobalSearch
            leads={leads}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectLead={(lead) => onLeadClick(lead)}
          />
        )}
      </AnimatePresence>

      {/* Bulk Email Composer */}
      {showBulkComposer && (
        <BulkEmailComposer
          isOpen={showBulkComposer}
          onClose={() => setShowBulkComposer(false)}
          leads={selectedLeadsObjects}
          onSuccess={() => {
            // Optional: refresh leads or clear selection
            setSelectedLeads([])
          }}
        />
      )}
    </div>
  )
}

export default LeadBoard
