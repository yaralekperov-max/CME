import { redis } from '@/lib/redis/client'

interface RateLimitOptions {
  key: string       // e.g. `rate:login:${ip}`
  limit: number     // max requests
  windowSec: number // window in seconds
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number   // seconds until window resets
}

export async function rateLimit({ key, limit, windowSec }: RateLimitOptions): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const window = Math.floor(now / windowSec)
  const redisKey = `${key}:${window}`

  const count = await redis.incr(redisKey)
  if (count === 1) {
    await redis.expire(redisKey, windowSec)
  }

  const remaining = Math.max(0, limit - count)
  const resetIn = (window + 1) * windowSec - now

  return { allowed: count <= limit, remaining, resetIn }
}
