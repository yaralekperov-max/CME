'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UserContext {
  userId: string
  name: string
  specialization: string
  pointsEarned: number
  pointsRequired: number
  deadline: string | null
  conversationId: string | null
}

interface AiChatProps {
  userContext: UserContext
  initialMessages: Message[]
}

export function AiChat({ userContext, initialMessages }: AiChatProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            role: 'assistant',
            content: `Привет, ${userContext.name.split(' ')[0]}! Вижу вашу ситуацию: **${userContext.pointsEarned} из ${userContext.pointsRequired} баллов**${userContext.deadline ? `, дедлайн ${new Date(userContext.deadline).toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}` : ''}. Чем могу помочь?`,
          },
        ],
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const q = searchParams.get('q')
    if (!q) return
    router.replace(pathname)
    sendMessage(q)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: userContext,
        }),
      })

      const data = await res.json()
      const assistantMsg: Message = { role: 'assistant', content: data.message }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте ещё раз.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-[var(--surface)] border border-[var(--accent-mid)] rounded-[var(--r-lg,16px)] p-4 flex flex-col min-h-0 shadow-[0_0_0_3px_var(--accent-light)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-sm text-white">✦</div>
        <div>
          <div className="text-[13px] font-semibold font-display text-[var(--text)]">AI-ассистент NMO</div>
          <div className="text-[11px] text-[var(--text3)]">Знает ваш профиль, баллы и дедлайн</div>
        </div>
        <span className="ml-auto text-[11px] text-[var(--green)] bg-[var(--green-bg)] px-2 py-0.5 rounded-full">Онлайн</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'assistant'
                ? 'bg-[var(--accent-light)] rounded-[4px_12px_12px_12px] px-3.5 py-3 text-[13px] text-[var(--text)] leading-relaxed max-w-[90%]'
                : 'bg-[var(--surface2)] rounded-[12px_12px_4px_12px] px-3.5 py-3 text-[13px] text-[var(--text)] leading-relaxed max-w-[85%] self-end'
            }
          >
            <MessageContent content={msg.content} />
          </div>
        ))}
        {loading && (
          <div className="bg-[var(--accent-light)] rounded-[4px_12px_12px_12px] px-3.5 py-3 text-[13px] text-[var(--text3)] max-w-[90%]">
            Думаю…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div className="flex gap-1.5 flex-wrap mb-3 flex-shrink-0">
        {['📋 Показать план', '💰 Только бесплатные', '📍 Очные в Москве', 'Сколько осталось?'].map((chip) => (
          <button
            key={chip}
            onClick={() => sendMessage(chip)}
            className="px-3 py-1.5 text-[12px] font-medium border border-[var(--accent-mid)] rounded-full text-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-light)] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Спросите что угодно про баллы, курсы, план аккредитации..."
          className="flex-1 px-3 py-2 text-[13px] border border-[var(--border)] rounded-[var(--r-md,12px)] bg-[var(--surface2)] text-[var(--text)] outline-none focus:border-[var(--accent-mid)] placeholder:text-[var(--text3)]"
          disabled={loading}
        />
        <Button variant="primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          ↑
        </Button>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // Simple bold markdown rendering
  const parts = content.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
