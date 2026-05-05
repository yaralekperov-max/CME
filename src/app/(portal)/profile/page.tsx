import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { ProfileForm } from './profile-form'
import { Card, CardTitle } from '@/components/ui/card'
import { formatDate, getInitials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Профиль' }

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      specialization: true,
      workplace: true,
      city: true,
      snils: true,
      accreditationDeadline: true,
      cycleStartDate: true,
      pointsRequired: true,
      notificationsEnabled: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <>
      <PortalTopbar title="Профиль" showSearch={false} />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 max-w-[720px]">

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B5D4F4] to-[#8AB5E8] flex items-center justify-center text-[22px] font-bold text-[#0C447C] flex-shrink-0">
            {user.name ? getInitials(user.name) : '?'}
          </div>
          <div>
            <div className="text-[18px] font-bold font-display text-[var(--text)]">{user.name}</div>
            <div className="text-[13px] text-[var(--text3)] mt-0.5">{user.specialization} · {user.workplace}</div>
            <div className="text-[11px] text-[var(--text3)] mt-0.5">На платформе с {formatDate(user.createdAt)}</div>
          </div>
        </div>

        <ProfileForm user={user} />

      </main>
    </>
  )
}
