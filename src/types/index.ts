import type {
  User,
  Organization,
  Course,
  Enrollment,
  Certificate,
  PointsTransaction,
  CourseFormat,
  CourseType,
  FundingType,
  CourseStatus,
  EnrollmentStatus,
  CertStatus,
  UserRole,
  OrgStatus,
} from '@prisma/client'

// Re-export Prisma enums for convenience
export type {
  CourseFormat,
  CourseType,
  FundingType,
  CourseStatus,
  EnrollmentStatus,
  CertStatus,
  UserRole,
  OrgStatus,
}

// ─── Extended types with relations ───────────────────────────────

export type DoctorProfile = User & {
  pointsEarned: number
  pointsInProgress: number
  enrollments?: Enrollment[]
}

export type CourseWithOrg = Course & {
  organization: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl'>
  enrollmentCount?: number
  completionCount?: number
  userEnrollment?: Enrollment | null
}

export type EnrollmentWithCourse = Enrollment & {
  course: CourseWithOrg
}

export type CertificateWithCourse = Certificate & {
  course?: Pick<Course, 'id' | 'title'> | null
}

// ─── API response shapes ──────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: {
    message: string
    code?: string
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ─── Points summary ───────────────────────────────────────────────

export interface PointsSummary {
  earned: number
  inProgress: number
  required: number
  remaining: number
  pacePerYear: number
  requiredPacePerYear: number
  projectedTotal: number
  deadlineDate: Date | null
  riskLevel: 'ok' | 'warn' | 'critical'
}

// ─── Course catalog filters ───────────────────────────────────────

export interface CourseFilters {
  format?: CourseFormat[]
  courseType?: CourseType[]
  fundingType?: FundingType[]
  specializations?: string[]
  minPoints?: number
  maxPoints?: number
  search?: string
  page?: number
  limit?: number
  sort?: 'relevance' | 'points_desc' | 'deadline_asc' | 'price_asc'
}

// ─── Admin stats ──────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalDoctors: number
  newDoctorsThisMonth: number
  totalCourses: number
  newCoursesThisWeek: number
  totalOrganizations: number
  pendingModeration: number
  revenueThisMonth: number
  revenueGrowthPct: number
}

// ─── NextAuth session extensions ─────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      specialization?: string
      avatarUrl?: string
      organizationId?: string
    }
  }
}
