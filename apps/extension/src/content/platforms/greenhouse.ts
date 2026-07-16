// ---------------------------------------------------------------------------
// Greenhouse — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: *.greenhouse.io and boards.greenhouse.io
//
// Detection strategy (checked in order):
//   1. URL path contains "/confirmation" or "/thank-you"
//   2. Page has a div.confirmation element with any content
//   3. <h1> or <h2> text contains a known confirmation phrase
//
// Data extraction:
//   Company: extracted from URL path segment after "greenhouse.io/"
//             e.g. boards.greenhouse.io/acmecorp → "acmecorp"
//   Title  : <h1> before the confirmation heading, or <title> first segment
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import { containsConfirmationPhrase, extractJobTitleFromDOM } from '../detector'

export function detectGreenhouse(): DetectedApplication | null {
  const { hostname, pathname } = window.location
  if (!hostname.includes('greenhouse.io')) return null

  // --- Signal 1: URL path ---
  const urlSignal =
    pathname.toLowerCase().includes('/confirmation') ||
    pathname.toLowerCase().includes('/thank-you') ||
    pathname.toLowerCase().includes('/thanks')

  // --- Signal 2: confirmation div ---
  const confirmEl = document.querySelector('.confirmation, [class*="confirmation"], [class*="thank"]')
  const domSignal = confirmEl !== null

  // --- Signal 3: heading text ---
  const headingText = [
    ...Array.from(document.querySelectorAll('h1, h2')).map((el) => el.textContent ?? ''),
  ].join(' ')
  const headingSignal = containsConfirmationPhrase(headingText)

  if (!urlSignal && !domSignal && !headingSignal) return null

  // --- Company extraction ---
  // boards.greenhouse.io/company_slug → "company_slug"
  const pathSegments = pathname.split('/').filter(Boolean)
  const company =
    pathSegments[0] && pathSegments[0] !== 'jobs'
      ? decodeURIComponent(pathSegments[0]).replace(/-/g, ' ')
      : hostname.split('.')[0]

  // --- Title extraction ---
  const allH1 = Array.from(document.querySelectorAll('h1'))
  // Avoid picking the confirmation heading itself; prefer the first <h1>
  const titleEl = allH1.find(
    (h) => !containsConfirmationPhrase(h.textContent ?? ''),
  )
  const jobTitle = titleEl?.textContent?.trim() ?? extractJobTitleFromDOM() ?? 'Unknown Position'

  return {
    company: company || 'Unknown Company',
    jobTitle,
    jobUrl: window.location.href,
    platform: 'greenhouse',
    detectedAt: new Date().toISOString(),
  }
}
