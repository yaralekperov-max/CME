import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Вход' }

export default function LoginPage() {
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
          <h1 className="text-[20px] font-bold font-display text-[var(--text)] mb-1">Войти</h1>
          <p className="text-[13px] text-[var(--text3)] mb-6">
            Используйте email и пароль, указанные при регистрации
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-[12px] text-[var(--text3)] mt-5">
          Нет аккаунта?{' '}
          <a href="/register" className="text-[var(--accent)] hover:underline">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </main>
  )
}
