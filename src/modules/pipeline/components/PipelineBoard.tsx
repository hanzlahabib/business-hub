
import { memo, useReducer, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Lightbulb, FileText, Video, Scissors, Image, CheckCircle,
    Plus, AlertTriangle
} from 'lucide-react'
// @ts-ignore
import { PipelineCard } from './PipelineCard'
import { Content } from '@/hooks/useSchedule'

const STAGES = [
    { id: 'idea', label: 'Ideas', icon: Lightbulb, materialIcon: 'lightbulb' },
    { id: 'script', label: 'Script', icon: FileText, materialIcon: 'description' },
    { id: 'recording', label: 'Recording', icon: Video, materialIcon: 'videocam' },
    { id: 'editing', label: 'Editing', icon: Scissors, materialIcon: 'content_cut' },
    { id: 'thumbnail', label: 'Thumbnail', icon: Image, materialIcon: 'image' },
    { id: 'published', label: 'Published', icon: CheckCircle, materialIcon: 'check_circle' }
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
        <div className="grid grid-cols-6 gap-3">
            {STAGES.map(stage => {
                const stageContents = contentsByStage[stage.id] || []
                const isDragOver = dragState.dragOverStage === stage.id
                const overdueCount = stageContents.filter(c => c.isOverdue).length
                const Icon = stage.icon

                return (
                    <div
                        key={stage.id}
                        onDragOver={handleDragOver(stage.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop(stage.id)}
                        className="flex flex-col gap-3"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                <Icon size={14} />
                                {stage.label}
                                <span className="bg-bg-tertiary px-1.5 rounded text-text-muted">
                                    {stageContents.length}
                                </span>
                            </h3>
                            {overdueCount > 0 && (
                                <span className="size-4 rounded-full bg-red-600 text-[9px] font-black text-white flex items-center justify-center">
                                    {overdueCount}!
                                </span>
                            )}
                        </div>

                        {/* Kanban Column */}
                        <div
                            className={`kanban-col rounded-xl p-2 flex flex-col gap-2 border transition-all duration-200 ${isDragOver
                                    ? 'border-accent-primary/50 bg-accent-primary/5'
                                    : 'border-border/30'
                                }`}
                        >
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
                                    className={`flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed transition-colors ${isDragOver ? 'border-accent-primary/50 text-text-primary' : 'border-border/30 text-text-muted'
                                        }`}
                                >
                                    <p className="text-xs">
                                        {isDragOver ? 'Drop here' : 'Empty'}
                                    </p>
                                </motion.div>
                            )}

                            {/* Add Button (only for idea stage) */}
                            {stage.id === 'idea' && (
                                <button
                                    onClick={() => onAddContent?.()}
                                    className="mt-auto py-2 border border-dashed border-border/30 rounded-lg text-[10px] font-bold text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-all flex items-center justify-center gap-1"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
})

export default PipelineBoard
