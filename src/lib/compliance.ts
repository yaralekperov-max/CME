import type { CourseFormat, CourseType } from '@/types'
import { FORMATS_REQUIRING_CITY } from '@/lib/constants'

/**
 * Проверки легитимности программы по правилам, действующим с 01.03.2026
 * (ФЗ № 28-ФЗ от 28.02.2025, ПП РФ № 1942 от 28.11.2025).
 *
 * Смысл: если врач пройдёт программу из каталога и его развернут на
 * аккредитационной комиссии — это отказ доверия ко всей платформе. Поэтому
 * несоответствие блокирует публикацию, а не просто подсвечивается.
 */

export interface ComplianceInput {
  courseType: CourseType
  format: CourseFormat
  typicalProgramOrder: string | null
  inPersonCity: string | null
  organization: {
    practiceApprovalNumber: string | null
  }
}

export interface ComplianceIssue {
  /** Блокирующее нарушение — публиковать нельзя. */
  blocking: boolean
  message: string
}

export function checkCompliance(course: ComplianceInput): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const isQualification = course.courseType === 'QUALIFICATION'

  if (isQualification && !course.typicalProgramOrder?.trim()) {
    issues.push({
      blocking: true,
      message:
        'Не указана типовая программа Минздрава. С 01.03.2026 программы ПК реализуются только по типовым программам — без реквизитов приказа удостоверение могут не принять на аккредитации.',
    })
  }

  if (isQualification && !course.organization.practiceApprovalNumber?.trim()) {
    issues.push({
      blocking: true,
      message:
        'У организации не указано заключение о соответствии требованиям к практической подготовке (ПП РФ № 1942). Без него она не вправе реализовывать программы по типовым ДПП.',
    })
  }

  if (isQualification && course.format === 'ONLINE') {
    issues.push({
      blocking: true,
      message:
        'Программа ПК заявлена как полностью дистанционная. Это допустимо, только если сама типовая программа предусматривает такой формат — иначе выберите «Смешанный» или «Очный».',
    })
  }

  if (FORMATS_REQUIRING_CITY.includes(course.format) && !course.inPersonCity?.trim()) {
    issues.push({
      blocking: false,
      message:
        'Не указан город очной части. Врачу важно понимать, куда придётся приехать, до записи на программу.',
    })
  }

  return issues
}

export function hasBlockingIssues(course: ComplianceInput): boolean {
  return checkCompliance(course).some((i) => i.blocking)
}

/** Курс подтверждён как соответствующий типовой программе — можно показать бейдж доверия. */
export function isTypicalProgramConfirmed(course: {
  courseType: CourseType
  typicalProgramOrder: string | null
}): boolean {
  return course.courseType === 'QUALIFICATION' && !!course.typicalProgramOrder?.trim()
}
