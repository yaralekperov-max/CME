import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import Link from 'next/link'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const role = session.user.role
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') redirect('/admin')
    if (role === 'ORG_MANAGER') redirect('/org/dashboard')
    redirect('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--accent)] rounded-[8px] flex items-center justify-center text-white text-sm">
              🏥
            </div>
            <span className="text-[17px] font-bold font-display tracking-[-0.03em] text-[var(--text)]">
              NMOBALL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-medium text-[var(--text2)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-medium text-white bg-[var(--accent)] hover:bg-[#5a4fd0] px-4 py-1.5 rounded-lg transition-colors"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--accent-light)] text-[var(--accent)] text-[12px] font-semibold px-3 py-1 rounded-full mb-6">
            <span>✦</span> Для врачей России
          </div>
          <h1 className="font-display text-[42px] md:text-[52px] font-extrabold text-[var(--text)] tracking-[-0.03em] leading-[1.1] text-balance mb-5">
            Следите за НМО-баллами<br />
            <span className="text-[var(--accent)]">без таблиц и головной боли</span>
          </h1>
          <p className="text-[16px] text-[var(--text2)] max-w-xl mx-auto mb-8 text-balance leading-relaxed">
            Отслеживайте аккредитационные баллы, находите курсы в каталоге и получайте напоминания о дедлайне — всё в одном месте.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="text-[14px] font-semibold text-white bg-[var(--accent)] hover:bg-[#5a4fd0] px-6 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Начать бесплатно
            </Link>
            <Link
              href="/login"
              className="text-[14px] font-semibold text-[var(--text2)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] px-6 py-2.5 rounded-xl transition-colors"
            >
              Войти
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-[22px] font-bold text-[var(--text)] tracking-[-0.02em] mb-8 text-center">
              Как это работает
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: '1',
                  title: 'Зарегистрируйтесь',
                  desc: 'Укажите специальность и дату аккредитации — система рассчитает нужный темп набора баллов.',
                },
                {
                  num: '2',
                  title: 'Выбирайте курсы',
                  desc: 'Каталог аккредитованных курсов от проверенных организаций. Фильтр по формату и бюджету.',
                },
                {
                  num: '3',
                  title: 'Следите за прогрессом',
                  desc: 'Дашборд с балансом ЗЕТ, темпом и прогнозом. Напоминания за 30 и 7 дней до дедлайна.',
                },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] text-[15px] font-bold font-display">
                    {step.num}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--text)] font-display mb-1">{step.title}</div>
                    <div className="text-[13px] text-[var(--text2)] leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: '✦',
                title: 'Прогресс баллов',
                desc: 'Наглядный дашборд: сколько ЗЕТ набрано, сколько осталось, какой темп нужен.',
                color: 'var(--accent)',
                bg: 'var(--accent-light)',
              },
              {
                icon: '⊞',
                title: 'Каталог курсов',
                desc: 'Сотни курсов от аккредитованных организаций. Онлайн, очно, бесплатно и платно.',
                color: 'var(--green)',
                bg: 'var(--green-bg)',
              },
              {
                icon: '🤖',
                title: 'AI-ассистент',
                desc: 'Задайте вопрос про НМО или аккредитацию — получите ответ с учётом вашего прогресса.',
                color: 'var(--blue)',
                bg: 'var(--blue-bg)',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text)] font-display mb-1.5">{f.title}</div>
                  <div className="text-[13px] text-[var(--text2)] leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-[var(--accent)] rounded-2xl px-8 py-10 text-center">
            <h2 className="font-display text-[24px] font-bold text-white tracking-[-0.02em] mb-3">
              Готовы начать?
            </h2>
            <p className="text-[14px] text-white/75 mb-6">
              Регистрация бесплатна. Никаких скрытых платежей.
            </p>
            <Link
              href="/register"
              className="inline-block text-[14px] font-semibold text-[var(--accent)] bg-white hover:bg-white/90 px-7 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Зарегистрироваться
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-5">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-[12px] text-[var(--text3)]">
          <span>© 2026 NMOBALL</span>
          <Link href="/privacy" className="hover:text-[var(--text2)] transition-colors">
            Политика конфиденциальности
          </Link>
        </div>
      </footer>
    </div>
  )
}
