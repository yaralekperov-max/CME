import type { CourseFormat, CourseType } from '@/types'

// TODO: сверить с номенклатурой из приказа Минздрава № 435н от 14.05.2026
// (рег. Минюста 09.06.2026 № 86977), действующей с 01.09.2026. Добавлено 11 новых
// специальностей, часть переименована («Гистология» → «Гистологическая техника»).
// Список ниже — сокращённая выборка по старой номенклатуре и требует обновления
// по тексту приказа: публикация на publication.pravo.gov.ru/document/0001202606100049
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
  BLENDED: 'Смешанный',
  WEBINAR: 'Вебинар',
  CONFERENCE: 'Конференция',
}

export const FORMAT_COLORS: Record<CourseFormat, 'green' | 'amber' | 'purple' | 'blue'> = {
  ONLINE: 'green',
  IN_PERSON: 'amber',
  BLENDED: 'green',
  WEBINAR: 'blue',
  CONFERENCE: 'purple',
}

/** Форматы, для которых врачу нужно физически приехать — требуется город. */
export const FORMATS_REQUIRING_CITY: CourseFormat[] = ['IN_PERSON', 'BLENDED']

export const FORMAT_HINTS: Partial<Record<CourseFormat, string>> = {
  BLENDED: 'Лекции дистанционно, практика и итоговая аттестация очно',
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
