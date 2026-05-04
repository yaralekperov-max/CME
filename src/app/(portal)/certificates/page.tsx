import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { MetricCard } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'
import type { CertStatus } from '@/types'

export const metadata: Metadata = { title: 'Сертификаты' }

const STATUS_COLOR: Record<CertStatus, 'green' | 'amber' | 'red'> = {
  ACTIVE: 'green',
  EXPIRING: 'amber',
  EXPIRED: 'red',
}

const STATUS_LABEL: Record<CertStatus, string> = {
  ACTIVE: 'Действует',
  EXPIRING: 'Истекает',
  EXPIRED: 'Истекло',
}

const BORDER_COLOR: Record<CertStatus, string> = {
  ACTIVE: 'bg-[var(--green)]',
  EXPIRING: 'bg-[var(--amber)]',
  EXPIRED: 'bg-[var(--red)]',
}

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const certs = await db.certificate.findMany({
    where: { userId: session.user.id },
    orderBy: { issuedAt: 'desc' },
  })

  const active = certs.filter((c) => c.status === 'ACTIVE').length
  const expiring = certs.filter((c) => c.status === 'EXPIRING').length
  const expired = certs.filter((c) => c.status === 'EXPIRED').length

  const expiringCerts = certs.filter((c) => c.status === 'EXPIRING' || c.status === 'EXPIRED')

  return (
    <>
      <PortalTopbar title="Сертификаты" />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        <div className="grid grid-cols-4 gap-3.5">
          <MetricCard label="Всего" value={certs.length} sub="сертификатов" />
          <MetricCard label="Действующих" value={active} sub="актуальных" />
          <MetricCard label="Истекает скоро" value={expiring} sub="в ближайшие 6 мес." />
          <MetricCard label="Истекло" value={expired} sub="требует продления" />
        </div>

        {expiringCerts.length > 0 && (
          <Alert variant="warn">
            ⚠️{' '}
            <div>
              <strong>{expiringCerts.length} сертификата истекают</strong> в ближайшее время:{' '}
              {expiringCerts.map((c) => `«${c.title}»`).join(', ')}.{' '}
              <a href="/app/catalog" className="underline cursor-pointer">
                Найти продолжающие курсы →
              </a>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          {certs.length === 0 && (
            <div className="col-span-2 text-[13px] text-[var(--text3)] text-center py-8">
              Сертификаты не найдены
            </div>
          )}
          {certs.map((cert) => (
            <div key={cert.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4 shadow-sm relative overflow-hidden">
              {/* Left color bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[var(--r-lg,16px)] ${BORDER_COLOR[cert.status]}`} />

              <div className="pl-3">
                <div className="text-[10px] text-[var(--text3)] mb-1.5 font-mono">
                  № {cert.number} · {formatDate(cert.issuedAt)}
                </div>
                <div className="text-[13px] font-semibold text-[var(--text)] leading-[1.4] mb-1 font-display">
                  {cert.title}
                </div>
                <div className="text-[11px] text-[var(--text3)] mb-3">{cert.nmoPoints} ЗЕТ</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color={STATUS_COLOR[cert.status]}>{STATUS_LABEL[cert.status]}</Badge>
                    {cert.expiresAt && (
                      <span className="text-[11px] text-[var(--text3)]">
                        до {formatDate(cert.expiresAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {cert.fileUrl && (
                      <Button variant="ghost" size="sm" onClick={() => {}}>Скачать</Button>
                    )}
                    {cert.status === 'EXPIRING' || cert.status === 'EXPIRED' ? (
                      <Button variant="primary" size="sm">Продлить</Button>
                    ) : (
                      <Button variant="ghost" size="sm">Поделиться</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  )
}
