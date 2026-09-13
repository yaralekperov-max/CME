'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MobileNavButton } from '@/components/portal/mobile-nav'
import { cn } from '@/lib/utils'

interface TopbarProps {
  title: string
  showSearch?: boolean
}

export function PortalTopbar({ title, showSearch = true }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isCatalog = pathname.startsWith('/app/catalog') && !pathname.includes('/app/catalog/')
  const initialQ = isCatalog ? (searchParams.get('q') ?? '') : ''
  const [q, setQ] = useState(initialQ)

  // Sync input when URL changes (e.g. navigating back to catalog)
  useEffect(() => {
    setQ(isCatalog ? (searchParams.get('q') ?? '') : '')
  }, [isCatalog, searchParams])

  // Пуш делаем только когда пользователь реально что-то набрал: на первом рендере
  // эффект иначе уводит с любой страницы портала на каталог.
  const typed = useRef(false)

  // Debounce search: wait 350ms after typing, then update URL
  useEffect(() => {
    if (!showSearch) return
    if (!typed.current) return
    const timer = setTimeout(() => {
      const params = new URLSearchParams(
        isCatalog ? searchParams.toString() : '',
      )
      if (q) {
        params.set('q', q)
      } else {
        params.delete('q')
      }
      router.push(`/app/catalog?${params.toString()}`)
    }, 350)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 flex-shrink-0">
      <MobileNavButton />

      <h1
        className={cn(
          'text-[15px] sm:text-[16px] font-bold font-display text-[var(--text)] tracking-[-0.02em] whitespace-nowrap truncate',
          // Когда есть поиск, на узких экранах заголовок уступает ему место
          showSearch && 'hidden md:block',
        )}
      >
        {title}
      </h1>

      {showSearch && (
        <div className="flex-1 md:max-w-[360px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)] text-sm">
            🔍
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => {
              typed.current = true
              setQ(e.target.value)
            }}
            placeholder="Поиск курсов и организаций"
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[var(--border)] rounded-[var(--r-md,12px)] bg-[var(--surface2)] text-[var(--text)] outline-none focus:border-[var(--accent-mid)] focus:bg-[var(--surface)] placeholder:text-[var(--text3)]"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" className="hidden sm:inline-flex px-3">🔔</Button>
        <Link href="/app/ai">
          <Button variant="ai" size="md">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] pulse-dot" />
            {/* На узких экранах в шапке нет места на подпись */}
            <span className="hidden sm:inline">AI-ассистент</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
