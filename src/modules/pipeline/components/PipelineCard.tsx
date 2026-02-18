
import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  MoreHorizontal, Edit, Trash2,
  Calendar, Video, Film, ArrowRight
} from 'lucide-react'
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
}: any) {
  const [isHovered, setIsHovered] = useState(false)

  const formattedDate = content.scheduledDate
    ? format(parseISO(content.scheduledDate), 'MMM d')
    : null

  const isPublished = content.status === 'published'

  return (
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
      <div
        className={`glass-panel p-3 rounded-xl transition-all cursor-pointer group ${content.isOverdue
            ? 'border-l-2 border-l-red-500'
            : 'border-border/20'
          } ${isPublished
            ? 'opacity-60 hover:opacity-100'
            : 'hover:border-accent-primary/50'
          }`}
      >
        {/* Title */}
        <div
          onClick={onClick}
          className="text-[11px] font-bold text-text-primary mb-3 leading-tight line-clamp-2 group-hover:text-accent-primary transition-colors"
        >
          {content.title || 'Untitled'}
        </div>

        {/* Meta Row: Type + Topic + Date + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border flex items-center gap-1 ${content.type === 'long'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
              {content.type === 'long' ? (
                <><Film size={10} /> Long</>
              ) : (
                <><Video size={10} /> Short</>
              )}
            </span>
            {content.topic && (
              <span className="text-[9px] font-bold text-text-muted truncate max-w-[80px]">
                {content.topic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {formattedDate && (
              <span className={`text-[9px] font-bold flex items-center gap-1 ${content.isOverdue ? 'text-red-500' : 'text-text-muted'
                }`}>
                {formattedDate}
              </span>
            )}

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
        </div>
      </div>
    </motion.div>
  )
})

export default PipelineCard
