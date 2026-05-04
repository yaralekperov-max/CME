import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'

const enrollSchema = z.object({
  courseId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const body = await req.json()
  const parsed = enrollSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid request', code: 'VALIDATION' } }, { status: 400 })
  }

  const { courseId } = parsed.data
  const userId = session.user.id

  const course = await db.course.findUnique({
    where: { id: courseId, status: 'PUBLISHED' },
    select: { id: true, maxParticipants: true, priceKopecks: true },
  })

  if (!course) {
    return NextResponse.json({ error: { message: 'Course not found' } }, { status: 404 })
  }

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
  if (existing) {
    return NextResponse.json({ error: { message: 'Already enrolled', code: 'ALREADY_ENROLLED' } }, { status: 409 })
  }

  // Check capacity
  if (course.maxParticipants) {
    const count = await db.enrollment.count({ where: { courseId } })
    if (count >= course.maxParticipants) {
      return NextResponse.json({ error: { message: 'Course is full', code: 'FULL' } }, { status: 409 })
    }
  }

  const enrollment = await db.enrollment.create({
    data: { userId, courseId, status: 'ENROLLED' },
  })

  // Invalidate user points cache
  await invalidate(`points:${userId}`)

  return NextResponse.json({ data: enrollment }, { status: 201 })
}
