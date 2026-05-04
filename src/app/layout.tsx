import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MedCME — Портал НМО',
    template: '%s | MedCME',
  },
  description: 'Управление баллами непрерывного медицинского образования для врачей',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
