import type { CourseFormat, CourseType } from '@/types'

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

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  QUALIFICATION: 'Повышение квалификации',
  MODULE: 'Образовательный модуль',
  EVENT: 'Мероприятие',
}

/** Короткая подпись для карточек в каталоге, где мало места. */
export const COURSE_TYPE_SHORT: Record<CourseType, string> = {
  QUALIFICATION: 'ПК · удостоверение',
  MODULE: 'ИОМ',
  EVENT: 'Мероприятие',
}

export const COURSE_TYPE_COLORS: Record<CourseType, 'purple' | 'blue' | 'amber'> = {
  QUALIFICATION: 'purple',
  MODULE: 'blue',
  EVENT: 'amber',
}

export const COURSE_TYPE_HINTS: Record<CourseType, string> = {
  QUALIFICATION:
    'Программа дополнительного профессионального образования. По итогам выдаётся удостоверение о повышении квалификации — основной документ для аккредитации.',
  MODULE:
    'Интерактивный образовательный модуль НМО. Начисляются баллы (ЗЕТ), удостоверение не выдаётся.',
  EVENT:
    'Конференция, семинар или вебинар, аккредитованный Координационным советом. Начисляются баллы (ЗЕТ).',
}
