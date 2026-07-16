// ---------------------------------------------------------------------------
// Shared detection utilities for Pipeline content scripts
// ---------------------------------------------------------------------------

import type { PlatformName } from '../shared/types'

// ---------------------------------------------------------------------------
// Confirmation phrases (case-insensitive match)
// ---------------------------------------------------------------------------

export const CONFIRMATION_PHRASES = [
  'application submitted',
  'application received',
  'thank you for applying',
  "we've received your application",
  'we received your application',
  'you have successfully applied',
  'your application has been submitted',
  'application complete',
  'successfully submitted your application',
  'your application is on its way',
  'application sent',
]

/**
 * Returns true if the given text contains any known confirmation phrase.
 * Comparison is case-insensitive.
 */
export function containsConfirmationPhrase(text: string): boolean {
  const lower = text.toLowerCase()
  return CONFIRMATION_PHRASES.some((phrase) => lower.includes(phrase))
}

// ---------------------------------------------------------------------------
// Company / title extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a company name from a browser <title> string.
 * e.g. "Software Engineer at Acme Corp | LinkedIn" → "Acme Corp"
 */
export function extractCompanyFromTitle(title: string): string {
  // Pattern: "Role at Company | Platform"
  const atMatch = title.match(/\bat\s+([^|–\-]+)/i)
  if (atMatch) return atMatch[1].trim()

  // Pattern: "Company - Role"
  const dashMatch = title.match(/^([^-–]+)[–-]/)
  if (dashMatch) return dashMatch[1].trim()

  return title.split('|')[0].trim()
}

/**
 * Attempts to extract the job title from common DOM selectors used across ATSes.
 * Returns null if nothing reliable is found.
 */
export function extractJobTitleFromDOM(): string | null {
  const selectors = [
    // LinkedIn
    '.job-details-jobs-unified-top-card__job-title h1',
    '.job-details-jobs-unified-top-card__job-title',
    // Greenhouse
    'h1.app-title',
    // Lever
    '.posting-headline h2',
    // Workday
    '[data-automation-id="Job_Posting_Title"]',
    // Indeed
    '[data-testid="job-title"]',
    // Generic
    'h1',
  ]

  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }
  return null
}

/** Returns the current page URL. */
export function getCurrentUrl(): string {
  return window.location.href
}

/**
 * Maps a hostname to a known PlatformName.
 * Falls back to 'generic' for unknown hosts.
 */
export function getPlatformFromHostname(hostname: string): PlatformName {
  if (hostname.includes('linkedin.com')) return 'linkedin'
  if (hostname.includes('greenhouse.io')) return 'greenhouse'
  if (hostname.includes('lever.co')) return 'lever'
  if (hostname.includes('myworkdayjobs.com')) return 'workday'
  if (hostname.includes('icims.com')) return 'icims'
  if (hostname.includes('indeed.com')) return 'indeed'
  return 'generic'
}
