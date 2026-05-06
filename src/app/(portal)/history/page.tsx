import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { ProgressBar } from '@/components/ui/progress'
import { FORMAT_LABELS } from '@/lib/constants'
import type { EnrollmentStatus } from '@/types'

export const metadata: Metadata = { title: 'История обучения' }

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  ENROLLED: 'Записан',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
}

const STATUS_COLOR: Record<EnrollmentStatus, 'blue' | 'purple' | 'green' | 'gray'> = {
  ENROLLED: 'blue',
  IN_PROGRESS: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'gray',
}

const STATUS_FILTERS: { label: string; value: EnrollmentStatus | 'ALL' }[] = [
  { label: 'Все', value: 'ALL' },
  { label: 'Завершённые', value: 'COMPLETED' },
  { label: 'В процессе', value: 'IN_PROGRESS' },
  { label: 'Отменённые', value: 'CANCELLED' },
]

const MONTHS_RU = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК']

const NOW_YEAR = new Date().getFullYear()
const YEAR_FILTERS = [NOW_YEAR, NOW_YEAR - 1, NOW_YEAR - 2, NOW_YEAR - 3].map(String)

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { status?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const statusParam = searchParams.status as EnrollmentStatus | undefined
  const yearParam = searchParams.year

  const validStatus = STATUS_FILTERS.map((f) => f.value).includes(statusParam as EnrollmentStatus)
    ? statusParam
    : undefined
  const activeStatus = validStatus && validStatus !== 'ALL' ? validStatus : undefined

  const yearStart = yearParam && YEAR_FILTERS.includes(yearParam)
    ? new Date(`${yearParam}-01-01`)
    : undefined
  const yearEnd = yearStart ? new Date(`${Number(yearParam) + 1}-01-01`) : undefined

  const enrollments = await db.enrollment.findMany({
    where: {
      userId: session.user.id,
      ...(activeStatus ? { status: activeStatus } : {}),
      ...(yearStart ? { enrolledAt: { gte: yearStart, lt: yearEnd } } : {}),
    },
    include: {
      course: {
        include: { organization: { select: { name: true } } },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  const completed = enrollments.filter((e) => e.status === 'COMPLETED')
  const totalPoints = completed.reduce((sum, e) => sum + e.course.nmoPoints, 0)

  function filterHref(key: string, val: string) {
    const p = new URLSearchParams({
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.year ? { year: searchParams.year } : {}),
      [key]: val,
    })
    if (key === 'status' && val === 'ALL') p.delete('status')
    if (key === 'year' && val === 'all') p.delete('year')
    const qs = p.toString()
    return `/app/history${qs ? `?${qs}` : ''}`
  }

  const activeStatusTab = searchParams.status ?? 'ALL'
  const activeYearTab = searchParams.year ?? 'all'

  return (
    <>
      <PortalTopbar title="История обучения" />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ label, value }) => {
              const active = activeStatusTab === value
              return (
                <a
                  key={value}
                  href={filterHref('status', value)}
                  className={`px-3 py-1.5 text-[12px] font-medium border rounded-full transition-colors ${active ? 'bg-[var(--accent-light)] border-[var(--accent-mid)] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-mid)] hover:text-[var(--accent)]'}`}
                >
                  {label}
                </a>
              )
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[...YEAR_FILTERS, 'all'].map((y) => {
              const active = activeYearTab === y
              return (
                <a
                  key={y}
                  href={filterHref('year', y)}
                  className={`px-3 py-1.5 text-[12px] font-medium border rounded-full transition-colors ${active ? 'bg-[var(--accent-light)] border-[var(--accent-mid)] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-mid)] hover:text-[var(--accent)]'}`}
                >
                  {y === 'all' ? 'Все годы' : y}
                </a>
              )
            })}
          </div>
        </div>

        <Alert variant="info">
          ℹ️ Всего в выборке: <strong>{enrollments.length} записей</strong> · Завершено:{' '}
          <strong>{completed.length}</strong> · Суммарно зачтено: <strong>{totalPoints} ЗЕТ</strong>
        </Alert>

        <Card>
          {enrollments.length === 0 && (
            <p className="text-[13px] text-[var(--text3)]">Нет записей по выбранным фильтрам</p>
          )}
          {enrollments.map((enrollment) => {
            const date = enrollment.completedAt ?? enrollment.enrolledAt
            const month = MONTHS_RU[date.getMonth()]
            const year = String(date.getFullYear()).slice(2)
            const isDone = enrollment.status === 'COMPLETED'
            const isActive = enrollment.status === 'IN_PROGRESS'

            const dotBg = isDone
              ? 'bg-[var(--green-bg)]'
              : isActive
              ? 'bg-[var(--accent-light)]'
              : 'bg-[var(--surface2)]'
            const dotText = isDone
              ? 'text-[var(--green)]'
              : isActive
              ? 'text-[var(--accent)]'
              : 'text-[var(--text3)]'

            return (
              <div key={enrollment.id} className="flex items-center gap-3.5 py-3 border-b border-[var(--border)] last:border-b-0">
                <div className={`text-[20px] font-bold min-w-[42px] font-display ${isDone ? 'text-[var(--accent)]' : 'text-[var(--accent-mid)]'}`}>
                  {isDone ? enrollment.course.nmoPoints : '…'}
                </div>

                <div className={`w-[42px] h-[42px] rounded-[var(--r-sm,8px)] flex flex-col items-center justify-center flex-shrink-0 ${dotBg}`}>
                  <div className={`text-[11px] font-bold ${dotText}`}>{month}</div>
                  <div className={`text-[14px] font-extrabold font-display leading-none ${dotText}`}>{year}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text)] truncate font-display">
                    {enrollment.course.title}
                  </div>
                  <div className="text-[11px] text-[var(--text3)] mt-0.5">
                    {enrollment.course.organization.name} · {enrollment.course.durationHours} ч. ·{' '}
                    {FORMAT_LABELS[enrollment.course.format]}
                  </div>
                  {isActive && (
                    <ProgressBar value={enrollment.progressPct} color="accent" className="mt-1.5 max-w-[200px]" />
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={STATUS_COLOR[enrollment.status]}>{STATUS_LABEL[enrollment.status]}</Badge>
                  {isDone && <Button variant="ghost" size="sm">Сертификат</Button>}
                  {isActive && <Button variant="primary" size="sm">Продолжить</Button>}
                </div>
              </div>
            )
          })}
        </Card>

      </main>
    </>
  )
}
