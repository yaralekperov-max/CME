import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/topbar'
import { MetricCard } from '@/components/ui/progress'
import { Card, CardTitle } from '@/components/ui/card'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Финансы' }

export default async function FinancePage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthlyTxns, recentTxns, orgRevenue] = await Promise.all([
    db.financialTransaction.aggregate({
      where: { type: 'COURSE_PURCHASE', status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { amountKopecks: true, commissionKopecks: true },
      _count: true,
    }),
    db.financialTransaction.findMany({
      where: { type: 'COURSE_PURCHASE', status: 'COMPLETED' },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.financialTransaction.groupBy({
      by: ['organizationId'],
      where: { type: 'COURSE_PURCHASE', status: 'COMPLETED' },
      _sum: { amountKopecks: true },
      orderBy: { _sum: { amountKopecks: 'desc' } },
    }),
  ])

  const totalRevenue = monthlyTxns._sum.amountKopecks ?? 0
  const totalCommission = monthlyTxns._sum.commissionKopecks ?? 0
  const txnCount = monthlyTxns._count

  const orgIds = orgRevenue.map((r) => r.organizationId).filter(Boolean) as string[]
  const orgNames = await db.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  })
  const orgNameMap = Object.fromEntries(orgNames.map((o) => [o.id, o.name]))

  function rub(kopecks: number) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(kopecks / 100)
  }

  return (
    <>
      <AdminTopbar title="Финансы" />
      <main className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-4">

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Выручка за месяц" value={rub(totalRevenue)} trend="↑ Данные за текущий месяц" trendColor="up" />
          <MetricCard label="Комиссия платформы" value={rub(totalCommission)} sub="15% от транзакций" />
          <MetricCard label="Выплачено орг-циям" value={rub(Math.max(0, totalRevenue - totalCommission))} sub="за текущий месяц" />
          <MetricCard label="Транзакций" value={txnCount} trendColor="up" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Card>
            <CardTitle>Выручка по организациям</CardTitle>
            <div className="flex flex-col gap-0">
              {orgRevenue.slice(0, 6).map((row) => {
                const name = row.organizationId ? (orgNameMap[row.organizationId] ?? 'Неизвестно') : 'Неизвестно'
                const amount = row._sum.amountKopecks ?? 0
                const maxAmount = orgRevenue[0]?._sum.amountKopecks ?? 1
                const pct = Math.round((amount / maxAmount) * 100)
                return (
                  <div key={row.organizationId} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[13px] text-[var(--text2)] flex-1 truncate">{name}</span>
                    <div className="w-[100px] h-[5px] bg-[var(--surface3,var(--surface2))] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--accent)] min-w-[60px] text-right">{rub(amount)}</span>
                  </div>
                )
              })}
              {orgRevenue.length === 0 && <p className="text-[13px] text-[var(--text3)]">Нет данных</p>}
            </div>
          </Card>

          <Card>
            <CardTitle>Последние транзакции</CardTitle>
            <Table>
              <Thead>
                <Tr><Th>Врач</Th><Th>Курс</Th><Th>Сумма</Th><Th>Дата</Th></Tr>
              </Thead>
              <Tbody>
                {recentTxns.map((tx) => (
                  <Tr key={tx.id}>
                    <Td className="text-[var(--text2)]">{tx.user?.name ?? '—'}</Td>
                    <Td className="text-[var(--text2)] max-w-[120px] truncate">{tx.course?.title ?? '—'}</Td>
                    <Td className="text-[var(--green)] font-medium">{rub(tx.amountKopecks)}</Td>
                    <Td className="text-[var(--text2)]">{formatDate(tx.createdAt)}</Td>
                  </Tr>
                ))}
                {recentTxns.length === 0 && (
                  <Tr><Td className="text-[var(--text3)]" colSpan={4}>Нет транзакций</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Card>
        </div>

      </main>
    </>
  )
}
