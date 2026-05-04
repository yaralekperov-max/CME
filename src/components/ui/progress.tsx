import { cn } from '@/lib/utils'

type Color = 'accent' | 'green' | 'amber' | 'red'

interface ProgressBarProps {
  value: number // 0–100
  color?: Color
  className?: string
}

const colorClasses: Record<Color, string> = {
  accent: 'bg-[var(--accent)]',
  green:  'bg-[var(--green)]',
  amber:  'bg-[#D4920A]',
  red:    'bg-[var(--red)]',
}

export function ProgressBar({ value, color = 'accent', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full h-[5px] bg-[var(--surface2)] rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', colorClasses[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendColor?: 'up' | 'warn' | 'down'
  progress?: number
  progressColor?: Color
  className?: string
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  trendColor = 'up',
  progress,
  progressColor = 'accent',
  className,
}: MetricCardProps) {
  const trendColorClass = {
    up:   'text-[var(--green)]',
    warn: 'text-[var(--amber)]',
    down: 'text-[var(--red)]',
  }[trendColor]

  return (
    <div className={cn('bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4 shadow-sm', className)}>
      <div className="text-[10px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] mb-1.5">
        {label}
      </div>
      <div className="text-[28px] font-extrabold text-[var(--text)] font-display leading-none">
        {value}
      </div>
      {sub && <div className="text-[12px] text-[var(--text3)] mt-1">{sub}</div>}
      {progress !== undefined && (
        <ProgressBar value={progress} color={progressColor} className="mt-2.5" />
      )}
      {trend && (
        <div className={cn('text-[11px] font-semibold mt-1.5', trendColorClass)}>{trend}</div>
      )}
    </div>
  )
}
