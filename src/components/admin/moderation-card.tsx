'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Input, FormGroup } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { FORMAT_LABELS, COURSE_TYPE_LABELS } from '@/lib/constants'
import { checkCompliance } from '@/lib/compliance'
import type { CourseFormat, CourseType } from '@/types'

type Action = 'approve' | 'reject' | 'request_changes'

const ACTION_LABELS: Record<Action, { idle: string; loading: string; done: string }> = {
  approve:         { idle: '✓ Одобрить и опубликовать', loading: 'Публикуем...',   done: 'Опубликован' },
  reject:          { idle: '✕ Отклонить',               loading: 'Отклоняем...',   done: 'Отклонён' },
  request_changes: { idle: 'Запросить правки',           loading: 'Отправляем...', done: 'Отправлен на правки' },
}

interface Props {
  course: {
    id: string
    title: string
    description: string | null
    format: CourseFormat
    courseType: CourseType
    durationHours: number | null
    nmoPoints: number
    nmoAccreditationNumber: string | null
    typicalProgramOrder: string | null
    typicalProgramTitle: string | null
    inPersonCity: string | null
    priceKopecks: number
    organization: { name: string; practiceApprovalNumber: string | null }
  }
}

export function ModerationCard({ course }: Props) {
  const router = useRouter()
  const [accredNum, setAccredNum] = useState(course.nmoAccreditationNumber ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<Action | null>(null)
  const [doneLabel, setDoneLabel] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function submit(action: Action) {
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

    setDoneLabel(ACTION_LABELS[action].done)
    setLoading(null)
    router.refresh()
  }

  if (doneLabel !== null) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--text)] font-display">{course.title}</span>
          <span className="text-[12px] text-[var(--text3)]">{doneLabel}</span>
        </div>
      </div>
    )
  }

  const issues = checkCompliance(course)
  const blocking = issues.filter((i) => i.blocking)
  const warnings = issues.filter((i) => !i.blocking)

  const canApprove = accredNum.trim().length > 0 && blocking.length === 0

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg,16px)] p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[14px] font-semibold text-[var(--text)] mb-1 font-display">{course.title}</div>
          <div className="text-[12px] text-[var(--text3)]">
            {course.organization.name} · {COURSE_TYPE_LABELS[course.courseType]} ·{' '}
            {course.durationHours} ч. · {course.nmoPoints} баллов ·{' '}
            {FORMAT_LABELS[course.format]}
            {course.inPersonCity && ` · ${course.inPersonCity}`} · {formatPrice(course.priceKopecks)}
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

      <div className="bg-[var(--surface2)] rounded-[var(--r-sm,6px)] p-3 mb-3">
        <div className="text-[11px] text-[var(--text3)] mb-2 uppercase tracking-[0.05em]">
          Проверка легитимности
        </div>
        <div className="flex flex-col gap-1.5">
          <CheckRow
            ok={!!course.typicalProgramOrder?.trim()}
            label="Типовая программа Минздрава"
            value={course.typicalProgramOrder ?? 'не указана'}
            muted={course.courseType !== 'QUALIFICATION'}
          />
          <CheckRow
            ok={!!course.organization.practiceApprovalNumber?.trim()}
            label="Заключение по ПП № 1942 у организации"
            value={course.organization.practiceApprovalNumber ?? 'не указано'}
            muted={course.courseType !== 'QUALIFICATION'}
          />
          <CheckRow
            ok={!(course.courseType === 'QUALIFICATION' && course.format === 'ONLINE')}
            label="Форма обучения допустима для ПК"
            value={FORMAT_LABELS[course.format]}
            muted={course.courseType !== 'QUALIFICATION'}
          />
        </div>
      </div>

      {blocking.map((issue) => (
        <Alert variant="error" className="mb-3" key={issue.message}>{issue.message}</Alert>
      ))}
      {warnings.map((issue) => (
        <Alert variant="warn" className="mb-3" key={issue.message}>{issue.message}</Alert>
      ))}

      {blocking.length === 0 && !accredNum.trim() && (
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
        {(['approve', 'reject', 'request_changes'] as Action[]).map((action) => (
          <Button
            key={action}
            variant={action === 'approve' ? 'success' : action === 'reject' ? 'danger' : 'ghost'}
            disabled={(action === 'approve' && !canApprove) || loading !== null}
            onClick={() => submit(action)}
          >
            {loading === action ? ACTION_LABELS[action].loading : ACTION_LABELS[action].idle}
          </Button>
        ))}
      </div>
    </div>
  )
}

function CheckRow({
  ok,
  label,
  value,
  muted,
}: {
  ok: boolean
  label: string
  value: string
  muted?: boolean
}) {
  // Для модулей и мероприятий требования к типовым программам не применяются —
  // показываем строку справочно, но не как нарушение.
  const color = muted ? 'text-[var(--text3)]' : ok ? 'text-[var(--green)]' : 'text-[var(--red)]'
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className={`font-bold ${color}`}>{muted ? '·' : ok ? '✓' : '✕'}</span>
      <span className="text-[var(--text2)]">{label}:</span>
      <span className={`font-medium ${muted ? 'text-[var(--text3)]' : 'text-[var(--text)]'}`}>{value}</span>
    </div>
  )
}
