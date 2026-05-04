import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrSet, CACHE_TTL } from '@/lib/redis/client'
import type { CourseFormat, FundingType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const format = searchParams.getAll('format') as CourseFormat[]
  const funding = searchParams.getAll('funding') as FundingType[]
  const spec = searchParams.get('specialization')
  const search = searchParams.get('q')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))

  const cacheKey = `courses:${req.nextUrl.search}`

  const result = await getOrSet(cacheKey, CACHE_TTL.courses, async () => {
    const where = {
      status: 'PUBLISHED' as const,
      ...(format.length > 0 && { format: { in: format } }),
      ...(funding.length > 0 && { fundingType: { in: funding } }),
      ...(spec && { specializations: { has: spec } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.course.count({ where }),
    ])

    return { courses, total, page, limit }
  })

  return NextResponse.json({ data: result })
}
