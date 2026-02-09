import { motion } from 'framer-motion'
import { Button } from './button'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateAction {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline'
}

interface EmptyStateProps {
    icon?: LucideIcon
    title?: ReactNode
    description?: ReactNode
    action?: EmptyStateAction
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 px-4"
        >
            {Icon && (
                <div className="mb-4 p-4 rounded-full bg-bg-tertiary">
                    <Icon className="w-12 h-12 text-text-muted" />
                </div>
            )}

            {title && (
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {title}
                </h3>
            )}

            {description && (
                <p className="text-sm text-text-muted mb-6 text-center max-w-md">
                    {description}
                </p>
            )}

            {action && (
                <Button
                    onClick={action.onClick}
                    variant={action.variant || 'primary'}
                >
                    {action.label}
                </Button>
            )}
        </motion.div>
    )
}
