'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ru">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f9f9f7' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1C1B18' }}>Что-то пошло не так</h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Ошибка зафиксирована. Попробуйте обновить страницу.
            </p>
            <button
              onClick={reset}
              style={{ padding: '10px 24px', background: '#6B5FE4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
