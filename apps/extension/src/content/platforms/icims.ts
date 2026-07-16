// ---------------------------------------------------------------------------
// iCIMS — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: *.icims.com
//
// Detection strategy (checked in order):
//   1. URL contains "/thank-you", "/confirmation", or "?success=true"
//   2. Presence of .iCIMS_Header on a success page (iCIMS keeps the header
//      present but changes the body content on confirmation screens)
//   3. Page body text contains "successfully submitted" or known phrases
//
// Data extraction:
//   Company: from page <title> (first segment before "|" or "-")
//             or from logo/alt text of .iCIMS_Header img
//   Title  : <h1> or <title> second segment
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import {
  containsConfirmationPhrase,
  extractCompanyFromTitle,
  extractJobTitleFromDOM,
} from '../detector'

export function detectICIMS(): DetectedApplication | null {
  const { hostname, pathname, search } = window.location
  if (!hostname.includes('icims.com')) return null

  // --- Signal 1: URL patterns ---
  const pathLower = pathname.toLowerCase()
  const urlSignal =
    pathLower.includes('/thank-you') ||
    pathLower.includes('/confirmation') ||
    search.toLowerCase().includes('success=true') ||
    search.toLowerCase().includes('iis=apply') // iCIMS query param for apply completion

  // --- Signal 2: iCIMS header on success page ---
  const headerEl = document.querySelector('.iCIMS_Header')
  const headerSignal = headerEl !== null && urlSignal

  // --- Signal 3: Body text ---
  const bodyText = document.body?.innerText ?? ''
  const textSignal = containsConfirmationPhrase(bodyText)

  if (!urlSignal && !headerSignal && !textSignal) return null

  // --- Company extraction ---
  // Try logo alt text first
  const logoImg = document.querySelector<HTMLImageElement>('.iCIMS_Header img')
  const company =
    logoImg?.alt?.trim() || extractCompanyFromTitle(document.title) || 'Unknown Company'

  // --- Title extraction ---
  const jobTitle = extractJobTitleFromDOM() ?? 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'icims',
    detectedAt: new Date().toISOString(),
  }
}
