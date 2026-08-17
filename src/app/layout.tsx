import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'NMOBALL — курсы повышения квалификации для врачей',
    template: '%s | NMOBALL',
  },
  description:
    'Каталог программ повышения квалификации и курсов НМО для врачей: подбор по специальности, формату и бюджету, напоминания о сроках аккредитации',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
