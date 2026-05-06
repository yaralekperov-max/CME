'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

export function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return <Alert variant="error">Недействительная ссылка. Запросите новую.</Alert>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Ссылка недействительна или истекла')
      setLoading(false)
      return
    }

    router.push('/login?reset=1')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormGroup label="Новый пароль">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 8 символов"
          required
          autoComplete="new-password"
        />
      </FormGroup>

      <FormGroup label="Повторите пароль">
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </FormGroup>

      {error && <Alert variant="error">{error}</Alert>}

      <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Сохраняем...' : 'Сохранить пароль'}
      </Button>
    </form>
  )
}
