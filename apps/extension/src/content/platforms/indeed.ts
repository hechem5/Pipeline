// ---------------------------------------------------------------------------
// Indeed Apply — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: indeed.com (www.indeed.com and indeed.com)
//
// Detection strategy (checked in order):
//   1. Presence of .ia-AppliedSuccessMessage or .ia-SuccessMessage elements
//      (Indeed's internal React components for the "Application submitted" state)
//   2. A modal/overlay containing "Application submitted" text
//   3. URL query param "applied=true" (Indeed appends this on return from apply flow)
//
// Data extraction:
//   Company: [data-testid="company-name"] → .jobsearch-CompanyInfoWithoutHeaderImage
//   Title  : [data-testid="job-title"]   → <h1>
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import { containsConfirmationPhrase, extractJobTitleFromDOM } from '../detector'

export function detectIndeed(): DetectedApplication | null {
  const { hostname, search } = window.location
  if (!hostname.includes('indeed.com')) return null

  // --- Signal 1: Indeed success message components ---
  const successEl =
    document.querySelector('.ia-AppliedSuccessMessage') ??
    document.querySelector('.ia-SuccessMessage') ??
    document.querySelector('[class*="AppliedSuccess"]') ??
    document.querySelector('[class*="SuccessMessage"]')

  if (successEl) return buildResult()

  // --- Signal 2: Modal with confirmation text ---
  const modal =
    document.querySelector<HTMLElement>('[role="dialog"]') ??
    document.querySelector<HTMLElement>('.ia-Modal')
  if (modal && containsConfirmationPhrase(modal.innerText)) return buildResult()

  // --- Signal 3: URL query param ---
  if (search.toLowerCase().includes('applied=true')) return buildResult()

  return null
}

function buildResult(): DetectedApplication {
  // Company
  const companyEl =
    document.querySelector('[data-testid="company-name"]') ??
    document.querySelector('.jobsearch-CompanyInfoWithoutHeaderImage')
  const company = companyEl?.textContent?.trim() ?? 'Unknown Company'

  // Title
  const titleEl =
    document.querySelector('[data-testid="job-title"]') ?? document.querySelector('h1')
  const jobTitle = titleEl?.textContent?.trim() ?? extractJobTitleFromDOM() ?? 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'indeed',
    detectedAt: new Date().toISOString(),
  }
}
