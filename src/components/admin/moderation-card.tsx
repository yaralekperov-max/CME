'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Input, FormGroup } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import type { CourseFormat } from '@/types'

const FORMAT_LABEL: Record<CourseFormat, string> = {
  ONLINE: 'Онлайн',
  IN_PERSON: 'Очный',
  WEBINAR: 'Вебинар',
  CONFERENCE: 'Конференция',
}

interface Props {
  course: {
    id: string
    title: string
    description: string | null
    format: CourseFormat
    durationHours: number | null
    nmoPoints: number
    nmoAccreditationNumber: string | null
    priceKopecks: number
    organization: { name: string }
  }
}

export function ModerationCard({ course }: Props) {
  const router = useRouter()
  const [accredNum, setAccredNum] = useState(course.nmoAccreditationNumber ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'request_changes' | null>(null)
  const [done, setDone] = useState(false)
  const [doneLabel, setDoneLabel] = useState('')
  const [error, setError] = useState('')

  async function submit(action: 'approve' | 'reject' | 'request_changes') {
    setLoading(action)
    setError('')

    const res = await fetch(`/api/admin/moderation/${course.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, nmoAccreditationNumber: accredNum || undefined, note: note || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error?.message ?? 'Ошибка')
      setLoading(null)
      return
    }

    const labels = { approve: 'Опубликован', reject: 'Отклонён', request_changes: 'Отправлен на правки' }
    setDoneLabel(labels[action])
    setDone(true)
    setLoading(null)
    router.refresh()
  }

  if (done) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--text)] font-display">{course.title}</span>
          <span className="text-[12px] text-[var(--text3)]">{doneLabel}</span>
        </div>
      </div>
    )
  }

  const canApprove = accredNum.trim().length > 0

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[14px] font-semibold text-[var(--text)] mb-1 font-display">{course.title}</div>
          <div className="text-[12px] text-[var(--text3)]">
            {course.organization.name} · {course.durationHours} ч. · {course.nmoPoints} баллов ·{' '}
            {FORMAT_LABEL[course.format]} · {formatPrice(course.priceKopecks)}
          </div>
        </div>
        <Badge color="amber">На модерации</Badge>
      </div>

      {course.description && (
        <div className="bg-[var(--surface2)] rounded-[var(--r-sm,6px)] p-3 mb-3 text-[13px] text-[var(--text2)] leading-relaxed">
          <div className="text-[11px] text-[var(--text3)] mb-1.5 uppercase tracking-[0.05em]">Описание</div>
          {course.description}
        </div>
      )}

      {!canApprove && (
        <Alert variant="warn" className="mb-3">
          Укажите номер аккредитации НМО чтобы одобрить курс
        </Alert>
      )}

      <div className="flex gap-3.5 mb-3">
        <FormGroup label="Номер аккредитации НМО" className="flex-1">
          <Input
            value={accredNum}
            onChange={(e) => setAccredNum(e.target.value)}
            placeholder="НМО-2025-КР-00412"
            className="font-mono"
          />
        </FormGroup>
        <FormGroup label="Комментарий редактора" className="flex-1">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необязательно"
          />
        </FormGroup>
      </div>

      {error && <Alert variant="error" className="mb-3">{error}</Alert>}

      <div className="flex gap-2">
        <Button
          variant="success"
          disabled={!canApprove || loading !== null}
          onClick={() => submit('approve')}
        >
          {loading === 'approve' ? 'Публикуем...' : '✓ Одобрить и опубликовать'}
        </Button>
        <Button
          variant="danger"
          disabled={loading !== null}
          onClick={() => submit('reject')}
        >
          {loading === 'reject' ? 'Отклоняем...' : '✕ Отклонить'}
        </Button>
        <Button
          variant="ghost"
          disabled={loading !== null}
          onClick={() => submit('request_changes')}
        >
          {loading === 'request_changes' ? 'Отправляем...' : 'Запросить правки'}
        </Button>
      </div>
    </div>
  )
}
