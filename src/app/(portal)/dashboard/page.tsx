import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { MetricCard, ProgressBar } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatPrice, formatShortDate, getAccreditationRisk } from '@/lib/utils'

export const metadata: Metadata = { title: 'Обзор' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = session.user.id

  const [user, pointsResult, activeEnrollment, upcomingCourses] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, specialization: true, accreditationDeadline: true, pointsRequired: true },
    }),
    db.pointsTransaction.aggregate({
      where: { userId, type: 'EARNED' },
      _sum: { points: true },
    }),
    db.enrollment.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: { course: { select: { title: true, nmoPoints: true } } },
      orderBy: { enrolledAt: 'desc' },
    }),
    db.course.findMany({
      where: { status: 'PUBLISHED', deadlineDate: { gte: new Date() } },
      orderBy: { deadlineDate: 'asc' },
      take: 3,
      include: { organization: { select: { name: true } } },
    }),
  ])

  const pointsEarned = pointsResult._sum.points ?? 0
  const pointsRequired = user?.pointsRequired ?? 250
  const pointsRemaining = Math.max(0, pointsRequired - pointsEarned)
  const deadline = user?.accreditationDeadline ?? null
  const progressPct = Math.round((pointsEarned / pointsRequired) * 100)

  const monthsLeft = deadline
    ? Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
    : null

  const pacePerYear = 43 // TODO: calculate from actual history
  const risk = deadline ? getAccreditationRisk(pointsEarned, pointsRequired, deadline) : 'ok'

  return (
    <>
      <PortalTopbar title="Обзор" />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {risk !== 'ok' && (
          <Alert variant={risk === 'critical' ? 'error' : 'warn'}>
            ⚠️
            <div>
              <strong>Риск не успеть:</strong> при текущем темпе {pacePerYear} балла/год вам не хватит
              ~{Math.max(0, pointsRequired - Math.round(pointsEarned + pacePerYear / 12 * (monthsLeft ?? 0)))} баллов к дедлайну.{' '}
              <Link href="/app/ai" className="underline text-[var(--accent)]">
                AI-ассистент подобрал план →
              </Link>
            </div>
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3.5">
          <MetricCard
            label="Баллов набрано"
            value={pointsEarned}
            sub={`из ${pointsRequired} за 5 лет`}
            progress={progressPct}
            progressColor="accent"
            trend={`${progressPct}% выполнено`}
            trendColor={progressPct < 40 ? 'warn' : 'up'}
          />
          <MetricCard
            label="Осталось набрать"
            value={pointsRemaining}
            sub={deadline ? `до ${new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(deadline)}` : ''}
            progress={Math.round((pointsRemaining / pointsRequired) * 100)}
            progressColor="amber"
            trend={monthsLeft ? `~${monthsLeft} мес. в запасе` : ''}
            trendColor="warn"
          />
          <MetricCard
            label="Темп набора"
            value={pacePerYear}
            sub="баллов в год сейчас"
            progress={Math.round((pacePerYear / 55) * 100)}
            progressColor={pacePerYear >= 55 ? 'green' : 'red'}
            trend={pacePerYear >= 55 ? 'Хороший темп' : 'Нужно 55/год'}
            trendColor={pacePerYear >= 55 ? 'up' : 'down'}
          />
          <MetricCard
            label="Активных курсов"
            value={activeEnrollment ? 1 : 0}
            sub={activeEnrollment ? activeEnrollment.course.title.slice(0, 28) + '…' : 'Нет активных курсов'}
            progress={activeEnrollment ? 50 : 0}
            progressColor="green"
            trend={activeEnrollment ? '50% выполнено' : ''}
            trendColor="up"
          />
        </div>

        {/* Progress ring + Deadlines */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <CardTitle className="mb-3">
              <span>Прогресс аккредитации</span>
              <Link href="/app/points" className="text-[12px] font-medium text-[var(--accent)]">
                Детали →
              </Link>
            </CardTitle>
            <Card className="p-5">
              <div className="flex items-center gap-5">
                <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface2)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none" stroke="var(--accent)" strokeWidth="10"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * progressPct) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)" fontFamily="Manrope">{pointsEarned}</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="11" fill="var(--text3)" fontFamily="Inter">из {pointsRequired}</text>
                </svg>
                <div className="flex-1">
                  <div className="mb-3.5">
                    <div className="text-[12px] text-[var(--text3)] mb-1">Дедлайн аккредитации</div>
                    <div className="text-[18px] font-bold text-[var(--text)] font-display">
                      {deadline
                        ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(deadline)
                        : 'Не указан'}
                    </div>
                    {monthsLeft && <div className="text-[12px] text-[var(--text3)] mt-0.5">~{monthsLeft} мес. в запасе</div>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: 'Зачтено баллов', value: `${pointsEarned} ЗЕТ`, color: 'text-[var(--green)]' },
                      { label: 'Осталось набрать', value: `${pointsRemaining} ЗЕТ`, color: 'text-[var(--amber)]' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between text-[12px]">
                        <span className="text-[var(--text3)]">{label}</span>
                        <span className={`font-semibold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <CardTitle className="mb-3">Дедлайны этого месяца</CardTitle>
            <div className="flex flex-col gap-2.5">
              {upcomingCourses.length === 0 && (
                <Card className="text-[13px] text-[var(--text3)]">Нет ближайших дедлайнов</Card>
              )}
              {upcomingCourses.map((course) => {
                const dl = course.deadlineDate!
                const daysLeft = Math.round((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const urgency = daysLeft <= 14 ? 'urgent' : daysLeft <= 45 ? 'soon' : 'ok'
                const colors = {
                  urgent: { bg: 'bg-[var(--red-bg)]', text: 'text-[var(--red)]' },
                  soon:   { bg: 'bg-[var(--amber-bg)]', text: 'text-[var(--amber)]' },
                  ok:     { bg: 'bg-[var(--green-bg)]', text: 'text-[var(--green)]' },
                }[urgency]

                return (
                  <div key={course.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-3.5 flex items-center gap-3.5 shadow-sm">
                    <div className={`w-11 h-11 rounded-[var(--r-md,12px)] flex flex-col items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <div className={`text-[18px] font-extrabold font-display leading-none ${colors.text}`}>
                        {dl.getDate()}
                      </div>
                      <div className={`text-[9px] font-semibold uppercase tracking-[0.04em] ${colors.text}`}>
                        {dl.toLocaleString('ru-RU', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--text)] truncate font-display">{course.title}</div>
                      <div className="text-[11px] text-[var(--text3)] mt-0.5">
                        {course.organization.name} · {course.nmoPoints} б. · {formatPrice(course.priceKopecks)}
                      </div>
                    </div>
                    <Button variant="primary" size="sm">Записаться</Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI panel */}
        <div className="bg-[var(--surface)] border border-[var(--accent-mid)] rounded-[var(--r-lg,16px)] p-4 shadow-[0_0_0_3px_var(--accent-light)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-sm">✦</div>
            <span className="text-[13px] font-semibold font-display text-[var(--text)]">AI-ассистент</span>
            <span className="text-[12px] text-[var(--text3)] ml-1">персональный план аккредитации</span>
            <span className="ml-auto text-[11px] text-[var(--green)] bg-[var(--green-bg)] px-2 py-0.5 rounded-full">Онлайн</span>
          </div>
          <div className="bg-[var(--accent-light)] rounded-[4px_12px_12px_12px] px-3.5 py-3 text-[13px] text-[var(--text)] leading-relaxed mb-3">
            {session.user.name?.split(' ')[0] ?? 'Доктор'}, вижу риск: при текущем темпе{' '}
            <strong>{pacePerYear} балла/год</strong> вам не хватит баллов к дедлайну. Составил план —
            4 бесплатных онлайн-курса закрывают 74 балла. Хотите запишу на все сразу?
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['✓ Записать на все сразу', '📋 Показать план', '💰 Только бесплатные', '📍 Очные в Москве'].map((chip) => (
              <Link
                key={chip}
                href="/app/ai"
                className="px-3 py-1.5 text-[12px] font-medium border border-[var(--accent-mid)] rounded-full text-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-light)] transition-colors"
              >
                {chip}
              </Link>
            ))}
          </div>
        </div>

      </main>
    </>
  )
}
