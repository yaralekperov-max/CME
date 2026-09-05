import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatPrice } from '@/lib/utils'
import { FORMAT_LABELS, FORMAT_COLORS } from '@/lib/constants'
import type { CourseStatus } from '@/types'

export const metadata: Metadata = { title: 'Курсы' }

const STATUS_LABEL: Record<CourseStatus, string> = { DRAFT: 'Черновик', MODERATION: 'На модерации', PUBLISHED: 'Опубликован', REJECTED: 'Отклонён', ARCHIVED: 'Архив' }
const STATUS_COLOR: Record<CourseStatus, 'gray' | 'amber' | 'green' | 'red' | 'blue'> = { DRAFT: 'gray', MODERATION: 'amber', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'blue' }

const FILTERS: { label: string; value: CourseStatus | 'ALL' }[] = [
  { label: 'Все', value: 'ALL' },
  { label: 'Опубликованные', value: 'PUBLISHED' },
  { label: 'Черновики', value: 'DRAFT' },
  { label: 'На модерации', value: 'MODERATION' },
]

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const statusParam = searchParams.status
  const validValues = FILTERS.map((f) => f.value) as string[]
  const activeStatus = validValues.includes(statusParam ?? '') ? statusParam : undefined

  const courses = await db.course.findMany({
    where: activeStatus && activeStatus !== 'ALL' ? { status: activeStatus as CourseStatus } : {},
    include: {
      organization: { select: { name: true } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { status: 'COMPLETED' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeTab = statusParam ?? 'ALL'

  function filterHref(val: string) {
    return val === 'ALL' ? '/admin/courses' : `/admin/courses?status=${val}`
  }

  return (
    <>
      <AdminTopbar title="Курсы" />
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
            <Link href="/admin/courses/new">
              <Button variant="primary" size="sm">＋ Добавить курс</Button>
            </Link>
          }>
            {activeTab === 'ALL' ? `Все курсы` : STATUS_LABEL[activeTab as CourseStatus]} — {courses.length}
          </CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Курс</Th>
                <Th>Организация</Th>
                <Th>Баллы</Th>
                <Th>Формат</Th>
                <Th>Цена</Th>
                <Th>Записей</Th>
                <Th>Завершили</Th>
                <Th>Статус</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <Tr key={course.id}>
                  <Td className="max-w-[200px]">
                    <div className="font-medium truncate">{course.title}</div>
                    <div className="text-[11px] text-[var(--text3)] mt-0.5">
                      {course.durationHours} ч.{course.deadlineDate ? ` · до ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(course.deadlineDate)}` : ''}
                    </div>
                  </Td>
                  <Td className="text-[var(--text2)]">{course.organization.name}</Td>
                  <Td><span className="font-semibold text-[var(--accent)]">{course.nmoPoints}</span></Td>
                  <Td><Badge color={FORMAT_COLORS[course.format]}>{FORMAT_LABELS[course.format]}</Badge></Td>
                  <Td className="text-[var(--text2)]">{formatPrice(course.priceKopecks)}</Td>
                  <Td className="font-medium">{course._count.enrollments}</Td>
                  <Td className="text-[var(--text2)]">{course.enrollments.length}</Td>
                  <Td><Badge color={STATUS_COLOR[course.status]}>{STATUS_LABEL[course.status]}</Badge></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--surface3,var(--surface2))] hover:text-[var(--text)] transition-colors">Ред.</button>
                      </Link>
                      {course.status === 'MODERATION' && (
                        <Link href="/admin/moderation">
                          <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Рев.</button>
                        </Link>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
              {courses.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={9}>Курсов нет</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
