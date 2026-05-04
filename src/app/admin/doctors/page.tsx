import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { MetricCard, ProgressBar } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { getAccreditationRisk, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Врачи' }

export default async function AdminDoctorsPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [total, newThisMonth, activeThisMonth, doctors] = await Promise.all([
    db.user.count({ where: { role: 'DOCTOR' } }),
    db.user.count({ where: { role: 'DOCTOR', createdAt: { gte: monthStart } } }),
    db.user.count({
      where: {
        role: 'DOCTOR',
        sessions: { some: { expires: { gte: thirtyDaysAgo } } },
      },
    }),
    db.user.findMany({
      where: { role: 'DOCTOR' },
      orderBy: { createdAt: 'desc' },
      take: 50,
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

  return (
    <>
      <AdminTopbar title="Врачи" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="flex gap-1.5 flex-wrap">
          {['Все врачи', 'Активные', 'Новые (7 дней)', 'Риск не успеть'].map((f) => (
            <span key={f} className={`px-3 py-1.5 text-[12px] font-medium border rounded-full cursor-pointer transition-colors ${f === 'Все врачи' ? 'bg-[var(--accent-light)] border-[var(--accent-dim,var(--accent))] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-dim,var(--accent))] hover:text-[var(--accent)]'}`}>
              {f}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Всего врачей" value={total.toLocaleString('ru-RU')} trend={`↑ +${newThisMonth} за месяц`} trendColor="up" />
          <MetricCard label="Активных (30 дней)" value={activeThisMonth} sub={`${Math.round((activeThisMonth / Math.max(total, 1)) * 100)}% retention`} />
          <MetricCard label="Новых за месяц" value={newThisMonth} trendColor="up" trend="↑ Рост аудитории" />
          <MetricCard label="Риск не успеть" value="—" sub="вычисляется" />
        </div>

        <Card>
          <CardTitle action={<span className="text-[var(--accent)] cursor-pointer">Экспорт CSV →</span>}>
            Список врачей
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
              {doctors.map((doc) => {
                const earned = doc.pointsTransactions.reduce((s, t) => s + t.points, 0)
                const required = doc.pointsRequired
                const pct = Math.round((earned / required) * 100)
                const risk = doc.accreditationDeadline
                  ? getAccreditationRisk(earned, required, doc.accreditationDeadline)
                  : 'ok'

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
                        <span className="font-semibold">{earned}/{required}</span>
                        <ProgressBar
                          value={pct}
                          color={risk === 'ok' ? 'green' : risk === 'warn' ? 'amber' : 'red'}
                          className="w-[60px]"
                        />
                      </div>
                    </Td>
                    <Td>
                      <Badge color={risk === 'ok' ? 'green' : risk === 'warn' ? 'amber' : 'red'}>
                        {risk === 'ok' ? 'На плане' : risk === 'warn' ? 'Риск' : 'Критично'}
                      </Badge>
                    </Td>
                    <Td className="text-[var(--text2)]">{formatDate(doc.createdAt)}</Td>
                  </Tr>
                )
              })}
              {doctors.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={6}>Нет врачей</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
