import { memo, useReducer, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Lightbulb, FileText, Video, Scissors, Image, CheckCircle,
    Plus, AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// @ts-ignore
import { PipelineCard } from './PipelineCard'
import { Content } from '@/hooks/useSchedule'

const STAGES = [
    { id: 'idea', label: 'Ideas', icon: Lightbulb, color: '#94a3b8', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30' },
    { id: 'script', label: 'Script', icon: FileText, color: '#3b82f6', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30' },
    { id: 'recording', label: 'Recording', icon: Video, color: '#f59e0b', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30' },
    { id: 'editing', label: 'Editing', icon: Scissors, color: '#a855f7', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30' },
    { id: 'thumbnail', label: 'Thumbnail', icon: Image, color: '#f97316', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30' },
    { id: 'published', label: 'Published', icon: CheckCircle, color: '#22c55e', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/30' }
] as const

interface DragState {
    draggedItem: Content | null
    dragOverStage: string | null
}

type DragAction =
    | { type: 'DRAG_START'; item: Content }
    | { type: 'DRAG_OVER'; stageId: string | null }
    | { type: 'DRAG_END' }

function dragReducer(state: DragState, action: DragAction): DragState {
    switch (action.type) {
        case 'DRAG_START':
            return { draggedItem: action.item, dragOverStage: null }
        case 'DRAG_OVER':
            return { ...state, dragOverStage: action.stageId }
        case 'DRAG_END':
            return { draggedItem: null, dragOverStage: null }
        default:
            return state
    }
}

interface PipelineBoardProps {
    contents: Content[]
    onEditContent?: (content: Content) => void
    onDeleteContent?: (id: string) => void
    onStatusChange: (id: string, status: Content['status']) => void
    onAddContent?: () => void
    onOpenDetail?: (content: Content) => void
}

export const PipelineBoard = memo(function PipelineBoard({
    contents,
    onEditContent,
    onDeleteContent,
    onStatusChange,
    onAddContent,
    onOpenDetail
}: PipelineBoardProps) {
    const [dragState, dispatch] = useReducer(dragReducer, {
        draggedItem: null,
        dragOverStage: null
    })

    // Group contents by stage
    const contentsByStage = useMemo(() => {
        const grouped: Record<string, Content[]> = {}
        STAGES.forEach(stage => {
            grouped[stage.id] = contents.filter(c => c.status === stage.id)
        })
        return grouped
    }, [contents])

    const handleDragStart = useCallback((content: Content) => (e: React.DragEvent) => {
        dispatch({ type: 'DRAG_START', item: content })
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', content.id)
    }, [])

    const handleDragOver = useCallback((stageId: string) => (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        dispatch({ type: 'DRAG_OVER', stageId })
    }, [])

    const handleDragLeave = useCallback(() => {
        dispatch({ type: 'DRAG_OVER', stageId: null })
    }, [])

    const handleDrop = useCallback((stageId: string) => (e: React.DragEvent) => {
        e.preventDefault()
        if (dragState.draggedItem && dragState.draggedItem.status !== stageId) {
            onStatusChange(dragState.draggedItem.id, stageId as Content['status'])
        }
        dispatch({ type: 'DRAG_END' })
    }, [dragState.draggedItem, onStatusChange])

    const handleDragEnd = useCallback(() => {
        dispatch({ type: 'DRAG_END' })
    }, [])

    return (
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                {STAGES.map(stage => {
                    const stageContents = contentsByStage[stage.id] || []
                    const isDragOver = dragState.dragOverStage === stage.id
                    // @ts-ignore - isOverdue might not be on strict Content type but is injected by analytics?
                    // Actually Content interface in useSchedule has [key: string]: any so it should be fine.
                    const overdueCount = stageContents.filter(c => c.isOverdue).length
                    const Icon = stage.icon

                    return (
                        <div
                            key={stage.id}
                            onDragOver={handleDragOver(stage.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop(stage.id)}
                            className={`
                flex flex-col w-[220px] rounded-xl transition-all duration-200 overflow-hidden
                ${isDragOver
                                    ? `${stage.bgClass} border-2 border-dashed ${stage.borderClass}`
                                    : 'bg-bg-secondary/40 border border-border/30'
                                }
              `}
                            style={{ height: 'calc(100vh - 420px)', minHeight: '400px' }}
                        >
                            {/* Column Header */}
                            <div className="p-2.5 border-b border-border/30 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-5 h-5 rounded flex items-center justify-center"
                                            style={{ backgroundColor: `${stage.color}20` }}
                                        >
                                            <Icon className="w-3 h-3" style={{ color: stage.color }} />
                                        </div>
                                        <h3 className="font-medium text-xs text-text-primary">
                                            {stage.label}
                                        </h3>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-bg-tertiary/80 text-text-muted">
                                            {stageContents.length}
                                        </Badge>
                                    </div>
                                    {overdueCount > 0 && (
                                        <Badge variant="danger" className="text-[10px] px-1.5 py-0 h-4">
                                            {overdueCount}!
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Cards Container - Native scroll */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {stageContents.map(content => (
                                        <PipelineCard
                                            key={content.id}
                                            content={content}
                                            isDragging={dragState.draggedItem?.id === content.id}
                                            onDragStart={handleDragStart(content)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => onOpenDetail?.(content)}
                                            onEdit={onEditContent}
                                            onDelete={onDeleteContent}
                                            onMoveToStage={onStatusChange}
                                        />
                                    ))}
                                </AnimatePresence>

                                {/* Empty State */}
                                {stageContents.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`
                      flex flex-col items-center justify-center h-20
                      rounded-lg border-2 border-dashed
                      ${isDragOver ? stage.borderClass : 'border-border/30'}
                      transition-colors
                    `}
                                    >
                                        <p className={`text-xs ${isDragOver ? 'text-text-primary' : 'text-text-muted'}`}>
                                            {isDragOver ? 'Drop here' : 'Empty'}
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Add Button (only for idea stage) */}
                            {stage.id === 'idea' && (
                                <div className="p-2 border-t border-border/30 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 justify-center text-xs text-text-muted hover:text-text-primary"
                                        onClick={() => onAddContent?.()}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

export default PipelineBoard
