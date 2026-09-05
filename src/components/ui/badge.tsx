import { cn } from '@/lib/utils'

type Color = 'green' | 'amber' | 'red' | 'purple' | 'blue' | 'gray'

interface BadgeProps {
  color?: Color
  children: React.ReactNode
  className?: string
  title?: string
}

const colorClasses: Record<Color, string> = {
  green:  'bg-[var(--green-bg)] text-[var(--green)]',
  amber:  'bg-[var(--amber-bg)] text-[var(--amber)]',
  red:    'bg-[var(--red-bg)] text-[var(--red)]',
  purple: 'bg-[var(--accent-light)] text-[var(--accent)]',
  blue:   'bg-[var(--blue-bg)] text-[var(--blue)]',
  gray:   'bg-[var(--surface2)] text-[var(--text2)]',
}

export function Badge({ color = 'gray', children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-[5px] whitespace-nowrap',
        colorClasses[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
