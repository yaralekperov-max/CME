'use client'

import { useState } from 'react'
import { Input, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.status === 429) {
      setError('Слишком много попыток. Попробуйте через час.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Alert variant="success">
        ✓ Если аккаунт с таким email существует — письмо уже в пути. Проверьте почту.
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormGroup label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="doctor@clinic.ru"
          required
          autoComplete="email"
        />
      </FormGroup>

      {error && <Alert variant="error">{error}</Alert>}

      <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Отправляем...' : 'Отправить ссылку'}
      </Button>
    </form>
  )
}
