'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'

interface Props {
  enrollmentId: string
  points: number
  onComplete?: () => void
}

export function CompleteButton({ enrollmentId, points, onComplete }: Props) {
  const [open, setOpen] = useState(false)
  const [certUrl, setCertUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--green-bg)] rounded-[var(--r-md,12px)]">
        <span className="text-[var(--green)] text-[13px] font-semibold">✓ Курс завершён · +{points} ЗЕТ зачтено</span>
      </div>
    )
  }

  async function handleComplete() {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/enrollments/${enrollmentId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateFileUrl: certUrl || undefined }),
    })

    if (res.ok) {
      setDone(true)
      onComplete?.()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Ошибка')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        ✓ Отметить как пройденный
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 border border-[var(--accent-mid)] bg-[var(--accent-light)] rounded-[var(--r-md,12px)]">
      <div className="text-[13px] font-semibold text-[var(--text)]">
        Подтверждение прохождения · +{points} ЗЕТ
      </div>
      <FormGroup label="Ссылка на сертификат (необязательно)">
        <Input
          type="url"
          value={certUrl}
          onChange={(e) => setCertUrl(e.target.value)}
          placeholder="https://edu.rosminzdrav.ru/certificate/..."
        />
      </FormGroup>
      <p className="text-[11px] text-[var(--text3)]">
        Сертификат не обязателен — баллы будут начислены в любом случае.
        При несоответствии администратор может отозвать начисление.
      </p>
      {error && <p className="text-[12px] text-[var(--red)]">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" onClick={handleComplete} disabled={loading}>
          {loading ? 'Сохраняем...' : 'Подтвердить'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
