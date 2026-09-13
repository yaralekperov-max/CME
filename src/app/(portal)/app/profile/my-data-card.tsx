'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

export function MyDataCard() {
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    const res = await fetch('/api/profile', { method: 'DELETE' })
    if (res.ok) {
      await signOut({ callbackUrl: '/' })
    } else {
      setError('Не удалось удалить аккаунт. Попробуйте позже.')
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <Card>
      <CardTitle>Мои данные (ФЗ-152)</CardTitle>
      <p className="text-[13px] text-[var(--text2)] mb-4 leading-[1.6]">
        Согласно Федеральному закону №152-ФЗ вы имеете право получить копию своих персональных данных
        или потребовать их удаление.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface2)] border border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Скачать мои данные</div>
            <div className="text-[11px] text-[var(--text3)]">JSON-файл со всей вашей информацией и историей</div>
          </div>
          <a href="/api/profile/data" download>
            <Button variant="ghost" size="sm">Скачать</Button>
          </a>
        </div>

        <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--red-bg,#FFF5F5)] border border-[var(--red-border,#FECACA)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--red,#DC2626)]">Удалить аккаунт</div>
            <div className="text-[11px] text-[var(--text3)]">Все данные будут удалены безвозвратно</div>
          </div>
          {!confirm ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
              Удалить
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirm(false)} disabled={deleting}>
                Отмена
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="!bg-[var(--red,#DC2626)] !border-[var(--red,#DC2626)] hover:opacity-90"
              >
                {deleting ? 'Удаляем...' : 'Да, удалить'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="error" className="mt-3">{error}</Alert>}
    </Card>
  )
}
