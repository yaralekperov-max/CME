import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/login?verified=error', req.url))
  }

  const userId = await redis.get(`verify:${token}`)
  if (!userId) {
    return NextResponse.redirect(new URL('/login?verified=expired', req.url))
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  })
  await redis.del(`verify:${token}`)

  return NextResponse.redirect(new URL('/login?verified=1', req.url))
}
