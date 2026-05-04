import { cn } from '@/lib/utils'

type Variant = 'warn' | 'info' | 'success' | 'error'

interface AlertProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  warn:    'bg-[var(--amber-bg)] text-[var(--amber)] border border-[#F0D080]',
  info:    'bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-mid,var(--accent))]',
  success: 'bg-[var(--green-bg)] text-[var(--green)] border border-[#A8DCC2]',
  error:   'bg-[var(--red-bg)] text-[var(--red)] border border-[var(--red-dim,var(--red))]',
}

export function Alert({ variant = 'info', children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--r-sm,8px)] px-3.5 py-3 text-[13px] flex items-start gap-2.5',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
