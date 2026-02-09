import { memo } from 'react'
import { motion } from 'framer-motion'
import { Video, Smartphone, LucideIcon } from 'lucide-react'
import { staggerContainer, staggerItem } from '../../../lib/animations'
import { FormState, Action } from './types'

const DEFAULT_TOPICS = [
    'React Hooks',
    'React 19',
    'Performance',
    'Interview Prep',
    'JavaScript',
    'React Basics',
    'AI & Tools',
    'Motivation',
    'Other'
]

interface BasicInfoStepProps {
    formState: FormState
    dispatch: React.Dispatch<Action>
    topics?: string[]
}

export const BasicInfoStep = memo(function BasicInfoStep({
    formState,
    dispatch,
    topics = DEFAULT_TOPICS
}: BasicInfoStepProps) {
    const handleTypeChange = (type: 'long' | 'short') => {
        dispatch({ type: 'SET_FIELD', field: 'type', value: type })
    }

    const handleFieldChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        dispatch({ type: 'SET_FIELD', field, value: e.target.value })
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            {/* Content Type Selection */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-3">
                    Content Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <TypeCard
                        type="long"
                        icon={Video}
                        title="Long Form"
                        description="Full tutorial or deep dive video"
                        isSelected={formState.type === 'long'}
                        onClick={() => handleTypeChange('long')}
                        color="accent-secondary"
                    />
                    <TypeCard
                        type="short"
                        icon={Smartphone}
                        title="Short"
                        description="Quick tip or viral clip"
                        isSelected={formState.type === 'short'}
                        onClick={() => handleTypeChange('short')}
                        color="accent-primary"
                    />
                </div>
            </motion.div>

            {/* Title Input */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                    Title <span className="text-accent-danger">*</span>
                </label>
                <motion.input
                    type="text"
                    value={formState.title}
                    onChange={handleFieldChange('title')}
                    placeholder="e.g., useEffect 5 Mistakes Every React Dev Makes"
                    whileFocus={{ scale: 1.01 }}
                    className="
            w-full px-4 py-3 rounded-xl
            bg-bg-tertiary border-2 border-border
            text-text-primary placeholder:text-text-muted/50
            focus:outline-none focus:border-accent-primary focus-glow
            transition-glow text-sm
          "
                    required
                />
                <p className="mt-1.5 text-xs text-text-muted">
                    Make it catchy and SEO-friendly
                </p>
            </motion.div>

            {/* Topic Selection */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                    Topic
                </label>
                <div className="relative">
                    <select
                        value={formState.topic}
                        onChange={handleFieldChange('topic')}
                        className="
              w-full px-4 py-3 rounded-xl
              bg-bg-tertiary border-2 border-border
              text-text-primary
              focus:outline-none focus:border-accent-primary focus-glow
              transition-glow text-sm
              appearance-none cursor-pointer
            "
                    >
                        <option value="">Select a topic...</option>
                        {topics.map((topic) => (
                            <option key={topic} value={topic}>
                                {topic}
                            </option>
                        ))}
                    </select>
                    {/* Dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                            className="w-4 h-4 text-text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
})

interface TypeCardProps {
    type: string
    icon: LucideIcon
    title: string
    description: string
    isSelected: boolean
    onClick: () => void
    color: string
}

// Type Card Component
const TypeCard = memo(function TypeCard({
    icon: Icon,
    title,
    description,
    isSelected,
    onClick,
    color
}: TypeCardProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
        relative p-4 rounded-xl border-2 text-left
        transition-glow overflow-hidden
        ${isSelected
                    ? `border-${color} bg-${color}/10 glow-active`
                    : 'border-border bg-bg-tertiary hover:border-border/80'
                }
      `}
        >
            {/* Glow background when selected */}
            {isSelected && (
                <motion.div
                    className={`absolute inset-0 bg-${color}/5`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}

            <div className="relative z-10">
                <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center mb-3
          ${isSelected
                        ? `bg-${color} text-white`
                        : 'bg-bg-secondary text-text-muted'
                    }
        `}>
                    <Icon size={20} />
                </div>

                <h3 className={`
          font-semibold text-sm mb-1
          ${isSelected ? `text-${color}` : 'text-text-primary'}
        `}>
                    {title}
                </h3>

                <p className="text-xs text-text-muted line-clamp-2">
                    {description}
                </p>
            </div>

            {/* Checkmark when selected */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
            absolute top-2 right-2 w-5 h-5 rounded-full
            bg-${color} text-white flex items-center justify-center
          `}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
            )}
        </motion.button>
    )
})
