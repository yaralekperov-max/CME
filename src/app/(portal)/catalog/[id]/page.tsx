import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { EnrollButton } from '@/components/portal/enroll-button'
import { CompleteButton } from '@/components/portal/complete-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate, isDeadlineSoon } from '@/lib/utils'
import {
  FORMAT_LABELS,
  FORMAT_COLORS,
  COURSE_TYPE_LABELS,
  COURSE_TYPE_COLORS,
  COURSE_TYPE_HINTS,
} from '@/lib/constants'
import { isTypicalProgramConfirmed } from '@/lib/compliance'
import type { CourseFormat, FundingType } from '@/types'

const FUNDING_LABELS: Record<FundingType, string> = {
  FREE: 'Бесплатно',
  OMS: 'По ОМС',
  PAID: 'Платный',
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await db.course.findUnique({
    where: { id: params.id },
    select: { title: true },
  })
  return { title: course?.title ?? 'Курс' }
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [course, enrollment] = await Promise.all([
    db.course.findUnique({
      where: { id: params.id, status: 'PUBLISHED' },
      include: {
        organization: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: params.id } },
      select: { id: true, status: true },
    }),
  ])

  if (!course) notFound()

  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.status === 'COMPLETED'
  const canComplete = !!enrollment && !isCompleted
  const isFull = course.maxParticipants
    ? course._count.enrollments >= course.maxParticipants
    : false

  const spotsLeft = course.maxParticipants
    ? course.maxParticipants - course._count.enrollments
    : null

  return (
    <>
      <PortalTopbar title="Курс" showSearch={false} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[720px] flex flex-col gap-5">

          <div className="text-[12px] text-[var(--text3)]">
            <Link href="/app/catalog" className="hover:text-[var(--accent)]">Каталог</Link>
            <span className="mx-1.5">›</span>
            <span className="text-[var(--text2)]">{course.title}</span>
          </div>

          <Card>
            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-[18px] font-bold font-display text-[var(--text)] leading-[1.4]">
                {course.title}
              </h1>
              <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-[14px] font-bold bg-[var(--accent-light)] text-[var(--accent)] font-display">
                {course.nmoPoints} б.
              </span>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-3">
              <Badge color={COURSE_TYPE_COLORS[course.courseType]}>
                {COURSE_TYPE_LABELS[course.courseType]}
              </Badge>
              <Badge color={FORMAT_COLORS[course.format]}>{FORMAT_LABELS[course.format]}</Badge>
              {course.fundingType === 'OMS' && <Badge color="blue">ОМС</Badge>}
              {course.specializations.map((s) => (
                <Badge key={s} color="gray">{s}</Badge>
              ))}
            </div>

            <div className="text-[12px] text-[var(--text3)] leading-[1.55] bg-[var(--surface2)] rounded-[var(--r,10px)] px-3 py-2.5 mb-3">
              {COURSE_TYPE_HINTS[course.courseType]}
            </div>

            {isTypicalProgramConfirmed(course) && (
              <div className="flex gap-2.5 text-[12px] leading-[1.55] bg-[var(--green-bg)] rounded-[var(--r,10px)] px-3 py-2.5 mb-3">
                <span className="text-[var(--green)] font-bold flex-shrink-0">✓</span>
                <span className="text-[var(--text2)]">
                  <strong className="text-[var(--green)]">Соответствует типовой программе Минздрава</strong>
                  {course.typicalProgramTitle && <> — «{course.typicalProgramTitle}»</>}
                  , утверждена приказом {course.typicalProgramOrder}. Удостоверение принимается
                  аккредитационной комиссией.
                </span>
              </div>
            )}

            {course.inPersonCity && (
              <div className="flex gap-2.5 text-[12px] leading-[1.55] bg-[var(--amber-bg)] rounded-[var(--r,10px)] px-3 py-2.5 mb-4">
                <span className="flex-shrink-0">📍</span>
                <span className="text-[var(--text2)]">
                  Очная часть проходит в городе <strong className="text-[var(--text)]">{course.inPersonCity}</strong>
                  {course.format === 'BLENDED' && ' — лекции можно пройти дистанционно, но на практику и итоговую аттестацию нужно приехать.'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-5">
              {course.durationHours && (
                <Metric icon="⏱" label="Объём программы" value={`${course.durationHours} часов`} />
              )}
              <Metric icon="🎓" label="Баллы НМО" value={`${course.nmoPoints} ЗЕТ`} />
              <Metric
                icon="👥"
                label="Записалось"
                value={spotsLeft !== null
                  ? `${course._count.enrollments} / ${course.maxParticipants}`
                  : String(course._count.enrollments)}
                sub={spotsLeft !== null && spotsLeft <= 10 && !isEnrolled
                  ? `Осталось ${spotsLeft} мест`
                  : undefined}
                warn={spotsLeft !== null && spotsLeft <= 10}
              />
            </div>

            {(course.startDate || course.deadlineDate) && (
              <div className="flex gap-4 mb-5">
                {course.startDate && (
                  <div className="text-[12px] text-[var(--text2)]">
                    <span className="text-[var(--text3)]">Начало: </span>
                    {formatDate(course.startDate)}
                  </div>
                )}
                {course.deadlineDate && (
                  <div className="text-[12px] text-[var(--text2)]">
                    <span className="text-[var(--text3)]">Дедлайн: </span>
                    <span className={isDeadlineSoon(course.deadlineDate) ? 'text-[var(--red)] font-semibold' : ''}>
                      {formatDate(course.deadlineDate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <div>
                <div className={`text-[20px] font-bold font-display ${course.priceKopecks === 0 ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                  {formatPrice(course.priceKopecks)}
                </div>
                {course.priceKopecks > 0 && (
                  <div className="text-[11px] text-[var(--text3)] mt-0.5">{FUNDING_LABELS[course.fundingType]}</div>
                )}
              </div>
              {isCompleted ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--green-bg)] rounded-[var(--r-md,12px)]">
                  <span className="text-[var(--green)] text-[13px] font-semibold">✓ Завершён · +{course.nmoPoints} ЗЕТ</span>
                </div>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  externalUrl={course.externalUrl}
                  initialEnrolled={isEnrolled}
                  disabled={isFull && !isEnrolled}
                />
              )}
            </div>

            {canComplete && (
              <div className="pt-3 border-t border-[var(--border)]">
                <CompleteButton
                  enrollmentId={enrollment!.id}
                  points={course.nmoPoints}
                />
              </div>
            )}
          </Card>

          {course.description && (
            <Card>
              <CardTitle>О курсе</CardTitle>
              <p className="text-[13px] text-[var(--text2)] leading-[1.65] whitespace-pre-line">
                {course.description}
              </p>
            </Card>
          )}

          {course.nmoAccreditationNumber && (
            <Card>
              <CardTitle>НМО аккредитация</CardTitle>
              <div className="flex flex-col gap-2">
                <Row label="Номер свидетельства" value={course.nmoAccreditationNumber} mono />
                <Row label="Баллы ЗЕТ" value={String(course.nmoPoints)} />
                {course.externalUrl && (
                  <div className="text-[13px] text-[var(--text2)]">
                    <span className="text-[var(--text3)]">Портал НМО: </span>
                    <a
                      href={course.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Открыть на edu.rosminzdrav.ru
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Organization */}
          <Card>
            <CardTitle>Организатор</CardTitle>
            <div className="flex items-start gap-3">
              {course.organization.logoUrl ? (
                <Image
                  src={course.organization.logoUrl}
                  alt={course.organization.name}
                  width={48}
                  height={48}
                  className="rounded-[8px] object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-[8px] bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-[16px] flex-shrink-0">
                  {course.organization.name[0]}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="text-[14px] font-semibold text-[var(--text)] font-display">
                  {course.organization.name}
                </div>
                {course.organization.description && (
                  <p className="text-[12px] text-[var(--text3)] leading-[1.5]">
                    {course.organization.description}
                  </p>
                )}
                {course.organization.website && (
                  <a
                    href={course.organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-[var(--accent)] hover:underline"
                  >
                    {course.organization.website}
                  </a>
                )}
                {course.organization.contactEmail && (
                  <div className="text-[12px] text-[var(--text3)]">
                    {course.organization.contactEmail}
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>
      </main>
    </>
  )
}

function Metric({
  icon, label, value, sub, warn,
}: {
  icon: string
  label: string
  value: string
  sub?: string
  warn?: boolean
}) {
  return (
    <div className="bg-[var(--surface2)] rounded-[var(--r-md,10px)] p-3">
      <div className="text-[18px] mb-1">{icon}</div>
      <div className="text-[11px] text-[var(--text3)] mb-0.5">{label}</div>
      <div className="text-[14px] font-bold font-display text-[var(--text)]">{value}</div>
      {sub && (
        <div className={`text-[11px] mt-0.5 ${warn ? 'text-[var(--red)]' : 'text-[var(--text3)]'}`}>{sub}</div>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-[var(--text3)]">{label}</span>
      <span className={`text-[var(--text2)] ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</span>
    </div>
  )
}
