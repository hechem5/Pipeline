// ---------------------------------------------------------------------------
// Job Posting Detector — Feature 2 (AI-tailored apply)
// ---------------------------------------------------------------------------
// Detects when the user is viewing a JOB POSTING page (not a confirmation page).
// Fires JOB_POSTING_DETECTED to the background so the backend can:
//   1. Score the fit against the user's profile
//   2. Optionally surface "Tailor & Apply" in the popup
//
// Dedup: tracks detected URLs in sessionStorage under "pipeline_detected_postings"
// so each posting is only sent once per browser session.
// ---------------------------------------------------------------------------

import type { DetectedJobPosting, PlatformName } from '../shared/types'

const SESSION_KEY = 'pipeline_detected_postings'

function hasDetectedPosting(url: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : []
    return seen.includes(url)
  } catch {
    return false
  }
}

function markPostingDetected(url: string): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : []
    seen.push(url)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen))
  } catch {
    // Ignore if sessionStorage is unavailable
  }
}

// ---------------------------------------------------------------------------
// Platform-specific extractors
// ---------------------------------------------------------------------------

function detectLinkedInPosting(): DetectedJobPosting | null {
  // Matches: linkedin.com/jobs/view/... pages
  // Requires: .job-view-layout or [data-job-id] and NO confirmation modal
  const { hostname, pathname } = window.location
  if (!hostname.includes('linkedin.com')) return null
  if (!pathname.includes('/jobs/view/') && !document.querySelector('[data-job-id]')) return null

  // Skip if confirmation modal is visible — that means the user already applied
  const confirmModal = document.querySelector('.artdeco-modal')
  if (confirmModal && confirmModal.textContent?.toLowerCase().includes('application')) return null

  const titleEl = document.querySelector(
    '.job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title',
  )
  const companyEl = document.querySelector(
    '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name',
  )
  const descEl =
    document.querySelector('#job-details') ?? document.querySelector('.jobs-description')

  const jobTitle = titleEl?.textContent?.trim()
  const company = companyEl?.textContent?.trim()
  if (!jobTitle || !company) return null

  return build('linkedin', company, jobTitle, descEl?.textContent?.trim() ?? '')
}

function detectGreenhousePosting(): DetectedJobPosting | null {
  // Matches: *.greenhouse.io pages with an #application form
  // Skips: confirmation pages
  const { hostname, pathname } = window.location
  if (!hostname.includes('greenhouse.io')) return null
  if (pathname.toLowerCase().includes('/confirmation')) return null

  const appForm = document.querySelector('#application')
  if (!appForm) return null

  const titleEl = document.querySelector('h1')
  const descEl = document.querySelector('.content, .job-post-description')
  const segments = pathname.split('/').filter(Boolean)
  const company = segments[0]
    ? decodeURIComponent(segments[0]).replace(/-/g, ' ')
    : hostname.split('.')[0]

  const jobTitle = titleEl?.textContent?.trim()
  if (!jobTitle) return null

  return build('greenhouse', company, jobTitle, descEl?.textContent?.trim() ?? '')
}

function detectLeverPosting(): DetectedJobPosting | null {
  // Matches: jobs.lever.co/:company/:id (NO /thank-you in path)
  const { hostname, pathname } = window.location
  if (!hostname.includes('lever.co')) return null
  if (pathname.toLowerCase().includes('thank-you')) return null

  const segments = pathname.split('/').filter(Boolean)
  // Lever URL: /company/uuid
  if (segments.length < 2) return null

  const company = decodeURIComponent(segments[0]).replace(/-/g, ' ')
  const titleEl = document.querySelector<HTMLElement>('.posting-headline h2')
  const descEl = document.querySelector('.section-wrapper')

  const jobTitle = titleEl?.textContent?.trim()
  if (!jobTitle) return null

  return build('lever', company, jobTitle, descEl?.textContent?.trim() ?? '')
}

function detectIndeedPosting(): DetectedJobPosting | null {
  // Matches: indeed.com/viewjob?jk=... individual job pages
  const { hostname, search } = window.location
  if (!hostname.includes('indeed.com')) return null
  if (!search.includes('jk=')) return null

  const titleEl = document.querySelector('[data-testid="job-title"]')
  const companyEl = document.querySelector('[data-testid="company-name"]')
  const descEl = document.querySelector('#jobDescriptionText')

  const jobTitle = titleEl?.textContent?.trim()
  const company = companyEl?.textContent?.trim()
  if (!jobTitle || !company) return null

  return build('indeed', company, jobTitle, descEl?.textContent?.trim() ?? '')
}

// ---------------------------------------------------------------------------
// Builder helper
// ---------------------------------------------------------------------------

function build(
  platform: PlatformName,
  company: string,
  jobTitle: string,
  jobDescription: string,
): DetectedJobPosting {
  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    jobDescription,
    platform,
    detectedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Main export — runs all platform detectors and sends to background
// ---------------------------------------------------------------------------

export function runJobPostingDetector(): void {
  const url = window.location.href
  if (hasDetectedPosting(url)) return

  const posting =
    detectLinkedInPosting() ??
    detectGreenhousePosting() ??
    detectLeverPosting() ??
    detectIndeedPosting()

  if (!posting) return

  markPostingDetected(url)
  console.log('[Pipeline] Job posting detected:', posting.company, posting.jobTitle)

  chrome.runtime.sendMessage({
    type: 'JOB_POSTING_DETECTED',
    payload: posting,
  })
}

// Auto-run if loaded as a standalone content script
runJobPostingDetector()
