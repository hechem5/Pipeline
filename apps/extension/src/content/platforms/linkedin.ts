// ---------------------------------------------------------------------------
// LinkedIn Easy Apply — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: linkedin.com (all sub-paths)
//
// Detection strategy (checked in order):
//   1. An artdeco modal (.artdeco-modal) containing a known confirmation phrase
//   2. The Easy Apply success modal (.jobs-easy-apply-modal) with "Your application was sent"
//   3. URL path ending in "/applied" or containing "applied=true"
//
// Data extraction:
//   Company: .job-details-jobs-unified-top-card__company-name → page title fallback
//   Title  : .job-details-jobs-unified-top-card__job-title    → <h1> fallback
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import {
  containsConfirmationPhrase,
  extractCompanyFromTitle,
  extractJobTitleFromDOM,
} from '../detector'

export function detectLinkedIn(): DetectedApplication | null {
  const { hostname, pathname, search } = window.location
  if (!hostname.includes('linkedin.com')) return null

  // --- Signal 1: artdeco confirmation modal ---
  const modal = document.querySelector<HTMLElement>('.artdeco-modal')
  if (modal && containsConfirmationPhrase(modal.innerText)) {
    return buildResult()
  }

  // --- Signal 2: Easy Apply sent modal ---
  const easyApplyModal = document.querySelector<HTMLElement>('.jobs-easy-apply-modal')
  if (
    easyApplyModal &&
    easyApplyModal.innerText.toLowerCase().includes('your application was sent')
  ) {
    return buildResult()
  }

  // --- Signal 3: URL pattern ---
  if (pathname.includes('/applied') || search.includes('applied=true')) {
    return buildResult()
  }

  return null
}

function buildResult(): DetectedApplication {
  // Company: prefer dedicated element, fall back to page title parsing
  const companyEl = document.querySelector(
    '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name',
  )
  const company = companyEl?.textContent?.trim() ?? extractCompanyFromTitle(document.title)

  // Title: prefer dedicated element, fall back to generic helper
  const titleEl = document.querySelector(
    '.job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title',
  )
  const jobTitle =
    titleEl?.textContent?.trim() ?? extractJobTitleFromDOM() ?? 'Unknown Position'

  return {
    company: company || 'Unknown Company',
    jobTitle,
    jobUrl: window.location.href,
    platform: 'linkedin',
    detectedAt: new Date().toISOString(),
  }
}
