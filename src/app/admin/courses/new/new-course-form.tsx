'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Select, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardTitle } from '@/components/ui/card'

const STEPS = ['1. Основное', '2. Контент', '3. НМО и цена', '4. Публикация']

interface Organization {
  id: string
  name: string
}

interface NewCourseFormProps {
  organizations: Organization[]
}

export function NewCourseForm({ organizations }: NewCourseFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    organizationId: '',
    specialization: '',
    description: '',
    format: 'ONLINE',
    durationHours: '',
    deadlineDate: '',
    nmoPoints: '',
    nmoAccreditationNumber: '',
    fundingType: 'FREE',
    priceKopecks: '0',
    maxParticipants: '',
    publishNow: true,
  })

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(publish: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: publish ? 'MODERATION' : 'DRAFT' }),
      })
      if (res.ok) router.push('/admin/courses')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[760px]">
      {/* Step indicator */}
      <div className="flex mb-5 rounded-[var(--r-sm,6px)] overflow-hidden border border-[var(--border)]">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 py-2.5 text-[12px] font-medium text-center border-b-2 transition-all ${
              i === step
                ? 'text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-light)]'
                : i < step
                ? 'text-[var(--green)] border-[var(--green)] bg-[var(--green-bg,var(--surface2))] cursor-pointer'
                : 'text-[var(--text3)] border-[var(--border)] bg-[var(--surface2)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 0 && (
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle>Основная информация</CardTitle>
            <div className="flex flex-col gap-3.5">
              <FormGroup label="Название курса *">
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Например: Лечение сердечной недостаточности — протоколы 2025" />
              </FormGroup>
              <div className="grid grid-cols-2 gap-3.5">
                <FormGroup label="Организация *">
                  <Select value={form.organizationId} onChange={(e) => set('organizationId', e.target.value)}>
                    <option value="">Выберите организацию</option>
                    {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Специализация *">
                  <Select value={form.specialization} onChange={(e) => set('specialization', e.target.value)}>
                    <option value="">Выберите специализацию</option>
                    {['Кардиология', 'Терапия', 'Хирургия', 'Педиатрия', 'Неврология', 'Онкология', 'Эндокринология'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>
              <FormGroup label="Описание курса">
                <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Краткое описание для врачей..." />
              </FormGroup>
              <div className="grid grid-cols-3 gap-3.5">
                <FormGroup label="Формат">
                  <Select value={form.format} onChange={(e) => set('format', e.target.value)}>
                    <option value="ONLINE">Онлайн</option>
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
            </div>
          </Card>
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => handleSave(false)} disabled={saving}>Сохранить черновик</Button>
            <Button variant="primary" onClick={() => setStep(1)} disabled={!form.title || !form.organizationId}>Далее: Контент →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Content */}
      {step === 1 && (
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle>Загрузка контента</CardTitle>
            <div className="flex flex-col gap-3.5">
              {[{ icon: '🎬', title: 'Загрузите видеоматериалы', sub: 'MP4, MOV · до 2 GB на файл' }, { icon: '📄', title: 'Загрузите учебные материалы', sub: 'PDF, DOCX, PPT · до 100 MB на файл' }].map((z) => (
                <div key={z.title} className="border-[1.5px] border-dashed border-[var(--border2,var(--border))] rounded-[var(--r,10px)] p-7 text-center cursor-pointer hover:border-[var(--accent-dim,var(--accent))] hover:bg-[var(--accent-light)] transition-all">
                  <div className="text-[28px] mb-2">{z.icon}</div>
                  <div className="text-[13px] text-[var(--text2)]">{z.title}</div>
                  <div className="text-[11px] text-[var(--text3)] mt-1">{z.sub}</div>
                </div>
              ))}
              <FormGroup label="Финальное тестирование">
                <Select>
                  <option>Встроенный тест (создать в системе)</option>
                  <option>Внешняя ссылка на тест</option>
                  <option>Без тестирования</option>
                </Select>
              </FormGroup>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>← Назад</Button>
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => handleSave(false)} disabled={saving}>Сохранить черновик</Button>
              <Button variant="primary" onClick={() => setStep(2)}>Далее: НМО и цена →</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: NMO + Price */}
      {step === 2 && (
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle>Параметры НМО и стоимость</CardTitle>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <FormGroup label="Количество баллов НМО *">
                  <Input type="number" value={form.nmoPoints} onChange={(e) => set('nmoPoints', e.target.value)} placeholder="36" />
                </FormGroup>
                <FormGroup label="Номер аккредитации Минздрава">
                  <Input value={form.nmoAccreditationNumber} onChange={(e) => set('nmoAccreditationNumber', e.target.value)} placeholder="НМО-2025-КР-00412" />
                </FormGroup>
              </div>
              <Alert variant="info">ℹ️ Курс должен быть аккредитован Координационным советом по НМО. Баллы зачтутся только при наличии номера аккредитации.</Alert>
              <div className="grid grid-cols-2 gap-3.5">
                <FormGroup label="Финансирование">
                  <Select value={form.fundingType} onChange={(e) => set('fundingType', e.target.value)}>
                    <option value="FREE">Бесплатно (ОМС / грант)</option>
                    <option value="OMS">По ОМС</option>
                    <option value="PAID">Платный курс</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Стоимость (₽)" hint="0 для бесплатных">
                  <Input type="number" value={String(Number(form.priceKopecks) / 100)} onChange={(e) => set('priceKopecks', String(Number(e.target.value) * 100))} placeholder="0" disabled={form.fundingType === 'FREE'} />
                </FormGroup>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <FormGroup label="Комиссия платформы (%)" hint="По умолчанию 15%">
                  <Input type="number" defaultValue="15" placeholder="15" />
                </FormGroup>
                <FormGroup label="Максимум участников" hint="Оставьте пустым для неограниченного">
                  <Input type="number" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} placeholder="Без ограничений" />
                </FormGroup>
              </div>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Назад</Button>
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => handleSave(false)} disabled={saving}>Сохранить черновик</Button>
              <Button variant="primary" onClick={() => setStep(3)} disabled={!form.nmoPoints}>Далее: Публикация →</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Publish */}
      {step === 3 && (
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle>Превью и публикация</CardTitle>
            <Alert variant="success" className="mb-3.5">✓ Все основные данные заполнены. Курс готов к публикации.</Alert>
            <div className="bg-[var(--surface2)] rounded-[var(--r,10px)] p-4 mb-3.5">
              <div className="text-[11px] text-[var(--text3)] mb-2.5 uppercase tracking-[0.05em]">Как будет выглядеть в каталоге</div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-[14px] font-semibold text-[var(--text)] font-display">{form.title || 'Название курса'}</div>
                <div className="px-2.5 py-1 bg-[var(--accent-light)] text-[var(--accent)] rounded-full text-[12px] font-semibold ml-3 flex-shrink-0 font-display">
                  {form.nmoPoints || '0'} б.
                </div>
              </div>
              <div className="text-[11px] text-[var(--text3)] mb-2">{organizations.find((o) => o.id === form.organizationId)?.name ?? 'Организация'}</div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-[5px] bg-[var(--green-bg)] text-[var(--green)]">{form.format === 'ONLINE' ? 'Онлайн' : form.format}</span>
                {form.specialization && <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-[5px] bg-[var(--surface3,var(--surface2))] text-[var(--text2)]">{form.specialization}</span>}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border)]">
                <span className={`text-[14px] font-bold font-display ${form.fundingType === 'FREE' ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                  {form.fundingType === 'FREE' ? 'Бесплатно' : `${Number(form.priceKopecks) / 100} ₽`}
                </span>
                <div className="px-3.5 py-1.5 bg-[var(--accent)] text-white rounded-[6px] text-[12px] font-medium">Записаться</div>
              </div>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Назад</Button>
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => handleSave(false)} disabled={saving}>Сохранить черновик</Button>
              <Button variant="primary" onClick={() => handleSave(true)} disabled={saving}>🚀 Отправить на модерацию</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
