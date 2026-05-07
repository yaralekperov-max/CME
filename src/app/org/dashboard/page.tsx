import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { MetricCard } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatPrice, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Обзор организации' }

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Черновик', MODERATION: 'На модерации', PUBLISHED: 'Опубликован', REJECTED: 'Отклонён', ARCHIVED: 'Архив' }
const STATUS_COLOR: Record<string, 'gray' | 'amber' | 'green' | 'red' | 'blue'> = { DRAFT: 'gray', MODERATION: 'amber', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'blue' }

export default async function OrgDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.organizationId) redirect('/login')
  const orgId = session.user.organizationId

  const [org, courses, recentEnrollments] = await Promise.all([
    db.organization.findUnique({
      where: { id: orgId },
      select: { name: true, contactName: true, contactEmail: true, status: true },
    }),
    db.course.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.enrollment.findMany({
      where: { course: { organizationId: orgId } },
      include: {
        user: { select: { name: true, specialization: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 8,
    }),
  ])

  if (!org) redirect('/login')

  const totalEnrollments = await db.enrollment.count({ where: { course: { organizationId: orgId } } })
  const completedEnrollments = await db.enrollment.count({ where: { course: { organizationId: orgId }, status: 'COMPLETED' } })
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length

  return (
    <>
      <AdminTopbar title="Обзор" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Курсов опубликовано" value={publishedCourses} sub={`из ${courses.length} всего`} />
          <MetricCard label="Всего записей" value={totalEnrollments.toLocaleString('ru-RU')} />
          <MetricCard label="Завершили курс" value={completedEnrollments.toLocaleString('ru-RU')} sub={totalEnrollments > 0 ? `${Math.round((completedEnrollments / totalEnrollments) * 100)}% конверсия` : undefined} />
          <MetricCard label="На модерации" value={courses.filter((c) => c.status === 'MODERATION').length} sub="ожидают проверки" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardTitle action={
              <Link href="/org/courses" className="text-[var(--accent)] text-[12px] hover:underline">
                Все курсы →
              </Link>
            }>
              Последние курсы
            </CardTitle>
            <Table>
              <Thead>
                <Tr>
                  <Th>Курс</Th>
                  <Th>Записей</Th>
                  <Th>Статус</Th>
                </Tr>
              </Thead>
              <Tbody>
                {courses.map((course) => (
                  <Tr key={course.id}>
                    <Td>
                      <div className="font-medium truncate max-w-[180px]">{course.title}</div>
                      <div className="text-[11px] text-[var(--text3)]">{formatPrice(course.priceKopecks)}</div>
                    </Td>
                    <Td className="font-semibold">{course._count.enrollments}</Td>
                    <Td><Badge color={STATUS_COLOR[course.status]}>{STATUS_LABEL[course.status]}</Badge></Td>
                  </Tr>
                ))}
                {courses.length === 0 && (
                  <Tr><Td className="text-[var(--text3)]" colSpan={3}>Курсов пока нет</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Card>

          <Card>
            <CardTitle action={
              <Link href="/org/enrollments" className="text-[var(--accent)] text-[12px] hover:underline">
                Все записи →
              </Link>
            }>
              Последние записи
            </CardTitle>
            <Table>
              <Thead>
                <Tr>
                  <Th>Врач</Th>
                  <Th>Курс</Th>
                  <Th>Дата</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentEnrollments.map((e) => (
                  <Tr key={e.id}>
                    <Td>
                      <div className="font-medium">{e.user.name ?? '—'}</div>
                      <div className="text-[11px] text-[var(--text3)]">{e.user.specialization ?? ''}</div>
                    </Td>
                    <Td className="text-[var(--text2)] truncate max-w-[160px]">{e.course.title}</Td>
                    <Td className="text-[var(--text2)]">{formatDate(e.enrolledAt)}</Td>
                  </Tr>
                ))}
                {recentEnrollments.length === 0 && (
                  <Tr><Td className="text-[var(--text3)]" colSpan={3}>Записей пока нет</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Card>
        </div>

      </main>
    </>
  )
}
