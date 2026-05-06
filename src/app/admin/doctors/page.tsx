import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { MetricCard, ProgressBar } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { getAccreditationRisk, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Врачи' }

const FILTERS = ['Все врачи', 'Активные', 'Новые (7 дней)', 'Риск не успеть'] as const
type FilterKey = typeof FILTERS[number]

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const activeFilter: FilterKey = (FILTERS as readonly string[]).includes(searchParams.filter ?? '')
    ? (searchParams.filter as FilterKey)
    : 'Все врачи'

  const baseWhere = { role: 'DOCTOR' as const }
  const filterWhere =
    activeFilter === 'Активные'
      ? { ...baseWhere, sessions: { some: { expires: { gte: thirtyDaysAgo } } } }
      : activeFilter === 'Новые (7 дней)'
      ? { ...baseWhere, createdAt: { gte: sevenDaysAgo } }
      : baseWhere

  const [total, newThisMonth, activeThisMonth, doctors] = await Promise.all([
    db.user.count({ where: baseWhere }),
    db.user.count({ where: { ...baseWhere, createdAt: { gte: monthStart } } }),
    db.user.count({ where: { ...baseWhere, sessions: { some: { expires: { gte: thirtyDaysAgo } } } } }),
    db.user.findMany({
      where: filterWhere,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        workplace: true,
        accreditationDeadline: true,
        pointsRequired: true,
        createdAt: true,
        pointsTransactions: {
          where: { type: 'EARNED' },
          select: { points: true },
        },
      },
    }),
  ])

  const doctorsWithRisk = doctors.map((doc) => {
    const earned = doc.pointsTransactions.reduce((s, t) => s + t.points, 0)
    const risk = doc.accreditationDeadline
      ? getAccreditationRisk(earned, doc.pointsRequired, doc.accreditationDeadline)
      : 'ok'
    return { ...doc, earned, risk }
  })

  const filtered = activeFilter === 'Риск не успеть'
    ? doctorsWithRisk.filter((d) => d.risk !== 'ok')
    : doctorsWithRisk

  const atRiskCount = doctorsWithRisk.filter((d) => d.risk !== 'ok').length

  function filterHref(f: FilterKey) {
    return f === 'Все врачи' ? '/admin/doctors' : `/admin/doctors?filter=${encodeURIComponent(f)}`
  }

  return (
    <>
      <AdminTopbar title="Врачи" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const active = activeFilter === f
            return (
              <a
                key={f}
                href={filterHref(f)}
                className={`px-3 py-1.5 text-[12px] font-medium border rounded-full transition-colors ${active ? 'bg-[var(--accent-light)] border-[var(--accent-dim,var(--accent))] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-dim,var(--accent))] hover:text-[var(--accent)]'}`}
              >
                {f}
              </a>
            )
          })}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Всего врачей" value={total.toLocaleString('ru-RU')} trend={`↑ +${newThisMonth} за месяц`} trendColor="up" />
          <MetricCard label="Активных (30 дней)" value={activeThisMonth} sub={`${Math.round((activeThisMonth / Math.max(total, 1)) * 100)}% retention`} />
          <MetricCard label="Новых за месяц" value={newThisMonth} trendColor="up" trend="↑ Рост аудитории" />
          <MetricCard label="Риск не успеть" value={atRiskCount} sub="требуют внимания" trendColor={atRiskCount > 0 ? 'warn' : 'up'} />
        </div>

        <Card>
          <CardTitle action={
            <a href="/api/admin/doctors/export-csv" className="text-[var(--accent)] text-[12px] hover:underline">
              Экспорт CSV →
            </a>
          }>
            Список врачей — {filtered.length}
          </CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Врач</Th>
                <Th>Специализация</Th>
                <Th>Место работы</Th>
                <Th>Баллов</Th>
                <Th>Статус</Th>
                <Th>Регистрация</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((doc) => {
                const pct = Math.round((doc.earned / doc.pointsRequired) * 100)
                return (
                  <Tr key={doc.id}>
                    <Td>
                      <div className="font-medium">{doc.name ?? '—'}</div>
                      <div className="text-[11px] text-[var(--text3)] font-mono mt-0.5">{doc.email}</div>
                    </Td>
                    <Td className="text-[var(--text2)]">{doc.specialization ?? '—'}</Td>
                    <Td className="text-[var(--text2)]">{doc.workplace ?? '—'}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{doc.earned}/{doc.pointsRequired}</span>
                        <ProgressBar
                          value={pct}
                          color={doc.risk === 'ok' ? 'green' : doc.risk === 'warn' ? 'amber' : 'red'}
                          className="w-[60px]"
                        />
                      </div>
                    </Td>
                    <Td>
                      <Badge color={doc.risk === 'ok' ? 'green' : doc.risk === 'warn' ? 'amber' : 'red'}>
                        {doc.risk === 'ok' ? 'На плане' : doc.risk === 'warn' ? 'Риск' : 'Критично'}
                      </Badge>
                    </Td>
                    <Td className="text-[var(--text2)]">{formatDate(doc.createdAt)}</Td>
                  </Tr>
                )
              })}
              {filtered.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={6}>Нет врачей</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
