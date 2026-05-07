'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const navItems = [
  { href: '/org/dashboard',   icon: '◈',  label: 'Обзор',        section: 'Главное' },
  { href: '/org/courses',     icon: '📚', label: 'Мои курсы',    section: null },
  { href: '/org/enrollments', icon: '◷',  label: 'Записи',       section: null },
]

export function OrgSidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user
  const initials = user?.name ? getInitials(user.name) : '?'
  let currentSection: string | null = null

  return (
    <aside className="w-[228px] min-w-[228px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
      <div className="px-5 py-5 pb-4 border-b border-[var(--border)] flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[var(--accent)] rounded-[9px] flex items-center justify-center text-white text-base">
          🏛
        </div>
        <div>
          <div className="text-[15px] font-bold font-display text-[var(--text)] tracking-[-0.03em] truncate max-w-[140px]">
            {orgName}
          </div>
          <div className="text-[10px] text-[var(--text3)] mt-0.5">Кабинет организации</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== currentSection
          if (item.section) currentSection = item.section
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <div key={item.href}>
              {showSection && (
                <div className="text-[10px] font-semibold text-[var(--text3)] uppercase tracking-[0.08em] px-2.5 pt-2.5 pb-1">
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded-[12px] transition-all',
                  active
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]',
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-[8px] flex items-center justify-center text-[15px] flex-shrink-0 transition-colors',
                  active ? 'bg-[var(--accent)]' : 'bg-[var(--surface2)]',
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      <div className="px-4 py-3.5 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B5D4F4] to-[#8AB5E8] flex items-center justify-center text-[12px] font-bold text-[#0C447C] flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--text)] font-display truncate">{user?.name ?? 'Менеджер'}</div>
            <div className="text-[11px] text-[var(--text3)] mt-0.5">ORG_MANAGER</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
