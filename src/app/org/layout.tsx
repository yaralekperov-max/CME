import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { SessionProvider } from '@/components/providers/session-provider'
import { OrgSidebar } from '@/components/org/sidebar'

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'ORG_MANAGER') redirect('/app/dashboard')
  if (!session.user.organizationId) redirect('/login')

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  })
  if (!org) redirect('/login')

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <OrgSidebar orgName={org.name} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
