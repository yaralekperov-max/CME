import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse', className)}>{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)] transition-colors',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-left text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] px-3 py-2 border-b border-[var(--border)]',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-[11px] text-[13px] text-[var(--text)] align-middle', className)}>
      {children}
    </td>
  )
}
