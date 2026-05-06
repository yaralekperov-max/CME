'use client'

import { useState } from 'react'
import { Input, Select, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { SPECIALIZATIONS } from '@/lib/constants'

type FieldErrors = Partial<Record<string, string[]>>

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [registeredEmail, setRegisteredEmail] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    specialization: '',
    workplace: '',
    city: '',
    phone: '',
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: ['Пароли не совпадают'] })
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        specialization: form.specialization,
        workplace: form.workplace || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.error?.fields) {
        setFieldErrors(data.error.fields)
      } else {
        setError(data.error?.message ?? 'Ошибка регистрации')
      }
      setLoading(false)
      return
    }

    setRegisteredEmail(form.email)
  }

  function fieldError(key: string) {
    return fieldErrors[key]?.[0]
  }

  return (
    <>
    {registeredEmail ? (
      <Alert variant="success">
        <div>
          <strong>Осталось подтвердить email!</strong><br />
          Письмо отправлено на <strong>{registeredEmail}</strong>. Перейдите по ссылке в письме для активации аккаунта.
        </div>
      </Alert>
    ) : (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormGroup label="ФИО *" hint={fieldError('name')}>
        <Input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Иванов Иван Иванович"
          required
          className={fieldError('name') ? 'border-[var(--red)]' : ''}
        />
      </FormGroup>

      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Email *" hint={fieldError('email')}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="doctor@clinic.ru"
            required
            autoComplete="email"
            className={fieldError('email') ? 'border-[var(--red)]' : ''}
          />
        </FormGroup>
        <FormGroup label="Телефон" hint={fieldError('phone')}>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+7 (999) 000-00-00"
          />
        </FormGroup>
      </div>

      <FormGroup label="Специализация *" hint={fieldError('specialization')}>
        <Select
          value={form.specialization}
          onChange={(e) => set('specialization', e.target.value)}
          required
          className={fieldError('specialization') ? 'border-[var(--red)]' : ''}
        >
          <option value="">Выберите специализацию</option>
          {SPECIALIZATIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </FormGroup>

      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Место работы" hint={fieldError('workplace')}>
          <Input
            value={form.workplace}
            onChange={(e) => set('workplace', e.target.value)}
            placeholder="НМИЦ кардиологии"
          />
        </FormGroup>
        <FormGroup label="Город" hint={fieldError('city')}>
          <Input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Москва"
          />
        </FormGroup>
      </div>

      <div className="h-px bg-[var(--border)]" />

      <FormGroup label="Пароль *" hint={fieldError('password')}>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Минимум 8 символов"
          required
          autoComplete="new-password"
          className={fieldError('password') ? 'border-[var(--red)]' : ''}
        />
      </FormGroup>

      <FormGroup label="Повторите пароль *" hint={fieldError('passwordConfirm')}>
        <Input
          type="password"
          value={form.passwordConfirm}
          onChange={(e) => set('passwordConfirm', e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          className={fieldError('passwordConfirm') ? 'border-[var(--red)]' : ''}
        />
      </FormGroup>

      {error && (
        <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[6px]">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        type="submit"
        disabled={loading}
        className="w-full justify-center mt-1"
      >
        {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
      </Button>

      <p className="text-[11px] text-[var(--text3)] text-center">
        Регистрируясь, вы соглашаетесь с{' '}
        <a href="/privacy" className="text-[var(--accent)] hover:underline">
          политикой конфиденциальности
        </a>
      </p>
    </form>
    )}
    </>
  )
}
