'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  courseId: string
  externalUrl: string | null
  initialEnrolled: boolean
  disabled?: boolean
}

export function EnrollButton({ courseId, externalUrl, initialEnrolled, disabled }: Props) {
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEnroll(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    setError('')

    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    })

    const data = await res.json()

    if (res.ok || data.error?.code === 'ALREADY_ENROLLED') {
      setEnrolled(true)
      if (externalUrl) window.open(externalUrl, '_blank', 'noopener,noreferrer')
    } else if (data.error?.code === 'FULL') {
      setError('Мест нет')
    } else {
      setError('Ошибка')
    }

    setLoading(false)
  }

  if (enrolled) {
    return (
      <div className="flex flex-col items-end gap-1">
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-[var(--r-md,12px)] bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            Перейти к курсу ↗
          </a>
        ) : (
          <Button variant="success" size="sm" disabled>
            Вы записаны
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        size="sm"
        onClick={handleEnroll}
        disabled={loading || disabled}
      >
        {loading ? 'Записываем...' : externalUrl ? 'Записаться и перейти ↗' : 'Записаться'}
      </Button>
      {error && <span className="text-[11px] text-[var(--red)]">{error}</span>}
    </div>
  )
}
