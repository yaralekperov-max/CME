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
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0D14', color: '#F0EFE8' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(12,13,20,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#7B6EF6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🏥</div>
            <span className="font-display" style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>NMOBALL</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
              Войти
            </Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#7B6EF6', padding: '7px 18px', borderRadius: 8, textDecoration: 'none' }}>
              Начать бесплатно
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '90px 24px 80px' }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(123,110,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(123,110,246,0.15)', border: '1px solid rgba(123,110,246,0.3)', color: '#A89EFA', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 999, marginBottom: 28, letterSpacing: '0.04em' }}>
              ✦ &nbsp;Для врачей России
            </div>

            <h1 className="font-display" style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff', marginBottom: 22, textWrap: 'balance' } as React.CSSProperties}>
              Управляйте НМО-баллами<br />
              <span style={{ color: '#7B6EF6' }}>без таблиц и стресса</span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.65 }}>
              Один кабинет для всего цикла аккредитации: прогресс баллов, каталог курсов, напоминания о дедлайне и AI-ассистент.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: '#7B6EF6', padding: '13px 32px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 32px rgba(123,110,246,0.35)' }}>
                Начать бесплатно
              </Link>
              <Link href="/login" style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>
                Войти
              </Link>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              {['✓ Бесплатная регистрация', '✓ Без ввода карты', '✓ Соответствует ФЗ-152'].map((t) => (
                <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { num: '250', unit: 'ЗЕТ', label: 'за 5-летний цикл аккредитации' },
              { num: '500+', unit: '', label: 'курсов в каталоге платформы' },
              { num: '36', unit: 'спец.', label: 'врачебных специализаций' },
              { num: '10', unit: '/день', label: 'запросов к AI-ассистенту' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none', textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 40, fontWeight: 800, color: '#7B6EF6', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {s.num}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7B6EF6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Как это работает</div>
              <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Три шага до спокойной аккредитации</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { num: '01', icon: '👤', title: 'Зарегистрируйтесь', desc: 'Укажите специализацию и дату аккредитации. Система рассчитает нужный темп и покажет, сколько баллов осталось набрать.' },
                { num: '02', icon: '📚', title: 'Выбирайте курсы', desc: 'Каталог аккредитованных курсов от проверенных организаций. Онлайн, очно, вебинары — с фильтром по формату и бюджету.' },
                { num: '03', icon: '✦', title: 'Следите за прогрессом', desc: 'Дашборд с балансом ЗЕТ и прогнозом. Напоминания за 30 и 7 дней до дедлайна, чтобы не пропустить срок.' },
              ].map((step) => (
                <div key={step.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                  <div className="font-display" style={{ position: 'absolute', top: 20, right: 24, fontSize: 52, fontWeight: 800, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.03em', lineHeight: 1 }}>{step.num}</div>
                  <div style={{ fontSize: 28, marginBottom: 18 }}>{step.icon}</div>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7B6EF6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Возможности</div>
              <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Всё для НМО в одном месте</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Big feature */}
              <div style={{ background: 'linear-gradient(135deg, rgba(123,110,246,0.15) 0%, rgba(123,110,246,0.04) 100%)', border: '1px solid rgba(123,110,246,0.25)', borderRadius: 20, padding: '36px 32px', gridRow: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(123,110,246,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
                <div>
                  <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>AI-ассистент</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
                    Задайте вопрос про НМО или аккредитацию — Claude ответит с учётом вашей специализации, дедлайна и текущего прогресса. Никаких общих ответов — только конкретика по вашей ситуации.
                  </div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['Оценка прогресса и рисков', 'Подбор курсов под специализацию', 'Составление плана обучения'].map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                      <span style={{ color: '#7B6EF6', fontWeight: 700 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Small features */}
              {[
                { icon: '✦', title: 'Прогресс баллов', desc: 'Наглядный дашборд с балансом ЗЕТ, темпом и прогнозом на конец цикла.', accent: 'rgba(123,110,246,0.12)', border: 'rgba(123,110,246,0.2)' },
                { icon: '⊞', title: 'Каталог курсов', desc: 'Сотни курсов с фильтром по специализации, формату и бюджету.', accent: 'rgba(52,199,123,0.08)', border: 'rgba(52,199,123,0.2)' },
                { icon: '🔔', title: 'Напоминания', desc: 'Письма за 30 и 7 дней до дедлайна — не пропустите срок аккредитации.', accent: 'rgba(74,158,245,0.08)', border: 'rgba(74,158,245,0.2)' },
                { icon: '📄', title: 'Сертификаты', desc: 'Храните подтверждения пройденных курсов в одном месте.', accent: 'rgba(240,164,41,0.08)', border: 'rgba(240,164,41,0.2)' },
              ].map((f) => (
                <div key={f.title} style={{ background: f.accent, border: `1px solid ${f.border}`, borderRadius: 16, padding: '24px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                  <div>
                    <div className="font-display" style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #7B6EF6 0%, #5A4FD0 100%)', borderRadius: 24, padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -80, left: -40, width: 250, height: 250, background: 'rgba(0,0,0,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>Готовы начать?</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>Регистрация бесплатна. Никаких скрытых платежей.</p>
                <Link href="/register" style={{ display: 'inline-block', fontSize: 15, fontWeight: 700, color: '#7B6EF6', background: '#fff', padding: '14px 36px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                  Зарегистрироваться бесплатно
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          <span>© 2026 NMOBALL</span>
          <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Политика конфиденциальности</Link>
        </div>
      </footer>

    </div>
  )
}
