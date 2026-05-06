import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { anthropic, AI_MODEL, SYSTEM_PROMPT } from '@/lib/ai/client'
import { rateLimit } from '@/lib/rate-limit'

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    userId: z.string(),
    name: z.string(),
    specialization: z.string(),
    pointsEarned: z.number(),
    pointsRequired: z.number(),
    deadline: z.string().nullable(),
    conversationId: z.string().nullable(),
  }),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { message, context } = parsed.data

  if (context.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rl = await rateLimit({ key: `rate:ai:${session.user.id}`, limit: 10, windowSec: 86400 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Превышен дневной лимит запросов к AI. Попробуйте завтра.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } },
    )
  }

  // Load message history server-side — never trust client-supplied history
  let existingMessages: { role: 'user' | 'assistant'; content: string }[] = []
  if (context.conversationId) {
    const conversation = await db.aiConversation.findUnique({
      where: { id: context.conversationId, userId: session.user.id },
      select: { messages: true },
    })
    if (conversation) {
      existingMessages = conversation.messages as typeof existingMessages
    }
  }

  const userContext = `
Профиль врача:
- Имя: ${context.name}
- Специализация: ${context.specialization || 'не указана'}
- Баллов набрано: ${context.pointsEarned} из ${context.pointsRequired}
- Дедлайн аккредитации: ${context.deadline ? new Date(context.deadline).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : 'не указан'}
- Осталось набрать: ${Math.max(0, context.pointsRequired - context.pointsEarned)} баллов
`

  const messages = [
    ...existingMessages,
    { role: 'user' as const, content: message },
  ]

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: userContext,
      },
    ],
    messages,
  })

  const assistantMessage = response.content[0]?.type === 'text'
    ? response.content[0].text
    : 'Извините, не могу ответить сейчас.'

  const updatedMessages = [
    ...existingMessages,
    { role: 'user' as const, content: message },
    { role: 'assistant' as const, content: assistantMessage },
  ]

  if (context.conversationId) {
    await db.aiConversation.update({
      where: { id: context.conversationId, userId: session.user.id },
      data: { messages: updatedMessages },
    })
  } else {
    await db.aiConversation.create({
      data: { userId: session.user.id, messages: updatedMessages },
    })
  }

  return NextResponse.json({ message: assistantMessage })
}
