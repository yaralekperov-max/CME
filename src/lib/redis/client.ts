import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export const CACHE_TTL = {
  courses: 60 * 5,      // 5 min — catalog listings
  courseSingle: 60 * 10, // 10 min — single course
  userPoints: 60 * 2,   // 2 min — user points summary
  specializations: 60 * 60 * 24, // 24h — static list
} as const

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const value = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(value))
  return value
}

export function invalidate(...keys: string[]) {
  if (keys.length === 0) return Promise.resolve()
  return redis.del(...keys)
}
