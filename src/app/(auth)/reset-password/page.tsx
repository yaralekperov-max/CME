import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetForm } from './reset-form'

export const metadata: Metadata = { title: 'Новый пароль' }

export default function ResetPasswordPage() {
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
            Новый пароль
          </h1>
          <p className="text-[13px] text-[var(--text3)] mb-6">
            Придумайте надёжный пароль для вашего аккаунта
          </p>
          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
