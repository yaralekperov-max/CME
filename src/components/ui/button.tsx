import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'ai'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:opacity-90',
  ghost:   'bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)] hover:bg-[var(--border)] hover:text-[var(--text)]',
  danger:  'bg-[var(--red-bg)] text-[var(--red)] border border-[var(--red-dim,var(--red))] hover:opacity-90',
  success: 'bg-[var(--green-bg)] text-[var(--green)] border border-[var(--green-dim,var(--green))] hover:opacity-90',
  ai:      'bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-mid,var(--accent))] hover:opacity-90',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[6px]',
  md: 'px-[14px] py-2 text-[13px] rounded-[var(--r-md,10px)]',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium font-sans transition-all cursor-pointer border-none leading-none',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
