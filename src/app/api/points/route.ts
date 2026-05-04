import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getOrSet, CACHE_TTL } from '@/lib/redis/client'
import { getAccreditationRisk } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const userId = session.user.id
  const cacheKey = `points:${userId}`

  const summary = await getOrSet(cacheKey, CACHE_TTL.userPoints, async () => {
    const [user, earnedAgg, inProgressEnrollments] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { accreditationDeadline: true, pointsRequired: true },
      }),
      db.pointsTransaction.aggregate({
        where: { userId, type: 'EARNED' },
        _sum: { points: true },
      }),
      db.enrollment.findMany({
        where: { userId, status: 'IN_PROGRESS' },
        include: { course: { select: { nmoPoints: true } } },
      }),
    ])

    const earned = earnedAgg._sum.points ?? 0
    const inProgress = inProgressEnrollments.reduce((s, e) => s + e.course.nmoPoints, 0)
    const required = user?.pointsRequired ?? 250
    const deadline = user?.accreditationDeadline ?? null

    const monthsLeft = deadline
      ? (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      : null

    const pacePerYear = 43 // TODO: calculate from real data

    return {
      earned,
      inProgress,
      required,
      remaining: Math.max(0, required - earned),
      pacePerYear,
      requiredPacePerYear: monthsLeft ? Math.ceil(((required - earned) / monthsLeft) * 12) : 0,
      projectedTotal: monthsLeft ? Math.round(earned + (pacePerYear / 12) * monthsLeft) : earned,
      deadlineDate: deadline?.toISOString() ?? null,
      riskLevel: deadline ? getAccreditationRisk(earned, required, deadline) : 'ok',
    }
  })

  return NextResponse.json({ data: summary })
}
