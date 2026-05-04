import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { AdminSidebar } from '@/components/admin/sidebar'
import { SessionProvider } from '@/components/providers/session-provider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/app/dashboard')

  const pendingModeration = await db.course.count({ where: { status: 'MODERATION' } })

  return (
    <SessionProvider>
      <div className="admin-theme flex h-screen overflow-hidden bg-[var(--bg)]">
        <AdminSidebar pendingModeration={pendingModeration} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
