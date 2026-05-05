import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'
import type { CourseFormat, FundingType, CourseStatus } from '@prisma/client'

const createCourseSchema = z.object({
  title: z.string().min(3).max(300),
  organizationId: z.string().min(1),
  description: z.string().optional(),
  specialization: z.string().optional(),
  format: z.enum(['ONLINE', 'IN_PERSON', 'WEBINAR', 'CONFERENCE']),
  durationHours: z.coerce.number().positive().optional(),
  deadlineDate: z.string().optional(),
  nmoPoints: z.coerce.number().int().positive(),
  nmoAccreditationNumber: z.string().optional(),
  externalUrl: z.string().url().startsWith('https://').optional(),
  fundingType: z.enum(['FREE', 'OMS', 'PAID']).default('FREE'),
  priceKopecks: z.coerce.number().int().min(0).default(0),
  maxParticipants: z.coerce.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).default('DRAFT'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { specialization, deadlineDate, durationHours, maxParticipants, ...rest } = parsed.data

  const course = await db.course.create({
    data: {
      ...rest,
      format: rest.format as CourseFormat,
      fundingType: rest.fundingType as FundingType,
      status: rest.status as CourseStatus,
      specializations: specialization ? [specialization] : [],
      durationHours: durationHours ?? null,
      deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
      maxParticipants: maxParticipants ?? null,
      publishedAt: rest.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  // Bust catalog cache
  await invalidate('courses:')

  return NextResponse.json({ data: course }, { status: 201 })
}
