import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AdminTopbarProps {
  title: string
}

export function AdminTopbar({ title }: AdminTopbarProps) {
  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-[22px] py-3 flex items-center gap-3.5 flex-shrink-0">
      <h1 className="text-[16px] font-bold font-display text-[var(--text)] tracking-[-0.02em]">
        {title}
      </h1>
      <div className="relative max-w-[300px] flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text3)] text-[13px]">🔍</span>
        <input
          type="text"
          placeholder="Поиск по платформе..."
          className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[var(--border)] rounded-[var(--r-sm,6px)] bg-[var(--surface2)] text-[var(--text)] outline-none focus:border-[var(--accent-dim,var(--accent))] placeholder:text-[var(--text3)]"
        />
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" className="px-3">🔔</Button>
        <Link href="/admin/courses/new">
          <Button variant="primary">＋ Добавить курс</Button>
        </Link>
      </div>
    </header>
  )
}
