import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, verificationEmailHtml } from '@/lib/email/client'

const registerSchema = z.object({
  name: z.string().min(2, 'Введите ФИО').max(200),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  specialization: z.string().min(1, 'Выберите специализацию'),
  workplace: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = await rateLimit({ key: `rate:register:${ip}`, limit: 5, windowSec: 3600 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: 'Слишком много попыток. Попробуйте через час.' } },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } },
    )
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Ошибка валидации', fields: parsed.error.flatten().fieldErrors } },
      { status: 400 },
    )
  }

  const { email, password, name, specialization, workplace, city, phone } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: { message: 'Пользователь с таким email уже зарегистрирован', code: 'EMAIL_TAKEN' } },
      { status: 409 },
    )
  }

  const passwordHash = await hash(password, 12)

  const cycleStartDate = new Date()
  const accreditationDeadline = new Date()
  accreditationDeadline.setFullYear(accreditationDeadline.getFullYear() + 5)

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name,
      specialization,
      workplace: workplace || null,
      city: city || null,
      phone: phone || null,
      role: 'DOCTOR',
      cycleStartDate,
      accreditationDeadline,
      pointsRequired: 250,
    },
    select: { id: true, email: true, name: true },
  })

  const token = randomBytes(32).toString('hex')
  await redis.setex(`verify:${token}`, 86400, user.id)
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`
  await sendEmail({
    to: user.email,
    subject: 'Подтвердите email — MedCME',
    html: verificationEmailHtml(user.name ?? 'Доктор', verifyUrl),
  }).catch(() => {})

  return NextResponse.json({ data: user }, { status: 201 })
}
