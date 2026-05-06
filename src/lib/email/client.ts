interface SendEmailParams {
  to: string
  subject: string
  html: string
}

async function getSendPulseToken(): Promise<string> {
  const res = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SENDPULSE_CLIENT_ID,
      client_secret: process.env.SENDPULSE_CLIENT_SECRET,
    }),
  })
  const data = await res.json()
  return data.access_token as string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const token = await getSendPulseToken()

  await fetch('https://api.sendpulse.com/smtp/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: {
        html,
        subject,
        from: {
          name: process.env.SENDPULSE_FROM_NAME,
          email: process.env.SENDPULSE_FROM_EMAIL,
        },
        to: [{ email: to }],
      },
    }),
  })
}

export function verificationEmailHtml(doctorName: string, verifyUrl: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="font-family:Manrope,sans-serif;color:#1C1B18">Подтвердите email</h2>
      <p>Привет, ${doctorName}!</p>
      <p>Нажмите кнопку ниже, чтобы подтвердить адрес электронной почты и активировать аккаунт на NMOBALL.</p>
      <a href="${verifyUrl}"
         style="display:inline-block;background:#6B5FE4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
        Подтвердить email
      </a>
      <p style="margin-top:16px;color:#888;font-size:13px">
        Ссылка действует 24 часа. Если вы не регистрировались на NMOBALL — просто проигнорируйте это письмо.
      </p>
    </div>
  `
}

export function deadlineReminderHtml(doctorName: string, daysLeft: number, pointsLeft: number) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="font-family:Manrope,sans-serif;color:#1C1B18">Напоминание о дедлайне аккредитации</h2>
      <p>Уважаемый(ая) ${doctorName},</p>
      <p>До дедлайна аккредитации осталось <strong>${daysLeft} дней</strong>.
         Вам нужно набрать ещё <strong>${pointsLeft} баллов НМО</strong>.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/catalog"
         style="display:inline-block;background:#6B5FE4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
        Найти курсы
      </a>
    </div>
  `
}
