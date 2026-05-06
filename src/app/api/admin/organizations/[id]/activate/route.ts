import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const org = await db.organization.findUnique({ where: { id: params.id } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.organization.update({
    where: { id: params.id },
    data: { status: 'ACTIVE' },
  })

  return NextResponse.redirect(new URL('/admin/organizations', req.url))
}
