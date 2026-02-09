import { memo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Monitor, Pencil, User, FileText, LucideIcon } from 'lucide-react'
import { staggerContainer, staggerItem } from '../../../lib/animations'
import { FormState, Action } from './types'

const STATUS_OPTIONS = [
    { value: 'idea', label: 'Idea', color: '#71717a', description: 'Initial concept' },
    { value: 'script', label: 'Script', color: '#3b82f6', description: 'Writing content' },
    { value: 'recording', label: 'Recording', color: '#f59e0b', description: 'Filming/screen capture' },
    { value: 'editing', label: 'Editing', color: '#06b6d4', description: 'Post-production' },
    { value: 'thumbnail', label: 'Thumbnail', color: '#f97316', description: 'Final touches' },
    { value: 'published', label: 'Published', color: '#22c55e', description: 'Live on YouTube' }
]

const VIDEO_VARIANT_ICONS: Record<string, LucideIcon> = {
    'monitor': Monitor,
    'pencil': Pencil,
    'user': User,
    'file-text': FileText
}

const DEFAULT_VIDEO_VARIANTS = [
    { id: 'cozy-screen', name: 'Cozy Screen', icon: 'monitor', color: '#3B82F6', description: 'Faceless, VS Code, lo-fi music' },
    { id: 'whiteboard', name: 'Whiteboard', icon: 'pencil', color: '#F59E0B', description: 'Hand-drawn explainer style' },
    { id: 'slides-face', name: 'Slides + Face', icon: 'user', color: '#10B981', description: 'Minimal slides, face in corner' },
    { id: 'notion-doc', name: 'Notion Doc', icon: 'file-text', color: '#06B6D4', description: 'Aesthetic doc scroll, voiceover' }
]

interface VideoVariant {
    id: string
    name: string
    icon: string
    color: string
    description: string
}

interface ScheduleStepProps {
    formState: FormState
    dispatch: React.Dispatch<Action>
    videoVariants?: VideoVariant[]
}

export const ScheduleStep = memo(function ScheduleStep({
    formState,
    dispatch,
    videoVariants = DEFAULT_VIDEO_VARIANTS
}: ScheduleStepProps) {
    const handleFieldChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'SET_FIELD', field, value: e.target.value })
    }

    const handleStatusClick = (status: string) => {
        dispatch({ type: 'SET_FIELD', field: 'status', value: status })
    }

    const handleVariantClick = (variantId: string) => {
        dispatch({
            type: 'SET_FIELD',
            field: 'videoVariant',
            value: formState.videoVariant === variantId ? '' : variantId
        })
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            {/* Status Selection - Mini Pipeline */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-3">
                    Current Status
                </label>
                <div className="flex items-center justify-between gap-1 p-2 bg-bg-tertiary rounded-xl">
                    {STATUS_OPTIONS.map((status, index) => {
                        const isSelected = formState.status === status.value
                        const isPast = STATUS_OPTIONS.findIndex(s => s.value === formState.status) > index

                        return (
                            <motion.button
                                key={status.value}
                                type="button"
                                onClick={() => handleStatusClick(status.value)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                  relative flex-1 py-2 px-1 rounded-lg text-center
                  transition-glow
                  ${isSelected ? 'ring-pulse' : ''}
                `}
                                style={{
                                    backgroundColor: isSelected ? `${status.color}20` : 'transparent',
                                    color: isSelected || isPast ? status.color : 'var(--color-text-muted)'
                                }}
                            >
                                <span className="text-xs font-medium block truncate">
                                    {status.label}
                                </span>

                                {/* Active dot */}
                                {isSelected && (
                                    <motion.span
                                        layoutId="statusDot"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                )}
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>

            {/* Scheduled Date */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                    <Calendar size={14} className="inline mr-2 text-text-muted" />
                    Scheduled Date
                </label>
                <motion.input
                    type="date"
                    value={formState.scheduledDate}
                    onChange={handleFieldChange('scheduledDate')}
                    whileFocus={{ scale: 1.01 }}
                    className="
            w-full px-4 py-3 rounded-xl
            bg-bg-tertiary border-2 border-border
            text-text-primary
            focus:outline-none focus:border-accent-primary focus-glow
            transition-glow text-sm
          "
                />
            </motion.div>

            {/* Video Style */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-3">
                    Video Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {videoVariants.map((variant) => {
                        const IconComponent = VIDEO_VARIANT_ICONS[variant.icon] || Monitor
                        const isSelected = formState.videoVariant === variant.id

                        return (
                            <motion.button
                                key={variant.id}
                                type="button"
                                onClick={() => handleVariantClick(variant.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                  p-3 rounded-xl border-2 text-left
                  transition-glow
                  ${isSelected
                                        ? 'border-current glow-active'
                                        : 'border-border bg-bg-tertiary hover:border-border/80'
                                    }
                `}
                                style={{
                                    borderColor: isSelected ? variant.color : undefined,
                                    backgroundColor: isSelected ? `${variant.color}10` : undefined
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: isSelected ? variant.color : 'var(--color-bg-secondary)',
                                            color: isSelected ? 'white' : 'var(--color-text-muted)'
                                        }}
                                    >
                                        <IconComponent size={16} />
                                    </div>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: isSelected ? variant.color : 'var(--color-text-primary)' }}
                                    >
                                        {variant.name}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted line-clamp-1 pl-10">
                                    {variant.description}
                                </p>
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
})
