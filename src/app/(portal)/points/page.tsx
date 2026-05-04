import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { MetricCard } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Мои баллы' }

export default async function PointsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = session.user.id

  const [user, transactions, earnedByType, earnedBySpec] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { accreditationDeadline: true, pointsRequired: true },
    }),
    db.pointsTransaction.findMany({
      where: { userId },
      include: { course: { select: { title: true, format: true, specializations: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.pointsTransaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { points: true },
    }),
    db.enrollment.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { course: { select: { specializations: true, nmoPoints: true } } },
    }),
  ])

  const pointsEarned = earnedByType.find((r) => r.type === 'EARNED')?._sum.points ?? 0
  const pointsRequired = user?.pointsRequired ?? 250
  const pointsRemaining = Math.max(0, pointsRequired - pointsEarned)
  const progressPct = Math.round((pointsEarned / pointsRequired) * 100)

  // Points by specialization
  const specMap: Record<string, number> = {}
  earnedBySpec.forEach(({ course }) => {
    course.specializations.forEach((s) => {
      specMap[s] = (specMap[s] ?? 0) + course.nmoPoints
    })
  })
  const specEntries = Object.entries(specMap).sort((a, b) => b[1] - a[1])

  const maxSpec = specEntries[0]?.[1] ?? 1

  // Year bars (last 5 years)
  const yearBars = await getYearlyPoints(userId)

  return (
    <>
      <PortalTopbar title="Мои баллы" />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        <div className="grid grid-cols-4 gap-3.5">
          <MetricCard label="Итого зачтено" value={pointsEarned} sub={`ЗЕТ из ${pointsRequired}`} progress={progressPct} progressColor="accent" />
          <MetricCard label="В процессе" value={0} sub="ЗЕТ ожидается" progress={100} progressColor="accent" />
          <MetricCard label="Темп / год" value={43} sub="нужно 55/год" progress={78} progressColor="amber" trendColor="warn" trend="Ниже нормы" />
          <MetricCard label="Прогноз итога" value={`~${Math.round(pointsEarned + 43 / 12 * 31)}`} sub={`из ${pointsRequired} к дедлайну`} progress={89} progressColor="red" trendColor="down" trend="Риск не успеть" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Card>
            <CardTitle>Динамика по годам</CardTitle>
            <div className="flex items-end gap-2 h-[100px] mb-2">
              {yearBars.map(({ year, points, isCurrent }) => {
                const maxVal = Math.max(...yearBars.map((y) => y.points), 55)
                const h = Math.round((points / maxVal) * 85)
                return (
                  <div key={year} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[11px] text-[var(--text3)]">{points}</span>
                    <div
                      className={`w-full rounded-[4px_4px_0_0] ${isCurrent ? 'bg-[var(--accent)]' : 'bg-[var(--accent-light)] border border-[var(--accent-mid)]'}`}
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-[10px] text-[var(--text3)]">{year}</span>
                  </div>
                )
              })}
            </div>
            <div className="text-[11px] text-[var(--text3)] text-center">Нужный темп: 50 баллов/год</div>
          </Card>

          <Card>
            <CardTitle>По специализациям</CardTitle>
            <div className="flex flex-col gap-0">
              {specEntries.slice(0, 5).map(([spec, pts]) => (
                <div key={spec} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-b-0">
                  <span className="text-[13px] text-[var(--text)] flex-1">{spec}</span>
                  <div className="w-[130px] h-[5px] bg-[var(--surface2)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.round((pts / maxSpec) * 100)}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--accent)] min-w-[40px] text-right font-display">{pts} б.</span>
                </div>
              ))}
              {specEntries.length === 0 && (
                <p className="text-[13px] text-[var(--text3)]">Нет зачтённых баллов</p>
              )}
            </div>
          </Card>
        </div>

        {/* Remaining + CTA */}
        <Card>
          <CardTitle>Что нужно до аккредитации</CardTitle>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Зачтено сейчас', value: `${pointsEarned} ЗЕТ`, bg: 'bg-[var(--surface2)]', color: 'text-[var(--green)]' },
              { label: 'Осталось набрать', value: `${pointsRemaining} ЗЕТ`, bg: 'bg-[var(--amber-bg)]', color: 'text-[var(--amber)]' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} className={`flex justify-between items-center px-3 py-2 ${bg} rounded-[var(--r-sm,8px)]`}>
                <span className="text-[13px] text-[var(--text)]">{label}</span>
                <span className={`text-[14px] font-bold font-display ${color}`}>{value}</span>
              </div>
            ))}
            <Button variant="primary" className="w-full justify-center py-2.5">
              ✦ Построить план набора
            </Button>
          </div>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardTitle action={<span>Все →</span>}>Последние начисления</CardTitle>
          <div>
            {transactions.length === 0 && (
              <p className="text-[13px] text-[var(--text3)]">Нет начислений</p>
            )}
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3.5 py-3 border-b border-[var(--border)] last:border-b-0">
                <span className="text-[20px] font-bold text-[var(--accent)] min-w-[42px] font-display">
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text)] truncate font-display">
                    {tx.course?.title ?? tx.description ?? '—'}
                  </div>
                  <div className="text-[11px] text-[var(--text3)] mt-0.5">{formatDate(tx.createdAt)}</div>
                </div>
                <Badge color="green">Зачтено</Badge>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </>
  )
}

async function getYearlyPoints(userId: string) {
  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 4 + i)

  const results = await Promise.all(
    years.map(async (year) => {
      const start = new Date(`${year}-01-01`)
      const end = new Date(`${year + 1}-01-01`)
      const agg = await db.pointsTransaction.aggregate({
        where: { userId, type: 'EARNED', createdAt: { gte: start, lt: end } },
        _sum: { points: true },
      })
      return { year, points: agg._sum.points ?? 0, isCurrent: year === now.getFullYear() }
    }),
  )
  return results
}
