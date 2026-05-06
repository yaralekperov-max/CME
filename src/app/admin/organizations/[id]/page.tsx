import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatPrice, formatDate } from '@/lib/utils'
import { FORMAT_LABELS, FORMAT_COLORS } from '@/lib/constants'
import type { CourseFormat, CourseStatus } from '@/types'

const STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Черновик', MODERATION: 'На модерации', PUBLISHED: 'Опубликован',
  REJECTED: 'Отклонён', ARCHIVED: 'Архив',
}
const STATUS_COLOR: Record<CourseStatus, 'gray' | 'amber' | 'green' | 'red' | 'blue'> = {
  DRAFT: 'gray', MODERATION: 'amber', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'blue',
}
const ORG_STATUS_COLOR = { ACTIVE: 'green', CONNECTING: 'amber', SUSPENDED: 'red' } as const

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const org = await db.organization.findUnique({ where: { id: params.id }, select: { name: true } })
  return { title: org?.name ?? 'Организация' }
}

export default async function OrgDetailPage({ params }: { params: { id: string } }) {
  const org = await db.organization.findUnique({
    where: { id: params.id },
    include: {
      courses: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { enrollments: true } } },
      },
    },
  })

  if (!org) notFound()

  const totalRevenue = org.courses.reduce((sum, c) => {
    return sum + c.priceKopecks * c._count.enrollments
  }, 0)
  const totalEnrollments = org.courses.reduce((sum, c) => sum + c._count.enrollments, 0)
  const publishedCount = org.courses.filter((c) => c.status === 'PUBLISHED').length

  return (
    <>
      <AdminTopbar title={org.name} />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        {/* Header card */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] bg-[var(--accent-light)] flex items-center justify-center text-[18px] font-bold text-[var(--accent)] flex-shrink-0">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[18px] font-bold font-display text-[var(--text)]">{org.name}</div>
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--accent)] hover:underline">
                    {org.website}
                  </a>
                )}
                <div className="text-[12px] text-[var(--text3)] mt-0.5">На платформе с {formatDate(org.createdAt)}</div>
              </div>
            </div>
            <Badge color={ORG_STATUS_COLOR[org.status]}>
              {org.status === 'ACTIVE' ? 'Активна' : org.status === 'CONNECTING' ? 'Подключается' : 'Приостановлена'}
            </Badge>
          </div>

          {org.description && (
            <p className="mt-3 text-[13px] text-[var(--text2)] leading-[1.6]">{org.description}</p>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-4">
            {[
              { label: 'Контакт', value: org.contactName ?? '—' },
              { label: 'Email', value: org.contactEmail ?? '—' },
              { label: 'Телефон', value: org.contactPhone ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[11px] text-[var(--text3)] mb-0.5">{label}</div>
                <div className="text-[13px] text-[var(--text2)]">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Курсов всего', value: org.courses.length },
            { label: 'Опубликовано', value: publishedCount },
            { label: 'Записей', value: totalEnrollments },
            {
              label: 'Выручка',
              value: totalRevenue > 0
                ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalRevenue / 100)
                : '0 ₽',
            },
          ].map(({ label, value }) => (
            <Card key={label} className="p-3.5">
              <div className="text-[11px] text-[var(--text3)] mb-1">{label}</div>
              <div className="text-[22px] font-bold font-display text-[var(--text)]">{value}</div>
            </Card>
          ))}
        </div>

        {/* Courses table */}
        <Card>
          <CardTitle action={
            <Link href={`/admin/courses/new`} className="text-[12px] text-[var(--accent)] hover:underline">
              + Добавить курс
            </Link>
          }>
            Курсы организации — {org.courses.length}
          </CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Курс</Th>
                <Th>Формат</Th>
                <Th>Баллы</Th>
                <Th>Цена</Th>
                <Th>Записей</Th>
                <Th>Статус</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {org.courses.map((course) => (
                <Tr key={course.id}>
                  <Td className="max-w-[220px]">
                    <div className="font-medium truncate">{course.title}</div>
                    <div className="text-[11px] text-[var(--text3)]">{formatDate(course.createdAt)}</div>
                  </Td>
                  <Td>
                    <Badge color={FORMAT_COLORS[course.format as CourseFormat]}>
                      {FORMAT_LABELS[course.format as CourseFormat]}
                    </Badge>
                  </Td>
                  <Td><span className="font-semibold text-[var(--accent)]">{course.nmoPoints}</span></Td>
                  <Td className="text-[var(--text2)]">{formatPrice(course.priceKopecks)}</Td>
                  <Td className="font-medium">{course._count.enrollments}</Td>
                  <Td><Badge color={STATUS_COLOR[course.status as CourseStatus]}>{STATUS_LABEL[course.status as CourseStatus]}</Badge></Td>
                  <Td>
                    <Link href={`/admin/courses/${course.id}/edit`}>
                      <button className="px-2.5 py-1 text-[11px] rounded-[5px] border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">
                        Ред.
                      </button>
                    </Link>
                  </Td>
                </Tr>
              ))}
              {org.courses.length === 0 && (
                <Tr><Td colSpan={7} className="text-[var(--text3)]">Нет курсов</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
