'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Select, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardTitle } from '@/components/ui/card'
import { SPECIALIZATIONS } from '@/lib/constants'

interface Course {
  id: string
  title: string
  description: string | null
  organizationId: string
  format: string
  courseType: string
  specializations: string[]
  durationHours: number | null
  deadlineDate: Date | null
  nmoPoints: number
  nmoAccreditationNumber: string | null
  typicalProgramOrder: string | null
  typicalProgramTitle: string | null
  inPersonCity: string | null
  externalUrl: string | null
  fundingType: string
  priceKopecks: number
  maxParticipants: number | null
  status: string
}

interface Organization { id: string; name: string }

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  MODERATION: 'На модерации',
  PUBLISHED: 'Опубликован',
  REJECTED: 'Отклонён',
  ARCHIVED: 'Архив',
}

export function EditCourseForm({ course, organizations }: { course: Course; organizations: Organization[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: course.title,
    organizationId: course.organizationId,
    description: course.description ?? '',
    format: course.format,
    courseType: course.courseType,
    specialization: course.specializations[0] ?? '',
    durationHours: course.durationHours ? String(course.durationHours) : '',
    deadlineDate: course.deadlineDate
      ? new Date(course.deadlineDate).toISOString().split('T')[0]
      : '',
    nmoPoints: String(course.nmoPoints),
    nmoAccreditationNumber: course.nmoAccreditationNumber ?? '',
    typicalProgramOrder: course.typicalProgramOrder ?? '',
    typicalProgramTitle: course.typicalProgramTitle ?? '',
    inPersonCity: course.inPersonCity ?? '',
    externalUrl: course.externalUrl ?? '',
    fundingType: course.fundingType,
    priceKopecks: String(course.priceKopecks),
    maxParticipants: course.maxParticipants ? String(course.maxParticipants) : '',
    status: course.status,
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        durationHours: form.durationHours ? Number(form.durationHours) : null,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
        priceKopecks: Number(form.priceKopecks),
        nmoPoints: Number(form.nmoPoints),
        deadlineDate: form.deadlineDate || null,
        externalUrl: form.externalUrl || null,
        nmoAccreditationNumber: form.nmoAccreditationNumber || null,
      }),
    })

    if (res.ok) {
      setSaved(true)
    } else {
      const data = await res.json()
      setError(data.error?.formErrors?.[0] ?? 'Ошибка сохранения')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-[760px] flex flex-col gap-4">
      <Card>
        <CardTitle>Основная информация</CardTitle>
        <div className="flex flex-col gap-3.5">
          <FormGroup label="Название курса *">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3.5">
            <FormGroup label="Организация *">
              <Select value={form.organizationId} onChange={(e) => set('organizationId', e.target.value)}>
                {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Специализация">
              <Select value={form.specialization} onChange={(e) => set('specialization', e.target.value)}>
                <option value="">Не выбрана</option>
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </div>
          <FormGroup
            label="Тип программы"
            hint="Повышение квалификации — программа ДПО с выдачей удостоверения."
          >
            <Select value={form.courseType} onChange={(e) => set('courseType', e.target.value)}>
              <option value="QUALIFICATION">Повышение квалификации (удостоверение)</option>
              <option value="MODULE">Образовательный модуль НМО (ИОМ)</option>
              <option value="EVENT">Мероприятие (конференция, вебинар)</option>
            </Select>
          </FormGroup>
          <FormGroup label="Описание">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </FormGroup>
          <div className="grid grid-cols-3 gap-3.5">
            <FormGroup label="Формат">
              <Select value={form.format} onChange={(e) => set('format', e.target.value)}>
                <option value="ONLINE">Онлайн</option>
                <option value="BLENDED">Смешанный (лекции онлайн, практика очно)</option>
                <option value="IN_PERSON">Очный</option>
                <option value="WEBINAR">Вебинар</option>
                <option value="CONFERENCE">Конференция</option>
              </Select>
            </FormGroup>
            <FormGroup label="Длительность (часов)">
              <Input type="number" value={form.durationHours} onChange={(e) => set('durationHours', e.target.value)} placeholder="72" />
            </FormGroup>
            <FormGroup label="Дедлайн записи">
              <Input type="date" value={form.deadlineDate} onChange={(e) => set('deadlineDate', e.target.value)} />
            </FormGroup>
          </div>
          {(form.format === 'IN_PERSON' || form.format === 'BLENDED') && (
            <FormGroup label="Город очной части" hint="Врачу нужно понимать, куда придётся приехать, до записи">
              <Input value={form.inPersonCity} onChange={(e) => set('inPersonCity', e.target.value)} placeholder="Москва" />
            </FormGroup>
          )}
          {form.courseType === 'QUALIFICATION' && (
            <div className="grid grid-cols-2 gap-3.5">
              <FormGroup label="Приказ об утверждении типовой программы" hint="Например: № 373н от 08.06.2026">
                <Input value={form.typicalProgramOrder} onChange={(e) => set('typicalProgramOrder', e.target.value)} placeholder="№ 373н от 08.06.2026" />
              </FormGroup>
              <FormGroup label="Название типовой программы">
                <Input value={form.typicalProgramTitle} onChange={(e) => set('typicalProgramTitle', e.target.value)} placeholder="Клиническая фармакология" />
              </FormGroup>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>НМО и стоимость</CardTitle>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <FormGroup label="Баллов НМО *">
              <Input type="number" value={form.nmoPoints} onChange={(e) => set('nmoPoints', e.target.value)} />
            </FormGroup>
            <FormGroup label="Номер аккредитации">
              <Input value={form.nmoAccreditationNumber} onChange={(e) => set('nmoAccreditationNumber', e.target.value)} placeholder="НМО-2025-КР-00412" />
            </FormGroup>
          </div>
          <FormGroup label="Внешняя ссылка на курс">
            <Input type="url" value={form.externalUrl} onChange={(e) => set('externalUrl', e.target.value)} placeholder="https://edu.rosminzdrav.ru/course/..." />
          </FormGroup>
          <div className="grid grid-cols-3 gap-3.5">
            <FormGroup label="Финансирование">
              <Select value={form.fundingType} onChange={(e) => set('fundingType', e.target.value)}>
                <option value="FREE">Бесплатно</option>
                <option value="OMS">По ОМС</option>
                <option value="PAID">Платный</option>
              </Select>
            </FormGroup>
            <FormGroup label="Стоимость (₽)">
              <Input type="number" value={String(Number(form.priceKopecks) / 100)} onChange={(e) => set('priceKopecks', String(Number(e.target.value) * 100))} disabled={form.fundingType === 'FREE'} />
            </FormGroup>
            <FormGroup label="Макс. участников">
              <Input type="number" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} placeholder="Без ограничений" />
            </FormGroup>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Статус публикации</CardTitle>
        <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">✓ Изменения сохранены</Alert>}

      <div className="flex gap-2.5 justify-between">
        <Button variant="ghost" onClick={() => router.push('/admin/courses')}>
          ← К списку курсов
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  )
}
