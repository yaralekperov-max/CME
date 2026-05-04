import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Input, FormGroup } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import type { CourseFormat } from '@/types'

export const metadata: Metadata = { title: 'Модерация' }

const FORMAT_LABEL: Record<CourseFormat, string> = { ONLINE: 'Онлайн', IN_PERSON: 'Очный', WEBINAR: 'Вебинар', CONFERENCE: 'Конференция' }

export default async function ModerationPage() {
  const courses = await db.course.findMany({
    where: { status: 'MODERATION' },
    include: { organization: { select: { name: true } } },
    orderBy: { updatedAt: 'asc' },
  })

  return (
    <>
      <AdminTopbar title="Модерация" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        {courses.length > 0 && (
          <Alert variant="warn">⚠️ {courses.length} {courses.length === 1 ? 'курс ожидает' : 'курса ожидают'} проверки перед публикацией</Alert>
        )}
        {courses.length === 0 && (
          <Alert variant="success">✓ Нет курсов, ожидающих модерации</Alert>
        )}

        {courses.map((course) => (
          <Card key={course.id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[14px] font-semibold text-[var(--text)] mb-1 font-display">{course.title}</div>
                <div className="text-[12px] text-[var(--text3)]">
                  {course.organization.name} · {course.durationHours} ч. · {course.nmoPoints} баллов ·{' '}
                  {FORMAT_LABEL[course.format]} · {formatPrice(course.priceKopecks)}
                </div>
              </div>
              <Badge color="amber">На модерации</Badge>
            </div>

            {course.description && (
              <div className="bg-[var(--surface2)] rounded-[var(--r-sm,6px)] p-3 mb-3 text-[13px] text-[var(--text2)] leading-relaxed">
                <div className="text-[11px] text-[var(--text3)] mb-1.5 uppercase tracking-[0.05em]">Описание курса</div>
                {course.description}
              </div>
            )}

            {!course.nmoAccreditationNumber && (
              <Alert variant="warn" className="mb-3">⚠️ Номер аккредитации НМО не указан. Баллы не будут зачтены официально.</Alert>
            )}

            <div className="flex gap-3.5 mb-3">
              <FormGroup label="Номер аккредитации НМО" className="flex-1">
                <Input
                  type="text"
                  defaultValue={course.nmoAccreditationNumber ?? ''}
                  placeholder="НМО-2025-КР-00412"
                  className="font-mono"
                />
              </FormGroup>
              <FormGroup label="Комментарий редактора" className="flex-1">
                <Input type="text" placeholder="Необязательно" />
              </FormGroup>
            </div>

            <ModerationActions courseId={course.id} hasAccreditation={!!course.nmoAccreditationNumber} />
          </Card>
        ))}

      </main>
    </>
  )
}

function ModerationActions({ courseId, hasAccreditation }: { courseId: string; hasAccreditation: boolean }) {
  return (
    <div className="flex gap-2">
      <Button variant="success" disabled={!hasAccreditation}>✓ Одобрить и опубликовать</Button>
      <Button variant="danger">✕ Отклонить</Button>
      <Button variant="ghost">Запросить правки</Button>
    </div>
  )
}
