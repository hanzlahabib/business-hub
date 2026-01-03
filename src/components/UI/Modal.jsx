import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-bg-secondary rounded-2xl p-6 w-full ${sizeClass} border border-border shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
