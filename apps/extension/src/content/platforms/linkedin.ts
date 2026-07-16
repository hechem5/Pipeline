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

  // Use textContent instead of innerText, and collapse all whitespace into single spaces.
  // This prevents CSS layout or newlines from breaking our phrase matching!
  const bodyText = document.body?.textContent?.replace(/\s+/g, ' ').toLowerCase() || ''

  // --- Signal 1: Confirmation phrase anywhere on the page ---
  if (
    containsConfirmationPhrase(bodyText) ||
    bodyText.includes('your application was sent')
  ) {
    return buildResult()
  }

  // --- Signal 2: URL pattern ---
  if (
    pathname.includes('/applied') || 
    search.includes('applied=true') || 
    pathname.includes('post-apply') ||
    pathname.includes('post-apply-next-action')
  ) {
    return buildResult()
  }

  return null
}

function buildResult(): DetectedApplication {
  const bodyText = document.body?.textContent?.replace(/\s+/g, ' ') || ''
  
  // Try to extract company from the new modal text: "Your application was sent to [Company]!"
  let modalCompany = ''
  const modalMatch = bodyText.match(/your application was sent to (.*?)[!\n]/i)
  if (modalMatch && modalMatch[1]) {
    modalCompany = modalMatch[1].trim()
  }

  // Company: prefer modal match, then dedicated element, fall back to page title parsing
  const companyEl = document.querySelector(
    '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name',
  )
  const company = modalCompany || companyEl?.textContent?.trim() || extractCompanyFromTitle(document.title) || 'Unknown Company'

  // Title: prefer dedicated element, fall back to generic helper
  const titleEl = document.querySelector(
    '.job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title, .jobs-details-top-card__job-title',
  )
  const jobTitle =
    titleEl?.textContent?.trim() || extractJobTitleFromDOM() || document.title.split('|')[0].trim() || 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'linkedin',
    detectedAt: new Date().toISOString(),
  }
}
