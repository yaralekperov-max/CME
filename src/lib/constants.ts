import type { CourseFormat } from '@/types'

export const SPECIALIZATIONS = [
  'Кардиология', 'Терапия', 'Хирургия', 'Педиатрия', 'Неврология',
  'Онкология', 'Эндокринология', 'Гастроэнтерология', 'Пульмонология',
  'Ревматология', 'Нефрология', 'Урология', 'Гинекология', 'Офтальмология',
  'Оториноларингология', 'Дерматология', 'Психиатрия', 'Анестезиология',
  'Лучевая диагностика', 'Патологическая анатомия',
]

export const FORMAT_LABELS: Record<CourseFormat, string> = {
  ONLINE: 'Онлайн',
  IN_PERSON: 'Очный',
  WEBINAR: 'Вебинар',
  CONFERENCE: 'Конференция',
}

export const FORMAT_COLORS: Record<CourseFormat, 'green' | 'amber' | 'purple' | 'blue'> = {
  ONLINE: 'green',
  IN_PERSON: 'amber',
  WEBINAR: 'blue',
  CONFERENCE: 'purple',
}
