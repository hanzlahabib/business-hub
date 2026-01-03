import { motion } from 'framer-motion'

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '' }) {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-accent-primary hover:bg-accent-primary/80 text-white glow-purple',
    secondary: 'bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary border border-border',
    success: 'bg-accent-success hover:bg-accent-success/80 text-white',
    danger: 'bg-accent-danger hover:bg-accent-danger/80 text-white',
    ghost: 'bg-transparent hover:bg-bg-tertiary text-text-muted hover:text-text-primary'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
