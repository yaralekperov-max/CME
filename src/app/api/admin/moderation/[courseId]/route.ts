import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'
import { checkCompliance } from '@/lib/compliance'

const moderateSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  nmoAccreditationNumber: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = moderateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { action, nmoAccreditationNumber, note } = parsed.data

  // Публикация — единственное действие, которое выносит курс врачам, поэтому
  // соответствие проверяем на сервере, а не полагаемся на заблокированную кнопку.
  if (action === 'approve') {
    const existing = await db.course.findUnique({
      where: { id: params.courseId },
      select: {
        courseType: true,
        format: true,
        typicalProgramOrder: true,
        inPersonCity: true,
        organization: { select: { practiceApprovalNumber: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: { message: 'Курс не найден' } }, { status: 404 })
    }

    const blocking = checkCompliance(existing).filter((i) => i.blocking)
    if (blocking.length > 0) {
      return NextResponse.json(
        { error: { message: blocking.map((i) => i.message).join(' ') } },
        { status: 422 },
      )
    }
  }

  const statusMap = {
    approve: 'PUBLISHED',
    reject: 'REJECTED',
    request_changes: 'DRAFT',
  } as const

  const course = await db.course.update({
    where: { id: params.courseId },
    data: {
      status: statusMap[action],
      moderationNote: note,
      ...(nmoAccreditationNumber && { nmoAccreditationNumber }),
      ...(action === 'approve' && { publishedAt: new Date() }),
    },
  })

  await invalidate(`courses:`)

  return NextResponse.json({ data: course })
}
