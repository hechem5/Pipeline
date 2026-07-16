export type ApplicationStatus = 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'OFFER' | 'REJECTED' | 'GHOSTED'
export type ApplicationSource = 'MANUAL' | 'AUTO_DETECTED' | 'AI_TAILORED'

export interface Application {
  id: string
  userId: string
  company: string
  jobTitle: string
  jobUrl?: string
  platform?: string
  status: ApplicationStatus
  source: ApplicationSource
  appliedAt: string
  lastStatusUpdate: string
  tailoredCvUrl?: string
  coverLetterText?: string
  fitScore?: number
  notes?: string
}

export interface BaseCv {
  id: string
  userId: string
  rawFileUrl?: string
  structuredData: StructuredCv
  updatedAt: string
}

export interface StructuredCv {
  name: string
  email?: string
  phone?: string
  summary?: string
  skills: string[]
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate?: string
    bullets: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    year?: string
  }>
  certifications?: string[]
}

export interface JobMatchResult {
  match: boolean
  fitScore: number
  rationale?: string
  tailoredCv?: StructuredCv
  coverLetter?: string
  applicationId?: string
}

export interface UserSettings {
  ghostedThresholdDays: number
  emailIntegrationEnabled: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}
