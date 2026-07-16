// ---------------------------------------------------------------------------
// Workday — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: *.myworkdayjobs.com
//
// Detection strategy (checked in order):
//   1. Workday automation ID: [data-automation-id="confirmationPage"] is present
//   2. URL path contains "/apply/" and the page has "submitted" heading
//   3. <h2> or page text contains "application submitted" or "thank you"
//
// Data extraction:
//   Company: from URL subdomain — e.g. "acme.myworkdayjobs.com" → "acme"
//   Title  : [data-automation-id="Job_Posting_Title"] → <h1> fallback
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import { containsConfirmationPhrase } from '../detector'

export function detectWorkday(): DetectedApplication | null {
  const { hostname, pathname } = window.location
  if (!hostname.includes('myworkdayjobs.com')) return null

  // --- Signal 1: Workday confirmation page automation ID ---
  const confirmPage = document.querySelector('[data-automation-id="confirmationPage"]')
  if (confirmPage) return buildResult(hostname)

  // --- Signal 2: URL + "submitted" heading ---
  const inApplyFlow = pathname.toLowerCase().includes('/apply/')
  const h2 = document.querySelector<HTMLElement>('h2')
  const headingConfirm = h2 && containsConfirmationPhrase(h2.textContent ?? '')
  if (inApplyFlow && headingConfirm) return buildResult(hostname)

  // --- Signal 3: Full-page text scan ---
  const bodyText = document.body?.innerText ?? ''
  if (containsConfirmationPhrase(bodyText)) return buildResult(hostname)

  return null
}

function buildResult(hostname: string): DetectedApplication {
  // Extract company slug from subdomain: "acme.myworkdayjobs.com" → "acme"
  const subdomain = hostname.split('.')[0]
  const company = subdomain ? subdomain.replace(/-/g, ' ') : 'Unknown Company'

  // Job title via Workday automation ID, then generic fallback
  const titleEl =
    document.querySelector<HTMLElement>('[data-automation-id="Job_Posting_Title"]') ??
    document.querySelector<HTMLElement>('h1')
  const jobTitle = titleEl?.textContent?.trim() ?? 'Unknown Position'

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'workday',
    detectedAt: new Date().toISOString(),
  }
}
