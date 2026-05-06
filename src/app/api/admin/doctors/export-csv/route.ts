import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const doctors = await db.user.findMany({
    where: { role: 'DOCTOR' },
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      email: true,
      phone: true,
      specialization: true,
      workplace: true,
      city: true,
      accreditationDeadline: true,
      pointsRequired: true,
      createdAt: true,
      pointsTransactions: {
        where: { type: 'EARNED' },
        select: { points: true },
      },
    },
  })

  const rows = [
    ['ФИО', 'Email', 'Телефон', 'Специализация', 'Место работы', 'Город', 'Баллов набрано', 'Баллов требуется', 'Дедлайн', 'Дата регистрации'],
    ...doctors.map((d) => {
      const earned = d.pointsTransactions.reduce((s, t) => s + t.points, 0)
      return [
        d.name ?? '',
        d.email,
        d.phone ?? '',
        d.specialization ?? '',
        d.workplace ?? '',
        d.city ?? '',
        String(earned),
        String(d.pointsRequired),
        d.accreditationDeadline ? d.accreditationDeadline.toISOString().split('T')[0] : '',
        d.createdAt.toISOString().split('T')[0],
      ]
    }),
  ]

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const bom = '﻿'

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="doctors-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
