import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { Button } from './Button'
import { modalBackdrop, modalContent } from '../../lib/animations'

const VARIANTS = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-accent-danger',
    iconBg: 'bg-accent-danger/10',
    buttonVariant: 'danger'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-accent-warning',
    iconBg: 'bg-accent-warning/10',
    buttonVariant: 'warning'
  },
  info: {
    icon: Info,
    iconColor: 'text-accent-primary',
    iconBg: 'bg-accent-primary/10',
    buttonVariant: 'primary'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-accent-success',
    iconBg: 'bg-accent-success/10',
    buttonVariant: 'success'
  }
}

export const AlertDialog = memo(function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  showCancel = true
}) {
  const config = VARIANTS[variant] || VARIANTS.danger
  const Icon = config.icon

  const handleConfirm = useCallback(() => {
    onConfirm?.()
    onClose()
  }, [onConfirm, onClose])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            {...modalBackdrop}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            {...modalContent}
            className="
              relative w-full max-w-md
              bg-bg-secondary rounded-2xl
              border border-border shadow-2xl
              overflow-hidden
            "
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="
                absolute top-4 right-4 p-1.5 rounded-lg
                text-text-muted hover:text-text-primary
                hover:bg-bg-tertiary transition-colors
              "
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className={`p-3 rounded-xl ${config.iconBg}`}
                >
                  <Icon size={24} className={config.iconColor} />
                </motion.div>

                {/* Text */}
                <div className="flex-1 pt-1">
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg font-semibold text-text-primary mb-2"
                  >
                    {title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-text-muted leading-relaxed"
                  >
                    {message}
                  </motion.p>
                </div>
              </div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex gap-3 mt-6"
              >
                {showCancel && (
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    {cancelText}
                  </Button>
                )}
                <Button
                  variant={config.buttonVariant}
                  onClick={handleConfirm}
                  className={`flex-1 ${!showCancel ? 'w-full' : ''}`}
                >
                  {confirmText}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
