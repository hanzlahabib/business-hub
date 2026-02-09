import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    className?: string
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
    const sizeClass = sizeMap[size] || sizeMap.md

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                }}
                className={sizeClass}
            >
                <Loader2 className={`${sizeClass} text-accent-primary`} />
            </motion.div>
            {text && (
                <p className="text-sm text-text-muted animate-pulse">
                    {text}
                </p>
            )}
        </div>
    )
}
