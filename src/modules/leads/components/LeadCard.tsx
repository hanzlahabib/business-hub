import { motion } from 'framer-motion'
import { Mail, Phone, Globe, Building2, Calendar, MoreHorizontal, ExternalLink, Edit, Trash2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'

const LEAD_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'replied', label: 'Replied' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
]

const industryColors = {
  restaurant: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  salon: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  gym: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  realestate: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  retail: 'from-blue-500/20 to-violet-500/20 border-blue-500/30',
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

export function LeadCard({ lead, onClick, isDragging, selected, onSelect, onEdit, onDelete, onChangeStatus }) {
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
      {/* Selection Checkbox */}
      <div
        className={`absolute top-2 left-2 z-10 ${!selected ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected || false}
          onChange={(e) => onSelect?.(lead, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Menu button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-all">
              <MoreHorizontal className="w-4 h-4 text-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit?.(lead)} className="text-xs">
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <ArrowRight className="mr-2 h-3.5 w-3.5" />
                Change Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LEAD_STATUSES.filter(s => s.id !== lead.status).map(status => (
                  <DropdownMenuItem
                    key={status.id}
                    onClick={() => onChangeStatus?.(lead.id, status.id)}
                    className="text-xs"
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(lead)} className="text-xs text-red-500 focus:text-red-500">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
          <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-2">
            {lead.name}
          </h3>
        </div>
        {lead.contactPerson && (
          <p className="text-xs text-text-muted mt-1 ml-6">
            {lead.contactPerson}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs">
        {lead.email && (
          <div className="flex items-center gap-2 text-text-muted">
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-text-muted">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-text-muted">
            <Globe className="w-3 h-3" />
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:text-text-secondary flex items-center gap-1"
            >
              {lead.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {lead.source && (
            <span className="text-xs" title={`Source: ${lead.source}`}>
              {sourceIcons[lead.source] || '📌'}
            </span>
          )}
          {lead.industry && (
            <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded-full text-text-muted capitalize">
              {lead.industry}
            </span>
          )}
        </div>

        {lead.lastContactedAt ? (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true })}</span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">Not contacted</span>
        )}
      </div>

      {/* Last call outcome badge */}
      {lead.lastCallOutcome && (
        <div className="flex justify-end mt-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${lead.lastCallOutcome === 'booked' ? 'bg-emerald-500/15 text-emerald-400' :
              lead.lastCallOutcome === 'follow-up' ? 'bg-amber-500/15 text-amber-400' :
                lead.lastCallOutcome === 'not-interested' ? 'bg-red-500/15 text-red-400' :
                  'bg-gray-500/15 text-gray-400'
            }`}>
            {lead.lastCallOutcome === 'booked' ? '✅ Booked' :
              lead.lastCallOutcome === 'follow-up' ? '📅 Follow-up' :
                lead.lastCallOutcome === 'not-interested' ? '❌ Rejected' :
                  lead.lastCallOutcome === 'no-answer' ? '📵 No Answer' :
                    lead.lastCallOutcome}
          </span>
        </div>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary border border-border/50"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-text-muted">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default LeadCard
