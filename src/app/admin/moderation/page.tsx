import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { ModerationCard } from '@/components/admin/moderation-card'

export const metadata: Metadata = { title: 'Модерация' }

export default async function ModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

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
          <Alert variant="warn">
            ⚠️ {courses.length} {courses.length === 1 ? 'курс ожидает' : 'курса ожидают'} проверки перед публикацией
          </Alert>
        )}
        {courses.length === 0 && (
          <Alert variant="success">✓ Нет курсов, ожидающих модерации</Alert>
        )}

        {courses.map((course) => (
          <ModerationCard key={course.id} course={course} />
        ))}

      </main>
    </>
  )
}
