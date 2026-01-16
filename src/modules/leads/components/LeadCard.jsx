import { motion } from 'framer-motion'
import { Mail, Phone, Globe, Building2, Calendar, MoreHorizontal, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const industryColors = {
  restaurant: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  salon: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  gym: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  realestate: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  retail: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
  hotel: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  default: 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
}

const sourceIcons = {
  google: '🔍',
  linkedin: '💼',
  instagram: '📸',
  upwork: '💚',
  manual: '✏️',
  'csv-import': '📄',
  'md-import': '📝'
}

export function LeadCard({ lead, onClick, onMenuClick, isDragging }) {
  const colorClass = industryColors[lead.industry] || industryColors.default

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(lead)}
      className={`
        group relative cursor-pointer
        bg-gradient-to-br ${colorClass}
        border rounded-xl p-4
        transition-all duration-200
        ${isDragging ? 'shadow-xl ring-2 ring-white/20' : 'hover:shadow-lg'}
      `}
    >
      {/* Menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onMenuClick?.(lead, e)
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
      >
        <MoreHorizontal className="w-4 h-4 text-white/60" />
      </button>

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
            {lead.name}
          </h3>
        </div>
        {lead.contactPerson && (
          <p className="text-xs text-white/50 mt-1 ml-6">
            {lead.contactPerson}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs">
        {lead.email && (
          <div className="flex items-center gap-2 text-white/60">
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-white/60">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-white/60">
            <Globe className="w-3 h-3" />
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:text-white/80 flex items-center gap-1"
            >
              {lead.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {lead.source && (
            <span className="text-xs" title={`Source: ${lead.source}`}>
              {sourceIcons[lead.source] || '📌'}
            </span>
          )}
          {lead.industry && (
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60 capitalize">
              {lead.industry}
            </span>
          )}
        </div>

        {lead.lastContactedAt ? (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true })}</span>
          </div>
        ) : (
          <span className="text-xs text-white/30">Not contacted</span>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/50"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-white/30">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default LeadCard
