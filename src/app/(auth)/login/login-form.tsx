'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, FormGroup } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('callbackUrl') ?? ''
  const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/app/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Неверный email или пароль')
      setLoading(false)
      return
    }

    router.push(callbackUrl)
  }

  const resetDone = params.get('reset') === '1'

  return (
    <>
    {resetDone && <Alert variant="success" className="mb-4">Пароль успешно изменён. Войдите с новым паролем.</Alert>}
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormGroup label="Email">
        <Input
          type="email"
          placeholder="doctor@clinic.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormGroup>

      <FormGroup label="Пароль">
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <a href="/forgot-password" className="text-[11px] text-[var(--accent)] hover:underline self-end mt-1">
          Забыли пароль?
        </a>
      </FormGroup>

      {error && (
        <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[6px]">
          {error}
        </p>
      )}

      <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center mt-1">
        {loading ? 'Входим...' : 'Войти'}
      </Button>
    </form>
    </>
  )
}
