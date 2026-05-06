import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, verificationEmailHtml } from '@/lib/email/client'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = await rateLimit({ key: `rate:resend-verify:${ip}`, limit: 3, windowSec: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }) // always 200 to prevent enumeration
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: true })

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, emailVerified: true },
  })

  if (!user || user.emailVerified) return NextResponse.json({ ok: true })

  const token = randomBytes(32).toString('hex')
  await redis.setex(`verify:${token}`, 86400, user.id)
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`
  await sendEmail({
    to: user.email,
    subject: 'Подтвердите email — NMOBALL',
    html: verificationEmailHtml(user.name ?? 'Доктор', verifyUrl),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
