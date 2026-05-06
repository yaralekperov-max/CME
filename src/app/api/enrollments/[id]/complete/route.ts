import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'

const schema = z.object({
  certificateFileUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const enrollment = await db.enrollment.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, courseId: true, status: true, course: { select: { nmoPoints: true, title: true } } },
  })

  if (!enrollment || enrollment.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (enrollment.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 })
  }

  if (enrollment.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Enrollment is cancelled' }, { status: 409 })
  }

  const certUrl = parsed.data.certificateFileUrl || null

  await db.$transaction([
    db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPct: 100,
        ...(certUrl ? { certificateFileUrl: certUrl } : {}),
      },
    }),
    db.pointsTransaction.create({
      data: {
        userId: session.user.id,
        courseId: enrollment.courseId,
        points: enrollment.course.nmoPoints,
        type: 'EARNED',
        description: `Курс завершён: ${enrollment.course.title}`,
      },
    }),
  ])

  await invalidate(`points:${session.user.id}`)

  return NextResponse.json({ ok: true })
}
