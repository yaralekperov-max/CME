'use client'

import { useState } from 'react'
import { Input, Select, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

const SPECIALIZATIONS = [
  'Кардиология', 'Терапия', 'Хирургия', 'Педиатрия', 'Неврология',
  'Онкология', 'Эндокринология', 'Гастроэнтерология', 'Пульмонология',
  'Ревматология', 'Нефрология', 'Урология', 'Гинекология', 'Офтальмология',
  'Оториноларингология', 'Дерматология', 'Психиатрия', 'Анестезиология',
  'Лучевая диагностика', 'Патологическая анатомия',
]

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  specialization: string | null
  workplace: string | null
  city: string | null
  snils: string | null
  accreditationDeadline: Date | null
  cycleStartDate: Date | null
  pointsRequired: number
  notificationsEnabled: boolean
}

export function ProfileForm({ user }: { user: User }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    specialization: user.specialization ?? '',
    workplace: user.workplace ?? '',
    city: user.city ?? '',
    snils: user.snils ?? '',
    accreditationDeadline: user.accreditationDeadline
      ? new Date(user.accreditationDeadline).toISOString().split('T')[0]
      : '',
    notificationsEnabled: user.notificationsEnabled,
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error?.message ?? 'Ошибка сохранения')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Personal info */}
      <Card>
        <CardTitle>Личные данные</CardTitle>
        <div className="flex flex-col gap-3.5">
          <FormGroup label="ФИО">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Иванов Иван Иванович" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Email">
              <Input value={user.email} disabled className="opacity-60 cursor-not-allowed" />
            </FormGroup>
            <FormGroup label="Телефон">
              <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+7 (999) 000-00-00" />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Место работы">
              <Input value={form.workplace} onChange={(e) => set('workplace', e.target.value)} placeholder="НМИЦ кардиологии" />
            </FormGroup>
            <FormGroup label="Город">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Москва" />
            </FormGroup>
          </div>
        </div>
      </Card>

      {/* Professional */}
      <Card>
        <CardTitle>Профессиональные данные</CardTitle>
        <div className="flex flex-col gap-3.5">
          <FormGroup label="Специализация">
            <Select value={form.specialization} onChange={(e) => set('specialization', e.target.value)}>
              <option value="">Выберите специализацию</option>
              {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="СНИЛС" hint="Формат: XXX-XXX-XXX XX">
            <Input
              value={form.snils}
              onChange={(e) => set('snils', e.target.value)}
              placeholder="000-000-000 00"
              className="font-mono"
            />
          </FormGroup>
        </div>
      </Card>

      {/* Accreditation */}
      <Card>
        <CardTitle>Параметры аккредитации</CardTitle>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Дедлайн аккредитации" hint="Дата окончания текущего цикла НМО">
              <Input
                type="date"
                value={form.accreditationDeadline}
                onChange={(e) => set('accreditationDeadline', e.target.value)}
              />
            </FormGroup>
            <FormGroup label="Баллов требуется" hint="По умолчанию 250 ЗЕТ за 5 лет">
              <Input value={user.pointsRequired} disabled className="opacity-60 cursor-not-allowed" />
            </FormGroup>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notificationsEnabled}
              onChange={(e) => set('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <span className="text-[13px] text-[var(--text)]">
              Получать email-уведомления о дедлайнах и новых курсах
            </span>
          </label>
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">✓ Профиль сохранён</Alert>}

      <div className="flex justify-end">
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить изменения'}
        </Button>
      </div>
    </form>
  )
}
