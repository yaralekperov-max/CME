import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import type { OrgStatus } from '@/types'

export const metadata: Metadata = { title: 'Организации' }

const STATUS_LABEL: Record<OrgStatus, string> = { ACTIVE: 'Активна', CONNECTING: 'Подключается', SUSPENDED: 'Заблокирована' }
const STATUS_COLOR: Record<OrgStatus, 'green' | 'amber' | 'red'> = { ACTIVE: 'green', CONNECTING: 'amber', SUSPENDED: 'red' }

export default async function OrganizationsPage() {
  const orgs = await db.organization.findMany({
    include: {
      _count: { select: { courses: true } },
      financialTxns: {
        where: { type: 'COURSE_PURCHASE', status: 'COMPLETED' },
        select: { amountKopecks: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <>
      <AdminTopbar title="Организации" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="flex justify-end">
          <Button variant="primary">＋ Добавить организацию</Button>
        </div>

        <Card>
          <CardTitle>Партнёрские организации — {orgs.length}</CardTitle>
          <Table>
            <Thead>
              <Tr>
                <Th>Организация</Th>
                <Th>Контакт</Th>
                <Th>Курсов</Th>
                <Th>Выручка</Th>
                <Th>Статус</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orgs.map((org) => {
                const revenue = org.financialTxns.reduce((s, t) => s + t.amountKopecks, 0)
                return (
                  <Tr key={org.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{ background: 'var(--accent-dim,var(--accent-light))', color: 'var(--accent)' }}
                        >
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          {org.website && <div className="text-[11px] text-[var(--text3)]">{org.website}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-[var(--text2)]">{org.contactName ?? '—'}</Td>
                    <Td className="font-semibold">{org._count.courses}</Td>
                    <Td className="font-medium">
                      {revenue > 0
                        ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(revenue / 100)
                        : <span className="text-[var(--text3)]">0 ₽</span>}
                    </Td>
                    <Td>
                      <Badge color={STATUS_COLOR[org.status]}>{STATUS_LABEL[org.status]}</Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Профиль</button>
                        <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Курсы</button>
                        {org.status === 'CONNECTING' && (
                          <button className="px-2.5 py-1 text-[11px] rounded-[5px] cursor-pointer border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Активировать</button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
              {orgs.length === 0 && (
                <Tr><Td className="text-[var(--text3)]" colSpan={6}>Нет организаций</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>

      </main>
    </>
  )
}
