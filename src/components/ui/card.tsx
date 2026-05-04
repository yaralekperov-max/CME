import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4 shadow-sm',
        accent && 'border-[var(--accent-mid)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function CardTitle({ children, action, className }: CardTitleProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3.5', className)}>
      <h3 className="text-[14px] font-semibold text-[var(--text)] font-display">{children}</h3>
      {action && <div className="text-[12px] font-medium text-[var(--accent)] cursor-pointer">{action}</div>}
    </div>
  )
}
