import { memo, forwardRef } from 'react'
import { motion } from 'framer-motion'

export const Button = memo(forwardRef(function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}, ref) {
  const baseClasses = `
    font-medium rounded-xl cursor-pointer
    flex items-center justify-center gap-2
    transition-glow disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-accent-primary text-white
      hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]
      active:bg-accent-primary/90
    `,
    secondary: `
      bg-bg-tertiary text-text-primary border border-border
      hover:bg-bg-tertiary/80 hover:border-accent-primary/30
    `,
    success: `
      bg-accent-success text-white
      hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]
      active:bg-accent-success/90
    `,
    warning: `
      bg-accent-warning text-white
      hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]
      active:bg-accent-warning/90
    `,
    danger: `
      bg-accent-danger text-white
      hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]
      active:bg-accent-danger/90
    `,
    ghost: `
      bg-transparent text-text-muted
      hover:bg-bg-tertiary hover:text-text-primary
    `,
    outline: `
      bg-transparent text-accent-primary
      border-2 border-accent-primary
      hover:bg-accent-primary/10
    `
  }

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}))
