import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'

const updateCourseSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  description: z.string().optional(),
  specialization: z.string().optional(),
  format: z.enum(['ONLINE', 'IN_PERSON', 'WEBINAR', 'CONFERENCE']).optional(),
  durationHours: z.coerce.number().positive().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  nmoPoints: z.coerce.number().int().positive().optional(),
  nmoAccreditationNumber: z.string().optional().nullable(),
  externalUrl: z.string().url().startsWith('https://').optional().nullable().or(z.literal('')),
  fundingType: z.enum(['FREE', 'OMS', 'PAID']).optional(),
  priceKopecks: z.coerce.number().int().min(0).optional(),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(['DRAFT', 'MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const course = await db.course.findUnique({ where: { id: params.id } })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { specialization, deadlineDate, durationHours, maxParticipants, externalUrl, status, ...rest } = parsed.data

  const wasPublished = course.status === 'PUBLISHED'
  const becomesPublished = status === 'PUBLISHED'

  const updated = await db.course.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(specialization !== undefined ? { specializations: specialization ? [specialization] : [] } : {}),
      ...(deadlineDate !== undefined ? { deadlineDate: deadlineDate ? new Date(deadlineDate) : null } : {}),
      ...(durationHours !== undefined ? { durationHours } : {}),
      ...(maxParticipants !== undefined ? { maxParticipants } : {}),
      ...(externalUrl !== undefined ? { externalUrl: externalUrl || null } : {}),
      ...(status ? { status } : {}),
      ...(!wasPublished && becomesPublished ? { publishedAt: new Date() } : {}),
    },
  })

  await invalidate('courses:')
  return NextResponse.json({ data: updated })
}
