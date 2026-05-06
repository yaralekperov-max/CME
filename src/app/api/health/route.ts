import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis/client'

export async function GET() {
  const checks: Record<string, boolean> = {}

  try {
    await db.$queryRaw`SELECT 1`
    checks.db = true
  } catch {
    checks.db = false
  }

  try {
    await redis.ping()
    checks.redis = true
  } catch {
    checks.redis = false
  }

  const ok = Object.values(checks).every(Boolean)

  return NextResponse.json(
    { ok, checks, ts: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  )
}
