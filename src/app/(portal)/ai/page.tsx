import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PortalTopbar } from '@/components/portal/topbar'
import { AiChat } from './ai-chat'
import { Card } from '@/components/ui/card'
import { formatMonthsLeft } from '@/lib/utils'

export const metadata: Metadata = { title: 'AI-ассистент' }

export default async function AiPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = session.user.id

  const [user, pointsResult, conversation] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        specialization: true,
        accreditationDeadline: true,
        pointsRequired: true,
      },
    }),
    db.pointsTransaction.aggregate({
      where: { userId, type: 'EARNED' },
      _sum: { points: true },
    }),
    db.aiConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const pointsEarned = pointsResult._sum.points ?? 0
  const pointsRequired = user?.pointsRequired ?? 250

  const userContext = {
    userId,
    name: user?.name ?? 'Доктор',
    specialization: user?.specialization ?? '',
    pointsEarned,
    pointsRequired,
    deadline: user?.accreditationDeadline?.toISOString() ?? null,
    conversationId: conversation?.id ?? null,
    existingMessages: (conversation?.messages as { role: string; content: string }[]) ?? [],
  }

  const monthsLeft = user?.accreditationDeadline
    ? formatMonthsLeft(user.accreditationDeadline)
    : '—'

  return (
    <>
      <PortalTopbar title="AI-ассистент" showSearch={false} />
      <main className="flex-1 overflow-hidden p-6 flex gap-5">

        {/* Chat */}
        <AiChat userContext={userContext} />

        {/* Sidebar */}
        <aside className="w-[220px] min-w-[220px] flex flex-col gap-3.5">
          <Card className="p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] mb-2.5">
              Ваши данные
            </div>
            <div className="flex flex-col gap-2 text-[13px]">
              {[
                { label: 'Специализация', value: user?.specialization ?? '—' },
                { label: 'Баллов', value: `${pointsEarned} / ${pointsRequired}`, accent: true },
                { label: 'До дедлайна', value: monthsLeft },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[var(--text3)]">{label}</span>
                  <span className={`font-medium ${accent ? 'text-[var(--accent)] font-semibold' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.06em] mb-2.5">
              Быстрые вопросы
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                'Сколько баллов мне нужно?',
                'Найди бесплатные курсы',
                'Какой у меня темп?',
                'Составь план на год',
                'Очные курсы в Москве',
              ].map((q) => (
                <button
                  key={q}
                  className="text-left px-3 py-1.5 text-[12px] font-medium border border-[var(--accent-mid)] rounded-[var(--r-sm,8px)] text-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-light)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>
        </aside>

      </main>
    </>
  )
}
