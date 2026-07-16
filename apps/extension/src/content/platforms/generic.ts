// ---------------------------------------------------------------------------
// Generic catch-all confirmation detector
// ---------------------------------------------------------------------------
// Matches: ANY URL not covered by a specific platform detector.
//
// Detection strategy:
//   1. URL path must contain /apply, /application, /jobs, or /careers
//      (reduces false-positives on unrelated pages)
//   2. document.body.innerText must contain a known confirmation phrase
//
// False-positive guards:
//   - Only fires once per page URL (tracked in sessionStorage under
//     "pipeline_generic_seen" as a JSON array of URLs)
//   - Requires BOTH an application-context URL AND phrase match
//
// Data extraction: best-effort from <title>, <h1>, and Open Graph meta tags
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import {
  containsConfirmationPhrase,
  extractCompanyFromTitle,
  extractJobTitleFromDOM,
} from '../detector'

const SESSION_KEY = 'pipeline_generic_seen'

function isApplicationUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('/apply') ||
    lower.includes('/application') ||
    lower.includes('/jobs') ||
    lower.includes('/careers') ||
    lower.includes('/job/') ||
    lower.includes('/position')
  )
}

function hasSeenUrl(url: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : []
    return seen.includes(url)
  } catch {
    return false
  }
}

function markUrlSeen(url: string): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : []
    seen.push(url)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen))
  } catch {
    // sessionStorage may be unavailable in some contexts — ignore
  }
}

export function detectGeneric(): DetectedApplication | null {
  const url = window.location.href

  // Already fired for this URL this session
  if (hasSeenUrl(url)) return null

  // Must look like an application flow
  if (!isApplicationUrl(url)) return null

  // Must have confirmation phrase in body
  const bodyText = document.body?.innerText ?? ''
  if (!containsConfirmationPhrase(bodyText)) return null

  markUrlSeen(url)

  // --- Data extraction ---
  // Company: Open Graph site_name → <title> parsing
  const ogSite = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')
  const company =
    ogSite?.content?.trim() || extractCompanyFromTitle(document.title) || 'Unknown Company'

  // Title: Open Graph title → DOM helper → page <title>
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
  const jobTitle =
    ogTitle?.content?.trim() || extractJobTitleFromDOM() || document.title || 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: url,
    platform: 'generic',
    detectedAt: new Date().toISOString(),
  }
}
