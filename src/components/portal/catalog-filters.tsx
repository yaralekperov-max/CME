'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { noun } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: 'QUALIFICATION', label: 'Повышение квалификации', hint: 'с удостоверением' },
  { value: 'MODULE', label: 'Образовательный модуль', hint: 'баллы НМО' },
  { value: 'EVENT', label: 'Мероприятие', hint: 'конференция, вебинар' },
]

const FORMAT_OPTIONS = [
  { value: 'ONLINE', label: 'Онлайн' },
  { value: 'IN_PERSON', label: 'Очный' },
  { value: 'WEBINAR', label: 'Вебинар' },
  { value: 'CONFERENCE', label: 'Конференция' },
]

const FUNDING_OPTIONS = [
  { value: 'FREE', label: 'Бесплатно' },
  { value: 'OMS', label: 'По ОМС' },
  { value: 'PAID', label: 'Платный' },
]

const POINTS_OPTIONS = [
  { value: '1-5', label: '1–5 баллов' },
  { value: '6-15', label: '6–15 баллов' },
  { value: '16-36', label: '16–36 баллов' },
]

export const SORT_OPTIONS = [
  { value: '', label: 'По релевантности' },
  { value: 'duration', label: 'Сначала объёмные программы' },
  { value: 'points', label: 'Сначала больше баллов' },
  { value: 'deadline', label: 'Сначала ближайшие' },
  { value: 'price', label: 'Сначала бесплатные' },
]

interface Props {
  specializations: string[]
  total: number
}

export function CatalogFilters({ specializations, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const get = (key: string) => searchParams.get(key) ?? ''

  const types = get('type').split(',').filter(Boolean)
  const formats = get('format').split(',').filter(Boolean)
  const fundings = get('funding').split(',').filter(Boolean)
  const points = get('points')
  const specs = get('spec').split(',').filter(Boolean)

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleList(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update(key, next.join(','))
  }

  function togglePoints(value: string) {
    update('points', points === value ? '' : value)
  }

  const hasFilters = types.length || formats.length || fundings.length || points || specs.length

  return (
    <aside className="w-[200px] min-w-[200px] flex flex-col gap-3.5">

      {hasFilters ? (
        <button
          onClick={() => router.push(pathname)}
          className="text-[12px] text-[var(--accent)] hover:underline text-left cursor-pointer"
        >
          Сбросить фильтры
        </button>
      ) : null}

      <FilterCard title="Тип программы">
        {TYPE_OPTIONS.map(({ value, label, hint }) => (
          <Checkbox
            key={value}
            label={label}
            hint={hint}
            checked={types.includes(value)}
            onChange={() => toggleList('type', types, value)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Формат">
        {FORMAT_OPTIONS.map(({ value, label }) => (
          <Checkbox
            key={value}
            label={label}
            checked={formats.includes(value)}
            onChange={() => toggleList('format', formats, value)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Стоимость">
        {FUNDING_OPTIONS.map(({ value, label }) => (
          <Checkbox
            key={value}
            label={label}
            checked={fundings.includes(value)}
            onChange={() => toggleList('funding', fundings, value)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Баллы">
        {POINTS_OPTIONS.map(({ value, label }) => (
          <Checkbox
            key={value}
            label={label}
            checked={points === value}
            onChange={() => togglePoints(value)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Специализация">
        {specializations.slice(0, 8).map((s) => (
          <Checkbox
            key={s}
            label={s}
            checked={specs.includes(s)}
            onChange={() => toggleList('spec', specs, s)}
          />
        ))}
        {specializations.length > 8 && (
          <span className="text-[12px] text-[var(--text3)]">+ ещё {specializations.length - 8}</span>
        )}
      </FilterCard>

      <div className="text-[12px] text-[var(--text3)] text-center">
        {total} {noun(total, ['курс', 'курса', 'курсов'])}
      </div>
    </aside>
  )
}

export function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('sort', e.target.value)
    } else {
      params.delete('sort')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={value}
      onChange={onChange}
      className="text-[12px] border border-[var(--border)] rounded-[var(--r-sm,8px)] px-2.5 py-1.5 bg-[var(--surface)] text-[var(--text)] outline-none cursor-pointer"
    >
      {SORT_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}

function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-3.5">
      <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] mb-2.5">{title}</div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Card>
  )
}

function Checkbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-start gap-2 text-[13px] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-[var(--accent)] w-3.5 h-3.5 mt-0.5 flex-shrink-0"
      />
      <span className="leading-[1.35]">
        <span className={checked ? 'text-[var(--text)] font-medium' : 'text-[var(--text2)]'}>{label}</span>
        {hint && <span className="block text-[11px] text-[var(--text3)]">{hint}</span>}
      </span>
    </label>
  )
}

