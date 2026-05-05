import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { EnrollButton } from '@/components/portal/enroll-button'
import { CatalogFilters, SortSelect } from '@/components/portal/catalog-filters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import type { CourseFormat, FundingType } from '@/types'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = { title: 'Каталог курсов' }

const FORMAT_COLORS: Record<CourseFormat, 'green' | 'amber' | 'purple' | 'blue'> = {
  ONLINE: 'green',
  IN_PERSON: 'amber',
  WEBINAR: 'blue',
  CONFERENCE: 'purple',
}

const FORMAT_LABELS: Record<CourseFormat, string> = {
  ONLINE: 'Онлайн',
  IN_PERSON: 'Очный',
  WEBINAR: 'Вебинар',
  CONFERENCE: 'Конференция',
}

const POINTS_RANGES: Record<string, { gte: number; lte: number }> = {
  '1-5':   { gte: 1,  lte: 5  },
  '6-15':  { gte: 6,  lte: 15 },
  '16-36': { gte: 16, lte: 36 },
}

const SORT_MAP: Record<string, Prisma.CourseOrderByWithRelationInput> = {
  points:   { nmoPoints: 'desc' },
  deadline: { deadlineDate: 'asc' },
  price:    { priceKopecks: 'asc' },
}

interface Props {
  searchParams: Record<string, string | string[] | undefined>
}

function parseList(val: string | string[] | undefined): string[] {
  if (!val) return []
  const str = Array.isArray(val) ? val[0] : val
  return str.split(',').filter(Boolean)
}

export default async function CatalogPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const formats = parseList(searchParams.format) as CourseFormat[]
  const fundings = parseList(searchParams.funding) as FundingType[]
  const pointsKey = (Array.isArray(searchParams.points) ? searchParams.points[0] : searchParams.points) ?? ''
  const specs = parseList(searchParams.spec)
  const sortKey = (Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) ?? ''

  const where: Prisma.CourseWhereInput = {
    status: 'PUBLISHED',
    ...(formats.length && { format: { in: formats } }),
    ...(fundings.length && { fundingType: { in: fundings } }),
    ...(POINTS_RANGES[pointsKey] && { nmoPoints: POINTS_RANGES[pointsKey] }),
    ...(specs.length && { specializations: { hasSome: specs } }),
  }

  const orderBy: Prisma.CourseOrderByWithRelationInput =
    SORT_MAP[sortKey] ?? { publishedAt: 'desc' }

  const [courses, myEnrollments, allSpecs] = await Promise.all([
    db.course.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy,
    }),
    db.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { specializations: true },
    }),
  ])

  const enrolledIds = new Set(myEnrollments.map((e) => e.courseId))
  const specializations = [...new Set(allSpecs.flatMap((c) => c.specializations))].sort()

  return (
    <>
      <PortalTopbar title="Каталог курсов" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-5">

          <Suspense>
            <CatalogFilters specializations={specializations} total={courses.length} />
          </Suspense>

          <div className="flex-1 min-w-0 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--text3)]">
                Найдено: <strong className="text-[var(--text)]">{courses.length}</strong>
              </span>
              <Suspense>
                <SortSelect value={sortKey} />
              </Suspense>
            </div>

            {courses.length === 0 && (
              <Card className="text-[13px] text-[var(--text3)] text-center py-10">
                По выбранным фильтрам курсов нет
              </Card>
            )}

            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4 shadow-sm hover:border-[var(--accent-mid)] hover:shadow-md hover:-translate-y-px transition-all"
              >
                <div className="flex justify-between items-start gap-2.5 mb-2">
                  <Link href={`/app/catalog/${course.id}`}>
                    <h3 className="text-[13px] font-semibold text-[var(--text)] leading-[1.45] font-display hover:text-[var(--accent)] transition-colors cursor-pointer">
                      {course.title}
                    </h3>
                  </Link>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[var(--accent-light)] text-[var(--accent)] font-display">
                    {course.nmoPoints} б.
                  </span>
                </div>

                <div className="text-[11px] text-[var(--text3)] mb-2.5 flex items-center gap-1">
                  🏛 {course.organization.name}
                </div>

                <div className="flex gap-3.5 mb-2.5">
                  {course.durationHours && (
                    <span className="text-[11px] text-[var(--text2)] flex items-center gap-1">⏱ {course.durationHours} ч.</span>
                  )}
                  {course.deadlineDate && (
                    <span className="text-[11px] text-[var(--text2)] flex items-center gap-1">
                      📅 до {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(course.deadlineDate)}
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text2)] flex items-center gap-1">
                    👥 {course._count.enrollments}
                  </span>
                </div>

                <div className="flex gap-1.5 flex-wrap mb-3">
                  <Badge color={FORMAT_COLORS[course.format]}>{FORMAT_LABELS[course.format]}</Badge>
                  {course.fundingType === 'OMS' && <Badge color="blue">ОМС</Badge>}
                  {course.specializations.slice(0, 2).map((s) => (
                    <Badge key={s} color="gray">{s}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <span className={`text-[14px] font-bold font-display ${course.priceKopecks === 0 ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                    {formatPrice(course.priceKopecks)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">В избранное</Button>
                    <EnrollButton courseId={course.id} initialEnrolled={enrolledIds.has(course.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
