import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis/client'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  workplace: z.string().optional(),
  city: z.string().optional(),
  snils: z.string().regex(/^\d{3}-\d{3}-\d{3} \d{2}$/, 'Формат: XXX-XXX-XXX XX').optional().or(z.literal('')),
  accreditationDeadline: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
})

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
      snils: true,
      accreditationDeadline: true,
      cycleStartDate: true,
      pointsRequired: true,
      notificationsEnabled: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ data: user })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Ошибка валидации', fields: parsed.error.flatten().fieldErrors } },
      { status: 400 },
    )
  }

  const { accreditationDeadline, snils, ...rest } = parsed.data

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...rest,
      snils: snils || null,
      accreditationDeadline: accreditationDeadline ? new Date(accreditationDeadline) : undefined,
    },
    select: {
      id: true, name: true, email: true, phone: true,
      specialization: true, workplace: true, city: true,
      snils: true, accreditationDeadline: true, notificationsEnabled: true,
    },
  })

  // Bust points cache since deadline changed
  await invalidate(`points:${session.user.id}`)

  return NextResponse.json({ data: user })
}
