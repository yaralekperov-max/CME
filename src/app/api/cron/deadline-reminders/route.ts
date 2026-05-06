import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, deadlineReminderHtml } from '@/lib/email/client'

// Called daily by an external cron (e.g. Yandex Cloud Functions, cron-job.org).
// Secured with CRON_SECRET header.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()

  // Find doctors with deadline in 30 or 7 days (±1 day window to handle daily drift)
  const targets = [30, 7]
  let sent = 0
  let errors = 0

  for (const daysAhead of targets) {
    const from = new Date(now)
    from.setDate(from.getDate() + daysAhead - 1)
    from.setHours(0, 0, 0, 0)

    const to = new Date(from)
    to.setDate(to.getDate() + 1)

    const doctors = await db.user.findMany({
      where: {
        role: 'DOCTOR',
        notificationsEnabled: true,
        emailVerified: { not: null },
        accreditationDeadline: { gte: from, lt: to },
      },
      select: {
        name: true,
        email: true,
        accreditationDeadline: true,
        pointsRequired: true,
        pointsTransactions: {
          where: { type: 'EARNED' },
          select: { points: true },
        },
      },
    })

    await Promise.allSettled(
      doctors.map(async (doc) => {
        const earned = doc.pointsTransactions.reduce((s, t) => s + t.points, 0)
        const pointsLeft = Math.max(0, doc.pointsRequired - earned)
        try {
          await sendEmail({
            to: doc.email,
            subject: `Напоминание: до аккредитации ${daysAhead} дней — NMOBALL`,
            html: deadlineReminderHtml(doc.name ?? 'Доктор', daysAhead, pointsLeft),
          })
          sent++
        } catch {
          errors++
        }
      }),
    )
  }

  return NextResponse.json({ ok: true, sent, errors, ts: now.toISOString() })
}
