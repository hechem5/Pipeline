// ---------------------------------------------------------------------------
// Shared TypeScript types used across the Pipeline extension
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'APPLIED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED'

export type ApplicationSource = 'MANUAL' | 'AUTO_DETECTED' | 'AI_TAILORED'

export type PlatformName =
  | 'linkedin'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'icims'
  | 'indeed'
  | 'generic'

// ---- Detection results -------------------------------------------------------

export interface DetectedApplication {
  company: string
  jobTitle: string
  jobUrl: string
  platform: PlatformName
  detectedAt: string // ISO 8601
}

export interface DetectedJobPosting {
  company: string
  jobTitle: string
  jobUrl: string
  jobDescription: string
  platform: PlatformName
  detectedAt: string // ISO 8601
}

// ---- Autofill ----------------------------------------------------------------

export interface AutofillRequest {
  applicationId: string
  tailoredCv: Record<string, unknown>
  coverLetter: string
  platform: PlatformName
}

// ---- Messaging ---------------------------------------------------------------

export interface MessageToBackground {
  type:
    | 'APPLICATION_DETECTED'
    | 'JOB_POSTING_DETECTED'
    | 'AUTOFILL_REQUEST'
    | 'GET_AUTH_TOKEN'
    | 'LOG_MANUAL'
  payload:
    | DetectedApplication
    | DetectedJobPosting
    | AutofillRequest
    | Record<string, never>
}

// ---- Storage -----------------------------------------------------------------

export interface StoredAuth {
  token: string
  userId: string
  email: string
}

export interface PendingReview {
  applicationId: string
  company: string
  jobTitle: string
  fitScore: number
  createdAt: string
}

// ---- API shapes --------------------------------------------------------------

export interface ApplicationRecord {
  id: string
  company: string
  jobTitle: string
  jobUrl: string
  status: ApplicationStatus
  source: ApplicationSource
  appliedAt: string
}
