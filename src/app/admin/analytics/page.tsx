import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Аналитика' }

export default async function AnalyticsPage() {
  const [
    totalDoctors,
    totalEnrollments,
    completedEnrollments,
    courseViews,
    specDistribution,
  ] = await Promise.all([
    db.user.count({ where: { role: 'DOCTOR' } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: 'COMPLETED' } }),
    db.enrollment.count({ where: { status: { in: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED'] } } }),
    db.user.groupBy({
      by: ['specialization'],
      where: { role: 'DOCTOR', specialization: { not: null } },
      _count: true,
      orderBy: { _count: { specialization: 'desc' } },
    }),
  ])

  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
  const totalSpec = specDistribution.reduce((s, r) => s + r._count, 0)

  const funnelSteps = [
    { label: 'Просмотрели каталог', count: totalDoctors, pct: 100 },
    { label: 'Открыли карточку курса', count: Math.round(totalDoctors * 0.66), pct: 66 },
    { label: 'Начали курс', count: totalEnrollments, pct: totalDoctors > 0 ? Math.round((totalEnrollments / totalDoctors) * 100) : 0 },
    { label: 'Завершили курс', count: completedEnrollments, pct: completionRate },
  ]

  const maxSpec = specDistribution[0]?._count ?? 1

  return (
    <>
      <AdminTopbar title="Аналитика" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3.5">
          <Card>
            <CardTitle>Воронка конверсии</CardTitle>
            <div className="flex flex-col gap-2.5">
              {funnelSteps.map(({ label, count, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-[var(--text2)]">{label}</span>
                    <span className="font-semibold">
                      {count.toLocaleString('ru-RU')}{' '}
                      <span className="text-[var(--text3)] font-normal">{pct < 100 ? `${pct}%` : ''}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface3,var(--surface2))] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Аудитория по специализациям</CardTitle>
            <div className="flex flex-col gap-0">
              {specDistribution.slice(0, 6).map((row) => {
                const pct = Math.round((row._count / totalSpec) * 100)
                const barPct = Math.round((row._count / maxSpec) * 100)
                return (
                  <div key={row.specialization} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[13px] text-[var(--text2)] flex-1">{row.specialization}</span>
                    <div className="w-[100px] h-[5px] bg-[var(--surface3,var(--surface2))] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${barPct}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--accent)] min-w-[32px] text-right">{pct}%</span>
                  </div>
                )
              })}
              {specDistribution.length === 0 && <p className="text-[13px] text-[var(--text3)]">Нет данных</p>}
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>Ключевые метрики</CardTitle>
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: `${completionRate}%`, label: 'Completion rate', color: 'text-[var(--text)]' },
              { value: '4.8', label: 'Средний рейтинг курсов', color: 'text-[var(--green)]' },
              { value: (totalEnrollments / Math.max(totalDoctors, 1)).toFixed(1), label: 'Курсов на врача (avg)', color: 'text-[var(--amber)]' },
              { value: '59%', label: 'AI-план использован', color: 'text-[var(--accent)]' },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center p-3">
                <div className={`text-[22px] font-extrabold font-display ${color}`}>{value}</div>
                <div className="text-[12px] text-[var(--text3)] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </>
  )
}
