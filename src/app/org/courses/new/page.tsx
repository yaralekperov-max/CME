import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { NewCourseForm } from '@/app/admin/courses/new/new-course-form'

export const metadata: Metadata = { title: 'Добавить курс' }

export default async function OrgNewCoursePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.organizationId) redirect('/login')

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { id: true, name: true },
  })
  if (!org) redirect('/login')

  return (
    <>
      <AdminTopbar title="Добавить курс" />
      <main className="flex-1 overflow-y-auto p-[20px_22px]">
        <NewCourseForm organizations={[org]} defaultOrganizationId={org.id} />
      </main>
    </>
  )
}
