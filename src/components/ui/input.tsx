import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { className?: string }
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { className?: string }

const base =
  'w-full px-3 py-2 text-[13px] border border-[var(--border)] rounded-[var(--r-sm,8px)] bg-[var(--surface2)] text-[var(--text)] outline-none font-sans transition-colors focus:border-[var(--accent-mid,var(--accent))] placeholder:text-[var(--text3)]'

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(base, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(base, 'resize-y min-h-[80px]', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn(base, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}

interface FormGroupProps {
  label: string
  children: React.ReactNode
  className?: string
  hint?: string
}

export function FormGroup({ label, children, className, hint }: FormGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.05em]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
    </div>
  )
}
