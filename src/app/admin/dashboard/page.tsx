import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { MetricCard } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Дашборд' }

export default async function AdminDashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalDoctors,
    newDoctorsThisMonth,
    totalCourses,
    pendingModeration,
    totalOrgs,
    recentUsers,
    topCourses,
    orgStatuses,
  ] = await Promise.all([
    db.user.count({ where: { role: 'DOCTOR' } }),
    db.user.count({ where: { role: 'DOCTOR', createdAt: { gte: monthStart } } }),
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.course.count({ where: { status: 'MODERATION' } }),
    db.organization.count(),
    db.user.findMany({
      where: { role: 'DOCTOR' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, specialization: true, createdAt: true },
    }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    }),
    db.organization.findMany({
      take: 6,
      include: { _count: { select: { courses: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <>
      <AdminTopbar title="Дашборд" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        {pendingModeration > 0 && (
          <Alert variant="info">
            📋 {pendingModeration} {pendingModeration === 1 ? 'курс ожидает' : 'курса ожидают'} модерации ·{' '}
            <Link href="/admin/moderation" className="underline">Перейти →</Link>
          </Alert>
        )}

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Врачей" value={totalDoctors.toLocaleString('ru-RU')} sub="зарегистрировано" trend={`↑ +${newDoctorsThisMonth} за месяц`} trendColor="up" />
          <MetricCard label="Курсов" value={totalCourses} sub="активных на платформе" />
          <MetricCard label="Организаций" value={totalOrgs} sub="партнёров" />
          <MetricCard label="На модерации" value={pendingModeration} sub="ожидают проверки" trendColor={pendingModeration > 0 ? 'warn' : 'up'} trend={pendingModeration > 0 ? 'Требует внимания' : 'Всё проверено'} />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Card>
            <CardTitle>Топ курсов по записям</CardTitle>
            <div className="flex flex-col gap-0">
              {topCourses.map((course) => {
                const maxCount = topCourses[0]?._count.enrollments ?? 1
                const pct = Math.round((course._count.enrollments / maxCount) * 100)
                return (
                  <div key={course.id} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[13px] text-[var(--text2)] flex-1 truncate">{course.title}</span>
                    <div className="w-[100px] h-[5px] bg-[var(--surface3,var(--surface2))] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--accent)] min-w-[28px] text-right">{course._count.enrollments}</span>
                  </div>
                )
              })}
              {topCourses.length === 0 && <p className="text-[13px] text-[var(--text3)]">Нет данных</p>}
            </div>
          </Card>

          <Card>
            <CardTitle action={<Link href="/admin/doctors" className="text-[var(--accent)]">Все →</Link>}>
              Последние регистрации
            </CardTitle>
            <Table>
              <Thead>
                <Tr>
                  <Th>Врач</Th>
                  <Th>Специализация</Th>
                  <Th>Дата</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentUsers.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.name ?? '—'}</Td>
                    <Td className="text-[var(--text2)]">{u.specialization ?? '—'}</Td>
                    <Td className="text-[var(--text2)]">{formatDate(u.createdAt)}</Td>
                  </Tr>
                ))}
                {recentUsers.length === 0 && (
                  <Tr><Td className="text-[var(--text3)]" colSpan={3}>Нет врачей</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardTitle action={<Link href="/admin/organizations" className="text-[var(--accent)]">Все →</Link>}>
            Организации — статус
          </CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Организация</Th>
                <Th>Курсов</Th>
                <Th>Статус</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orgStatuses.map((org) => (
                <Tr key={org.id}>
                  <Td className="font-medium">{org.name}</Td>
                  <Td className="text-[var(--text2)]">{org._count.courses}</Td>
                  <Td>
                    <Badge color={org.status === 'ACTIVE' ? 'green' : org.status === 'SUSPENDED' ? 'red' : 'amber'}>
                      {org.status === 'ACTIVE' ? 'Активна' : org.status === 'SUSPENDED' ? 'Заблокирована' : 'Подключается'}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              {orgStatuses.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={3}>Нет организаций</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
