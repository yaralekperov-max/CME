import type { Metadata } from 'next'
import { ForgotForm } from './forgot-form'

export const metadata: Metadata = { title: 'Восстановление пароля' }

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-[9px] flex items-center justify-center text-white text-lg">
            🏥
          </div>
          <div>
            <div className="text-[16px] font-bold font-display text-[var(--text)]">NMOBALL</div>
            <div className="text-[11px] text-[var(--text3)]">Портал НМО</div>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl,20px)] p-7 shadow-md">
          <h1 className="text-[20px] font-bold font-display text-[var(--text)] mb-1">
            Восстановление пароля
          </h1>
          <p className="text-[13px] text-[var(--text3)] mb-6">
            Введите email — мы отправим ссылку для сброса пароля
          </p>
          <ForgotForm />
        </div>

        <p className="text-center text-[12px] text-[var(--text3)] mt-5">
          Вспомнили пароль?{' '}
          <a href="/login" className="text-[var(--accent)] hover:underline">Войти</a>
        </p>
      </div>
    </main>
  )
}
