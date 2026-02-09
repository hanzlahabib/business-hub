import { memo } from 'react'
import { motion } from 'framer-motion'
import { Check, FileText, Calendar, Settings } from 'lucide-react'

const STEPS = [
    { id: 1, label: 'Basic Info', icon: FileText },
    { id: 2, label: 'Schedule', icon: Calendar },
    { id: 3, label: 'Details', icon: Settings }
]

interface WizardProgressProps {
    currentStep: number
    completedSteps?: number[]
    onStepClick?: (stepId: number) => void
}

export const WizardProgress = memo(function WizardProgress({
    currentStep,
    completedSteps = [],
    onStepClick
}: WizardProgressProps) {
    return (
        <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((step, index) => {
                const isActive = currentStep === step.id
                const isCompleted = completedSteps.includes(step.id)
                const isPast = currentStep > step.id
                const Icon = step.icon

                return (
                    <div
                        key={step.id}
                        className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                    >
                        {/* Step circle */}
                        <motion.button
                            type="button"
                            onClick={() => onStepClick?.(step.id)}
                            disabled={!isCompleted && !isPast && !isActive}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                relative w-12 h-12 rounded-full flex items-center justify-center
                transition-glow cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${isActive ? 'glow-active' : ''}
                ${isCompleted || isPast
                                    ? 'bg-accent-success text-white'
                                    : isActive
                                        ? 'gradient-primary text-white'
                                        : 'bg-bg-tertiary border-2 border-border text-text-muted'
                                }
              `}
                        >
                            {/* Pulse ring for active */}
                            {isActive && (
                                <motion.span
                                    className="absolute inset-0 rounded-full border-2 border-accent-primary"
                                    initial={{ scale: 1, opacity: 1 }}
                                    animate={{
                                        scale: [1, 1.3, 1.3],
                                        opacity: [1, 0, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                />
                            )}

                            {isCompleted || isPast ? (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <Check size={20} strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <Icon size={20} />
                            )}
                        </motion.button>

                        {/* Label below */}
                        <motion.span
                            className={`
                absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
                text-xs font-medium transition-colors
                ${isActive ? 'text-accent-primary' : 'text-text-muted'}
              `}
                            style={{ position: 'relative', marginTop: '8px', marginLeft: '-24px' }}
                        >
                            {step.label}
                        </motion.span>

                        {/* Connecting line */}
                        {index < STEPS.length - 1 && (
                            <div className="flex-1 h-1 mx-3 bg-bg-tertiary rounded-full overflow-hidden relative">
                                {/* Progress fill */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-accent-success rounded-full progress-glow"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: isPast || isCompleted ? '100%' : isActive ? '50%' : '0%'
                                    }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                />

                                {/* Animated dot on the line when in progress */}
                                {isActive && (
                                    <motion.div
                                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-primary"
                                        animate={{
                                            left: ['0%', '50%', '0%'],
                                            opacity: [1, 0.5, 1]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
})
