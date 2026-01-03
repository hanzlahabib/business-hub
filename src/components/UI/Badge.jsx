export function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-bg-tertiary text-text-muted',
    primary: 'bg-accent-primary/20 text-accent-primary',
    secondary: 'bg-accent-secondary/20 text-accent-secondary',
    success: 'bg-accent-success/20 text-accent-success',
    warning: 'bg-accent-warning/20 text-accent-warning',
    danger: 'bg-accent-danger/20 text-accent-danger',
    long: 'bg-accent-secondary/20 text-accent-secondary',
    short: 'bg-accent-primary/20 text-accent-primary'
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
