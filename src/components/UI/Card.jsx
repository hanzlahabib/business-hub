import { motion } from 'framer-motion'

export function Card({ children, className = '', onClick, hoverable = false }) {
  const baseClasses = 'bg-bg-secondary rounded-xl border border-border p-4'
  const hoverClasses = hoverable ? 'card-hover cursor-pointer' : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  )
}
