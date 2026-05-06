import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Минимум 8 символов'),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { token, password } = parsed.data
  const userId = await redis.get(`reset:${token}`)

  if (!userId) {
    return NextResponse.json(
      { error: 'Ссылка недействительна или истекла' },
      { status: 400 },
    )
  }

  const passwordHash = await hash(password, 12)
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  await redis.del(`reset:${token}`)

  return NextResponse.json({ ok: true })
}
