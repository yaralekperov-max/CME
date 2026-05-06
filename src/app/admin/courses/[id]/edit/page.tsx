import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { EditCourseForm } from './edit-course-form'

export const metadata: Metadata = { title: 'Редактировать курс' }

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const [course, organizations] = await Promise.all([
    db.course.findUnique({
      where: { id: params.id },
      select: {
        id: true, title: true, description: true, organizationId: true,
        format: true, specializations: true, durationHours: true,
        deadlineDate: true, nmoPoints: true, nmoAccreditationNumber: true,
        externalUrl: true, fundingType: true, priceKopecks: true,
        maxParticipants: true, status: true,
      },
    }),
    db.organization.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!course) notFound()

  return (
    <>
      <AdminTopbar title={`Редактировать: ${course.title}`} />
      <main className="flex-1 overflow-y-auto p-[20px_22px]">
        <EditCourseForm course={course} organizations={organizations} />
      </main>
    </>
  )
}
