import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = { title: 'Аналитика' }

const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default async function AnalyticsPage() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalDoctors,
    totalEnrollments,
    completedEnrollments,
    specDistribution,
    totalOrgs,
    publishedCourses,
    revenueData,
    topCourses,
    recentDoctors,
    totalPoints,
  ] = await Promise.all([
    db.user.count({ where: { role: 'DOCTOR' } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: 'COMPLETED' } }),
    db.user.groupBy({
      by: ['specialization'],
      where: { role: 'DOCTOR', specialization: { not: null } },
      _count: true,
      orderBy: { _count: { specialization: 'desc' } },
    }),
    db.organization.count({ where: { status: 'ACTIVE' } }),
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { priceKopecks: true, _count: { select: { enrollments: true } } },
    }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        title: true,
        nmoPoints: true,
        organization: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    }),
    db.user.findMany({
      where: { role: 'DOCTOR', createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    db.pointsTransaction.aggregate({ _sum: { points: true } }),
  ])

  const totalRevenue = revenueData.reduce((s, c) => s + c.priceKopecks * c._count.enrollments, 0)
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
  const avgEnrollments = totalDoctors > 0 ? (totalEnrollments / totalDoctors).toFixed(1) : '0'
  const totalSpec = specDistribution.reduce((s, r) => s + r._count, 0)
  const maxSpec = specDistribution[0]?._count ?? 1

  // Monthly signups for last 6 months
  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyMap.set(`${d.getFullYear()}-${d.getMonth()}`, 0)
  }
  for (const { createdAt } of recentDoctors) {
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  }
  const monthlySignups = Array.from(monthlyMap.entries()).map(([key, count]) => {
    const [y, m] = key.split('-').map(Number)
    return { label: MONTHS_RU[m], count }
  })
  const maxSignups = Math.max(...monthlySignups.map((m) => m.count), 1)

  const funnelSteps = [
    { label: 'Зарегистрировано врачей', count: totalDoctors, pct: 100 },
    { label: 'Записались на курс', count: totalEnrollments, pct: totalDoctors > 0 ? Math.min(Math.round((totalEnrollments / totalDoctors) * 100), 100) : 0 },
    { label: 'Завершили курс', count: completedEnrollments, pct: totalDoctors > 0 ? Math.min(Math.round((completedEnrollments / totalDoctors) * 100), 100) : 0 },
  ]

  return (
    <>
      <AdminTopbar title="Аналитика" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Врачей', value: totalDoctors.toLocaleString('ru-RU') },
            { label: 'Организаций', value: totalOrgs },
            { label: 'Курсов опубликовано', value: publishedCourses },
            { label: 'Выручка', value: totalRevenue > 0 ? formatPrice(totalRevenue) : '0 ₽' },
          ].map(({ label, value }) => (
            <Card key={label} className="p-3.5">
              <div className="text-[11px] text-[var(--text3)] mb-1">{label}</div>
              <div className="text-[22px] font-bold font-display text-[var(--text)]">{value}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Funnel */}
          <Card>
            <CardTitle>Воронка</CardTitle>
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
                  <div className="w-full h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Completion rate', value: `${completionRate}%` },
                { label: 'Курсов на врача', value: avgEnrollments },
                { label: 'ЗЕТ выдано', value: (totalPoints._sum.points ?? 0).toLocaleString('ru-RU') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[18px] font-bold font-display text-[var(--accent)]">{value}</div>
                  <div className="text-[11px] text-[var(--text3)]">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Spec distribution */}
          <Card>
            <CardTitle>Аудитория по специализациям</CardTitle>
            <div className="flex flex-col gap-0">
              {specDistribution.slice(0, 7).map((row) => {
                const pct = Math.round((row._count / totalSpec) * 100)
                const barPct = Math.round((row._count / maxSpec) * 100)
                return (
                  <div key={row.specialization} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[12px] text-[var(--text2)] flex-1 truncate">{row.specialization}</span>
                    <div className="w-[80px] h-[5px] bg-[var(--surface2)] rounded-full overflow-hidden flex-shrink-0">
                      <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${barPct}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--accent)] min-w-[30px] text-right">{pct}%</span>
                  </div>
                )
              })}
              {specDistribution.length === 0 && <p className="text-[13px] text-[var(--text3)]">Нет данных</p>}
            </div>
          </Card>
        </div>

        {/* Monthly signups */}
        <Card>
          <CardTitle>Новые врачи (последние 6 месяцев)</CardTitle>
          <div className="flex items-end gap-2 h-[80px]">
            {monthlySignups.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-[var(--text2)]">{count || ''}</span>
                <div
                  className="w-full rounded-t-[3px] bg-[var(--accent-light)] border-t-2 border-[var(--accent)]"
                  style={{ height: `${Math.max(4, Math.round((count / maxSignups) * 60))}px` }}
                />
                <span className="text-[10px] text-[var(--text3)]">{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top courses */}
        <Card>
          <CardTitle>Топ курсов по записям</CardTitle>
          <div className="flex flex-col gap-0">
            {topCourses.map((course, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
                <span className="text-[13px] font-bold text-[var(--text3)] min-w-[20px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text)] truncate">{course.title}</div>
                  <div className="text-[11px] text-[var(--text3)]">{course.organization.name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-semibold text-[var(--text)]">{course._count.enrollments} записей</div>
                  <div className="text-[11px] text-[var(--accent)]">{course.nmoPoints} ЗЕТ</div>
                </div>
              </div>
            ))}
            {topCourses.length === 0 && <p className="text-[13px] text-[var(--text3)]">Нет данных</p>}
          </div>
        </Card>

      </main>
    </>
  )
}
