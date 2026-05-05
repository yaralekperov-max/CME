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

  try {
    const enrollment = await db.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id: courseId, status: 'PUBLISHED' },
        select: { id: true, maxParticipants: true },
      })

      if (!course) throw new EnrollError('Course not found', 'NOT_FOUND', 404)

      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      })
      if (existing) throw new EnrollError('Already enrolled', 'ALREADY_ENROLLED', 409)

      if (course.maxParticipants !== null) {
        const count = await tx.enrollment.count({ where: { courseId } })
        if (count >= course.maxParticipants) {
          throw new EnrollError('Course is full', 'FULL', 409)
        }
      }

      return tx.enrollment.create({
        data: { userId, courseId, status: 'ENROLLED' },
      })
    })

    await invalidate(`points:${userId}`)
    return NextResponse.json({ data: enrollment }, { status: 201 })
  } catch (err) {
    if (err instanceof EnrollError) {
      return NextResponse.json({ error: { message: err.message, code: err.code } }, { status: err.status })
    }
    throw err
  }
}

class EnrollError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message)
  }
}
