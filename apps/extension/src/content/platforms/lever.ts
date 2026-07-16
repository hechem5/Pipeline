// ---------------------------------------------------------------------------
// Lever — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: jobs.lever.co
//
// Detection strategy (checked in order):
//   1. URL path matches pattern: /jobs.lever.co/:company/:id/apply/thank-you
//      or any path segment equals "thank-you"
//   2. Presence of .thank-you element or any heading containing "thank you"
//
// Data extraction:
//   Company: first path segment after jobs.lever.co/
//             e.g. jobs.lever.co/acmecorp/uuid → "acmecorp"
//   Title  : .posting-headline h2, falls back to <h2> or <h1>
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'

export function detectLever(): DetectedApplication | null {
  const { hostname, pathname } = window.location
  if (!hostname.includes('lever.co')) return null

  // --- Signal 1: URL "thank-you" segment ---
  const pathLower = pathname.toLowerCase()
  const urlSignal = pathLower.includes('thank-you') || pathLower.includes('thankyou')

  // --- Signal 2: thank-you DOM element or heading ---
  const thankYouEl = document.querySelector('.thank-you, [class*="thank-you"], [class*="thankyou"]')
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
  const headingSignal = headings.some((h) =>
    h.textContent?.toLowerCase().includes('thank you'),
  )

  if (!urlSignal && !thankYouEl && !headingSignal) return null

  // --- Company extraction ---
  // jobs.lever.co/company/job-id/apply/thank-you → segments[0] = "company"
  const segments = pathname.split('/').filter(Boolean)
  const company = segments[0]
    ? decodeURIComponent(segments[0]).replace(/-/g, ' ')
    : 'Unknown Company'

  // --- Title extraction ---
  const titleEl =
    document.querySelector<HTMLElement>('.posting-headline h2') ??
    document.querySelector<HTMLElement>('h2') ??
    document.querySelector<HTMLElement>('h1')
  const jobTitle = titleEl?.textContent?.trim() ?? 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'lever',
    detectedAt: new Date().toISOString(),
  }
}
