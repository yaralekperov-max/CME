import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Бесплатно'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(kopecks / 100)
}

export function formatPoints(points: number): string {
  return `${points} ЗЕТ`
}

export function noun(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

export function formatMonthsLeft(deadline: Date): string {
  const months = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  if (months <= 0) return 'Истёк'
  return `${months} ${noun(months, ['месяц', 'месяца', 'месяцев'])}`
}

export function isDeadlineSoon(date: Date, days = 14): boolean {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= days
}

export function getAccreditationRisk(
  pointsEarned: number,
  pointsRequired: number,
  deadline: Date,
): 'ok' | 'warn' | 'critical' {
  const remaining = pointsRequired - pointsEarned
  if (remaining <= 0) return 'ok'

  const monthsLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  if (monthsLeft <= 0) return 'critical'

  // Assume ~43 points/year pace by default
  const projectedPoints = pointsEarned + (43 / 12) * monthsLeft

  if (projectedPoints >= pointsRequired) return 'ok'
  if (projectedPoints >= pointsRequired * 0.85) return 'warn'
  return 'critical'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}
