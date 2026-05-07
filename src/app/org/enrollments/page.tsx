import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Записи на курсы' }

const STATUS_LABEL: Record<string, string> = { ENROLLED: 'Записан', IN_PROGRESS: 'Проходит', COMPLETED: 'Завершил', CANCELLED: 'Отменён' }
const STATUS_COLOR: Record<string, 'blue' | 'amber' | 'green' | 'gray'> = { ENROLLED: 'blue', IN_PROGRESS: 'amber', COMPLETED: 'green', CANCELLED: 'gray' }

const FILTERS = ['Все', 'Проходит', 'Завершил', 'Записан'] as const
type FilterKey = typeof FILTERS[number]

export default async function OrgEnrollmentsPage({ searchParams }: { searchParams: { filter?: string; course?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.organizationId) redirect('/login')
  const orgId = session.user.organizationId

  const activeFilter: FilterKey = (FILTERS as readonly string[]).includes(searchParams.filter ?? '')
    ? (searchParams.filter as FilterKey)
    : 'Все'

  const statusMap: Record<FilterKey, string | undefined> = {
    'Все': undefined,
    'Проходит': 'IN_PROGRESS',
    'Завершил': 'COMPLETED',
    'Записан': 'ENROLLED',
  }

  const [enrollments, orgCourses] = await Promise.all([
    db.enrollment.findMany({
      where: {
        course: { organizationId: orgId },
        ...(statusMap[activeFilter] ? { status: statusMap[activeFilter] as 'IN_PROGRESS' | 'COMPLETED' | 'ENROLLED' } : {}),
        ...(searchParams.course ? { courseId: searchParams.course } : {}),
      },
      include: {
        user: { select: { name: true, email: true, specialization: true } },
        course: { select: { id: true, title: true, nmoPoints: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 200,
    }),
    db.course.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  function filterHref(f: FilterKey) {
    const params = new URLSearchParams()
    if (f !== 'Все') params.set('filter', f)
    if (searchParams.course) params.set('course', searchParams.course)
    return `/org/enrollments${params.size ? '?' + params.toString() : ''}`
  }

  function courseHref(courseId: string | undefined) {
    const params = new URLSearchParams()
    if (activeFilter !== 'Все') params.set('filter', activeFilter)
    if (courseId) params.set('course', courseId)
    return `/org/enrollments${params.size ? '?' + params.toString() : ''}`
  }

  return (
    <>
      <AdminTopbar title="Записи на курсы" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-1.5">
            {FILTERS.map((f) => {
              const active = activeFilter === f
              return (
                <a key={f} href={filterHref(f)}
                  className={`px-3 py-1.5 text-[12px] font-medium border rounded-full transition-colors ${active ? 'bg-[var(--accent-light)] border-[var(--accent-dim,var(--accent))] text-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent-dim,var(--accent))] hover:text-[var(--accent)]'}`}
                >
                  {f}
                </a>
              )
            })}
          </div>

          <select
            defaultValue={searchParams.course ?? ''}
            onChange={undefined}
            className="ml-auto text-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="">Все курсы</option>
            {orgCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <Card>
          <CardTitle>Записи — {enrollments.length}</CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Врач</Th>
                <Th>Курс</Th>
                <Th>Баллы</Th>
                <Th>Статус</Th>
                <Th>Записался</Th>
                <Th>Завершил</Th>
              </Tr>
            </Thead>
            <Tbody>
              {enrollments.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <div className="font-medium">{e.user.name ?? '—'}</div>
                    <div className="text-[11px] text-[var(--text3)] font-mono">{e.user.email}</div>
                    {e.user.specialization && (
                      <div className="text-[11px] text-[var(--text3)]">{e.user.specialization}</div>
                    )}
                  </Td>
                  <Td className="text-[var(--text2)] max-w-[200px]">
                    <div className="truncate">{e.course.title}</div>
                  </Td>
                  <Td><span className="font-semibold text-[var(--accent)]">{e.course.nmoPoints}</span></Td>
                  <Td>
                    <Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                  </Td>
                  <Td className="text-[var(--text2)]">{formatDate(e.enrolledAt)}</Td>
                  <Td className="text-[var(--text2)]">{e.completedAt ? formatDate(e.completedAt) : '—'}</Td>
                </Tr>
              ))}
              {enrollments.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={6}>Записей нет</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
