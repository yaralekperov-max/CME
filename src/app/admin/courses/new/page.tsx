import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { NewCourseForm } from './new-course-form'

export const metadata: Metadata = { title: 'Добавить курс' }

export default async function NewCoursePage() {
  const organizations = await db.organization.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <>
      <AdminTopbar title="Добавить курс" />
      <main className="flex-1 overflow-y-auto p-[20px_22px]">
        <NewCourseForm organizations={organizations} />
      </main>
    </>
  )
}
