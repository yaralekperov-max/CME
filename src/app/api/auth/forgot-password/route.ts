import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'
import { sendEmail } from '@/lib/email/client'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = await rateLimit({ key: `rate:forgot:${ip}`, limit: 3, windowSec: 3600 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте через час.' },
      { status: 429 },
    )
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
  }

  const { email } = parsed.data

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  })

  // Always return 200 to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true })

  const token = randomBytes(32).toString('hex')
  await redis.setex(`reset:${token}`, 3600, user.id)

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Сброс пароля — NMOBALL',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-family:Manrope,sans-serif;color:#1C1B18">Сброс пароля</h2>
        <p>Уважаемый(ая) ${user.name ?? 'доктор'},</p>
        <p>Мы получили запрос на сброс пароля для вашего аккаунта NMOBALL.</p>
        <p>Ссылка действует <strong>1 час</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#6B5FE4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;margin-bottom:16px">
          Сбросить пароль
        </a>
        <p style="color:#888;font-size:12px">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
