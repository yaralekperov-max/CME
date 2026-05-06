'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const navItems = [
  { href: '/admin/dashboard',     icon: '◈',  label: 'Дашборд',         section: 'Обзор',       badge: null },
  { href: '/admin/courses',       icon: '📚', label: 'Курсы',           section: 'Контент',     badge: null },
  { href: '/admin/courses/new',   icon: '＋', label: 'Добавить курс',   section: null,          badge: null },
  { href: '/admin/organizations', icon: '🏛', label: 'Организации',     section: null,          badge: null },
  { href: '/admin/doctors',       icon: '👥', label: 'Врачи',           section: 'Пользователи', badge: null },
  { href: '/admin/moderation',    icon: '⚠️', label: 'Модерация',       section: null,          badge: 'moderation' },
  { href: '/admin/finance',       icon: '💰', label: 'Финансы',         section: 'Финансы',     badge: null },
  { href: '/admin/analytics',     icon: '📊', label: 'Аналитика',       section: null,          badge: null },
]

interface AdminSidebarProps {
  pendingModeration: number
}

export function AdminSidebar({ pendingModeration }: AdminSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  let currentSection: string | null = null

  return (
    <aside className="w-[220px] min-w-[220px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Logo */}
      <div className="px-4.5 py-4 pb-3.5 border-b border-[var(--border)] flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-[var(--accent)] rounded-[8px] flex items-center justify-center text-sm text-white">
          🏥
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold font-display text-[var(--text)]">NMOBALL</span>
          <span className="text-[9px] font-semibold bg-[var(--accent-dim,#3D3680)] text-[var(--accent)] px-1.5 py-0.5 rounded-[4px] tracking-[0.04em]">
            ADMIN
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== currentSection
          if (item.section) currentSection = item.section

          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
          const badgeCount = item.badge === 'moderation' ? pendingModeration : 0

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
                  'flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium rounded-[var(--r-sm,6px)] transition-all',
                  active
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]',
                )}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="text-[10px] font-semibold bg-[var(--red-dim,#7A2020)] text-[var(--red)] rounded-[10px] px-1.5 py-0.5">
                    {badgeCount}
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3.5 py-3 border-t border-[var(--border)] flex items-center gap-2">
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--blue)] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
          {session?.user?.name?.[0] ?? 'А'}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-[var(--text)] truncate">{session?.user?.name ?? 'Администратор'}</div>
          <div className="text-[10px] text-[var(--text3)]">
            {session?.user?.role === 'SUPER_ADMIN' ? 'Суперадмин' : 'Администратор'}
          </div>
        </div>
      </div>
    </aside>
  )
}
