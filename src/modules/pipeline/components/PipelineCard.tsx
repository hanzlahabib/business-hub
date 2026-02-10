// @ts-nocheck
import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  Clock, AlertTriangle, MoreHorizontal, Edit, Trash2,
  Calendar, Video, Film, GripVertical, ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const STAGES = [
  { id: 'idea', label: 'Ideas' },
  { id: 'script', label: 'Script' },
  { id: 'recording', label: 'Recording' },
  { id: 'editing', label: 'Editing' },
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'published', label: 'Published' }
]

export const PipelineCard = memo(function PipelineCard({
  content,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  onEdit,
  onDelete,
  onMoveToStage
}) {
  const [isHovered, setIsHovered] = useState(false)

  const formattedDate = content.scheduledDate
    ? format(parseISO(content.scheduledDate), 'MMM d')
    : null

  const getDaysLabel = (days) => {
    if (days === 0) return 'Today'
    if (days === 1) return '1 day'
    return `${days} days`
  }

  const getAgeColor = (days) => {
    if (days <= 2) return 'text-green-400'
    if (days <= 5) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`${isDragging ? 'opacity-50 scale-95' : ''}`}
          >
            <Card
              className={`
                cursor-grab active:cursor-grabbing transition-all duration-200
                bg-bg-primary border-border/60 hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5
                shadow-md shadow-black/10
                ${content.isOverdue ? 'border-l-2 border-l-red-500' : ''}
              `}
            >
              <CardContent className="p-2.5">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <GripVertical className="w-3 h-3 text-text-muted/40 shrink-0 opacity-0 group-hover:opacity-100" />
                    <p
                      onClick={onClick}
                      className="text-xs font-medium text-text-primary line-clamp-2 cursor-pointer hover:text-accent-primary transition-colors leading-tight"
                    >
                      {content.title || 'Untitled'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 shrink-0 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-text-muted" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit?.(content)} className="text-xs">
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-xs">
                          <ArrowRight className="mr-2 h-3.5 w-3.5" />
                          Move to
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {STAGES.filter(s => s.id !== content.status).map(stage => (
                            <DropdownMenuItem
                              key={stage.id}
                              onClick={() => onMoveToStage?.(content.id, stage.id)}
                              className="text-xs"
                            >
                              {stage.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(content.id)}
                        className="text-xs text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Meta Row: Type + Topic + Date */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      content.type === 'long'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-blue-500/15 text-blue-400'
                    }`}
                  >
                    {content.type === 'long' ? (
                      <><Film className="w-2.5 h-2.5 mr-0.5" />Long</>
                    ) : (
                      <><Video className="w-2.5 h-2.5 mr-0.5" />Short</>
                    )}
                  </Badge>

                  {content.topic && (
                    <span className="text-[10px] text-text-muted truncate max-w-[80px]">
                      {content.topic}
                    </span>
                  )}

                  <span className="flex-1" />

                  {formattedDate && (
                    <span className={`text-[10px] flex items-center gap-0.5 ${content.isOverdue ? 'text-red-400' : 'text-text-muted'}`}>
                      <Calendar className="w-2.5 h-2.5" />
                      {formattedDate}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p className="font-medium text-sm mb-1">{content.title || 'Untitled'}</p>
          <div className="text-xs text-text-muted space-y-0.5">
            <p>{content.type === 'long' ? 'Long Video' : 'Short'} • {content.topic || 'No topic'}</p>
            {formattedDate && <p>Scheduled: {formattedDate}</p>}
            {content.daysInStage !== undefined && content.status !== 'published' && (
              <p className={getAgeColor(content.daysInStage)}>
                In stage: {getDaysLabel(content.daysInStage)}
              </p>
            )}
            {content.isOverdue && <p className="text-red-400 font-medium">⚠ Overdue</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

export default PipelineCard
