import { db } from './index'

export async function calcPacePerYear(userId: string): Promise<number> {
  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 4 + i)

  const yearPoints = await Promise.all(
    years.map(async (year) => {
      const agg = await db.pointsTransaction.aggregate({
        where: {
          userId,
          type: 'EARNED',
          createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
        },
        _sum: { points: true },
      })
      return { year, points: agg._sum.points ?? 0, isCurrent: year === now.getFullYear() }
    }),
  )

  const pastYears = yearPoints.filter((y) => !y.isCurrent && y.points > 0)
  if (pastYears.length > 0) {
    return Math.round(pastYears.reduce((s, y) => s + y.points, 0) / pastYears.length)
  }
  return yearPoints.find((y) => y.isCurrent)?.points ?? 0
}
