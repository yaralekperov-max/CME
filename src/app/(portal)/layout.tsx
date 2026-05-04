import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalSidebar } from '@/components/portal/sidebar'
import { SessionProvider } from '@/components/providers/session-provider'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const pointsResult = await db.pointsTransaction.aggregate({
    where: { userId: session.user.id, type: 'EARNED' },
    _sum: { points: true },
  })
  const pointsEarned = pointsResult._sum.points ?? 0

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <PortalSidebar pointsEarned={pointsEarned} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
