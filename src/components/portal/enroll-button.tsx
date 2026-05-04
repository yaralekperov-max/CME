'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  courseId: string
  initialEnrolled: boolean
  disabled?: boolean
}

export function EnrollButton({ courseId, initialEnrolled, disabled }: Props) {
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (enrolled) {
    return (
      <Button variant="success" size="sm" disabled>
        Вы записаны
      </Button>
    )
  }

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

    if (res.ok) {
      setEnrolled(true)
    } else if (data.error?.code === 'ALREADY_ENROLLED') {
      setEnrolled(true)
    } else if (data.error?.code === 'FULL') {
      setError('Мест нет')
    } else {
      setError('Ошибка')
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        size="sm"
        onClick={handleEnroll}
        disabled={loading || disabled}
      >
        {loading ? 'Записываем...' : 'Записаться'}
      </Button>
      {error && <span className="text-[11px] text-[var(--red)]">{error}</span>}
    </div>
  )
}
