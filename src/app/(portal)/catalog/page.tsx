import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import type { CourseFormat, FundingType } from '@/types'

export const metadata: Metadata = { title: 'Каталог курсов' }

const FORMAT_LABELS: Record<CourseFormat, string> = {
  ONLINE: 'Онлайн',
  IN_PERSON: 'Очный',
  WEBINAR: 'Вебинар',
  CONFERENCE: 'Конференция',
}

const FORMAT_COLORS: Record<CourseFormat, 'green' | 'amber' | 'purple' | 'blue'> = {
  ONLINE: 'green',
  IN_PERSON: 'amber',
  WEBINAR: 'blue',
  CONFERENCE: 'purple',
}

const FUNDING_LABELS: Record<FundingType, string> = {
  FREE: 'Бесплатно',
  OMS: 'ОМС',
  PAID: 'Платный',
}

export default async function CatalogPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const courses = await db.course.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      organization: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  const specializations = [
    ...new Set(courses.flatMap((c) => c.specializations)),
  ].sort()

  return (
    <>
      <PortalTopbar title="Каталог курсов" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-5">
          {/* Filters sidebar */}
          <aside className="w-[200px] min-w-[200px] flex flex-col gap-3.5">
            <FilterCard title="Формат">
              {(['ONLINE', 'IN_PERSON', 'WEBINAR', 'CONFERENCE'] as CourseFormat[]).map((f) => (
                <label key={f} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" defaultChecked={f === 'ONLINE'} /> {FORMAT_LABELS[f]}
                </label>
              ))}
            </FilterCard>

            <FilterCard title="Стоимость">
              {(['FREE', 'OMS', 'PAID'] as FundingType[]).map((f) => (
                <label key={f} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" defaultChecked={f !== 'PAID'} /> {FUNDING_LABELS[f]}
                </label>
              ))}
            </FilterCard>

            <FilterCard title="Баллы">
              {[['1–5', false], ['6–15', false], ['16–36', true]].map(([label, checked]) => (
                <label key={String(label)} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" defaultChecked={Boolean(checked)} /> {label} баллов
                </label>
              ))}
            </FilterCard>

            <FilterCard title="Специализация">
              {specializations.slice(0, 6).map((s) => (
                <label key={s} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" /> {s}
                </label>
              ))}
              {specializations.length > 6 && (
                <span className="text-[12px] text-[var(--accent)] cursor-pointer">
                  + ещё {specializations.length - 6}
                </span>
              )}
            </FilterCard>
          </aside>

          {/* Course list */}
          <div className="flex-1 min-w-0 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--text3)]">
                Найдено: <strong className="text-[var(--text)]">{courses.length} курсов</strong>
              </span>
              <select className="text-[12px] border border-[var(--border)] rounded-[var(--r-sm,8px)] px-2.5 py-1.5 bg-[var(--surface)] text-[var(--text)] outline-none">
                <option>По релевантности</option>
                <option>Сначала больше баллов</option>
                <option>Сначала ближайшие</option>
                <option>Сначала бесплатные</option>
              </select>
            </div>

            {courses.length === 0 && (
              <Card className="text-[13px] text-[var(--text3)] text-center py-8">
                Курсы пока не добавлены
              </Card>
            )}

            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4 shadow-sm hover:border-[var(--accent-mid)] hover:shadow-md hover:-translate-y-px transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2.5 mb-2">
                  <h3 className="text-[13px] font-semibold text-[var(--text)] leading-[1.45] font-display">
                    {course.title}
                  </h3>
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
                    <Button variant="primary" size="sm">Записаться</Button>
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

function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-3.5">
      <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] mb-2.5">{title}</div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Card>
  )
}
