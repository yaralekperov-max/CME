import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatPrice } from '@/lib/utils'
import type { CourseStatus } from '@/types'
import { FORMAT_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Мои курсы' }

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Черновик', MODERATION: 'На модерации', PUBLISHED: 'Опубликован', REJECTED: 'Отклонён', ARCHIVED: 'Архив' }
const STATUS_COLOR: Record<string, 'gray' | 'amber' | 'green' | 'red' | 'blue'> = { DRAFT: 'gray', MODERATION: 'amber', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'blue' }

const FILTERS: { label: string; value: CourseStatus | 'ALL' }[] = [
  { label: 'Все', value: 'ALL' },
  { label: 'Опубликованные', value: 'PUBLISHED' },
  { label: 'Черновики', value: 'DRAFT' },
  { label: 'На модерации', value: 'MODERATION' },
]

export default async function OrgCoursesPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.organizationId) redirect('/login')
  const orgId = session.user.organizationId

  const statusParam = searchParams.status
  const validValues = FILTERS.map((f) => f.value) as string[]
  const activeStatus = validValues.includes(statusParam ?? '') ? statusParam : undefined
  const activeTab = statusParam ?? 'ALL'

  const courses = await db.course.findMany({
    where: {
      organizationId: orgId,
      ...(activeStatus && activeStatus !== 'ALL' ? { status: activeStatus as CourseStatus } : {}),
    },
    include: {
      _count: { select: { enrollments: true } },
      enrollments: { where: { status: 'COMPLETED' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  function filterHref(val: string) {
    return val === 'ALL' ? '/org/courses' : `/org/courses?status=${val}`
  }

  return (
    <>
      <AdminTopbar title="Мои курсы" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ label, value }) => {
            const active = activeTab === value
            return (
              <a
                key={value}
                href={filterHref(value)}
                className={`px-3 py-1.5 text-[12px] font-medium border rounded-full transition-colors ${active ? 'bg-[var(--accent-light)] border-[var(--accent-dim,var(--accent))] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-dim,var(--accent))] hover:text-[var(--accent)]'}`}
              >
                {label}
              </a>
            )
          })}
        </div>

        <Card>
          <CardTitle action={
            <Link href="/org/courses/new">
              <Button variant="primary" size="sm">＋ Добавить курс</Button>
            </Link>
          }>
            Курсы — {courses.length}
          </CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Курс</Th>
                <Th>Баллы</Th>
                <Th>Формат</Th>
                <Th>Цена</Th>
                <Th>Записей</Th>
                <Th>Завершили</Th>
                <Th>Статус</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <Tr key={course.id}>
                  <Td className="max-w-[220px]">
                    <div className="font-medium truncate">{course.title}</div>
                    {course.moderationNote && course.status === 'REJECTED' && (
                      <div className="text-[11px] text-[var(--red)] mt-0.5 truncate">{course.moderationNote}</div>
                    )}
                  </Td>
                  <Td><span className="font-semibold text-[var(--accent)]">{course.nmoPoints}</span></Td>
                  <Td className="text-[var(--text2)]">{FORMAT_LABELS[course.format]}</Td>
                  <Td className="text-[var(--text2)]">{formatPrice(course.priceKopecks)}</Td>
                  <Td className="font-medium">{course._count.enrollments}</Td>
                  <Td className="text-[var(--text2)]">{course.enrollments.length}</Td>
                  <Td><Badge color={STATUS_COLOR[course.status]}>{STATUS_LABEL[course.status]}</Badge></Td>
                  <Td>
                    <Link href={`/admin/courses/${course.id}/edit`}>
                      <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--surface3,var(--surface2))] hover:text-[var(--text)] transition-colors">
                        Ред.
                      </button>
                    </Link>
                  </Td>
                </Tr>
              ))}
              {courses.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={8}>Курсов пока нет. <Link href="/org/courses/new" className="text-[var(--accent)] hover:underline">Добавить первый →</Link></Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
