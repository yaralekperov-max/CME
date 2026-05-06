import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      accreditationDeadline: true,
      cycleStartDate: true,
      pointsRequired: true,
      notificationsEnabled: true,
      createdAt: true,
      enrollments: {
        select: {
          enrolledAt: true,
          completedAt: true,
          status: true,
          certificateFileUrl: true,
          course: { select: { title: true, nmoPoints: true, format: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      },
      pointsTransactions: {
        select: { points: true, type: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), user }, null, 2)

  return new NextResponse(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="medcme-data-${session.user.id}.json"`,
    },
  })
}
