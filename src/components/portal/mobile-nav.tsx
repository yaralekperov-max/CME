'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Состояние выдвижного меню на мобильных. Сайдбар рендерится в layout, а кнопка
 * «бургер» — в топбаре каждой страницы, поэтому состояние живёт в контексте.
 */
const MobileNavContext = createContext<{
  /** false вне провайдера — тогда кнопка меню не рендерится (админка без сайдбара-шторки). */
  enabled: boolean
  open: boolean
  toggle: () => void
  close: () => void
}>({ enabled: false, open: false, toggle: () => {}, close: () => {} })

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Переход по ссылке в меню должен его закрывать
  useEffect(() => setOpen(false), [pathname])

  // Пока меню открыто, фон не скроллится
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <MobileNavContext.Provider
      value={{ enabled: true, open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}
    >
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  return useContext(MobileNavContext)
}

/** Затемнение под выдвинутым меню. Ниже lg сайдбар — оверлей, выше — обычная колонка. */
export function MobileNavOverlay() {
  const { open, close } = useMobileNav()
  if (!open) return null
  return (
    <div
      onClick={close}
      aria-hidden
      className="lg:hidden fixed inset-0 bg-black/40 z-40"
    />
  )
}

export function MobileNavButton() {
  const { enabled, toggle } = useMobileNav()
  if (!enabled) return null
  return (
    <button
      onClick={toggle}
      aria-label="Меню"
      className="lg:hidden flex-shrink-0 w-9 h-9 -ml-1 rounded-[var(--r-sm,8px)] flex flex-col items-center justify-center gap-[3px] hover:bg-[var(--surface2)] transition-colors"
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[17px] h-[1.5px] bg-[var(--text2)] rounded-full" />
      ))}
    </button>
  )
}
