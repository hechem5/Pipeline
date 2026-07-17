// ---------------------------------------------------------------------------
// LinkedIn Easy Apply — Confirmation detector
// ---------------------------------------------------------------------------
// Matches: linkedin.com (all sub-paths)
//
// Detection strategy:
//   1. Direct check for artdeco-modal or artdeco-toast containing confirmation text
//   2. Body text scan as a broader fallback
//   3. URL pattern fallback
//
// Also exports startLinkedInModalObserver() — a zero-debounce MutationObserver
// that watches specifically for the confirmation modal/toast to appear,
// rather than relying on the 750ms debounced general observer.
// ---------------------------------------------------------------------------

import type { DetectedApplication } from '../../shared/types'
import {
  containsConfirmationPhrase,
  extractCompanyFromTitle,
  extractJobTitleFromDOM,
} from '../detector'

const CONFIRMATION_SELECTORS = [
  // artdeco modal (most common in Easy Apply flow)
  '.artdeco-modal',
  // artdeco inline toast/snackbar (newer LinkedIn UI)
  '.artdeco-toast-item',
  '.artdeco-toasts__item',
  // Job application sent overlay
  '.jobs-easy-apply-modal',
  // generic dialog
  '[role="dialog"]',
  '[role="alertdialog"]',
]

/** Checks if any known confirmation container has the confirmation text. */
function checkConfirmationElements(): boolean {
  for (const sel of CONFIRMATION_SELECTORS) {
    const els = document.querySelectorAll(sel)
    for (const el of els) {
      const text = (el.textContent || '').replace(/\s+/g, ' ').toLowerCase()
      if (
        containsConfirmationPhrase(text) ||
        text.includes('your application was sent') ||
        text.includes('application was sent to') ||
        text.includes('you applied to')
      ) {
        console.log('[Pipeline] LinkedIn: confirmation element found:', sel, '→', text.slice(0, 80))
        return true
      }
    }
  }
  return false
}

export function detectLinkedIn(): DetectedApplication | null {
  const { hostname, pathname, search } = window.location
  if (!hostname.includes('linkedin.com')) return null

  // --- Signal 1: Direct confirmation element check (fastest, most reliable) ---
  if (checkConfirmationElements()) {
    return buildResult()
  }

  // --- Signal 2: Body text scan (fallback for non-modal confirmation pages) ---
  const bodyText = document.body?.textContent?.replace(/\s+/g, ' ').toLowerCase() || ''
  if (containsConfirmationPhrase(bodyText) || bodyText.includes('your application was sent')) {
    console.log('[Pipeline] LinkedIn: body text contains confirmation phrase')
    return buildResult()
  }

  // --- Signal 3: URL pattern ---
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

  // Try to extract company from: "Your application was sent to [Company]!"
  let modalCompany = ''
  const modalMatch = bodyText.match(/(?:your application was sent to|you applied to)\s+(.*?)(?:[!.\n]|$)/i)
  if (modalMatch?.[1]) {
    modalCompany = modalMatch[1].trim()
  }

  // Company: prefer modal extraction, then dedicated DOM element, then page title
  const companyEl = document.querySelector(
    '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name',
  )
  const company =
    modalCompany ||
    companyEl?.textContent?.trim() ||
    extractCompanyFromTitle(document.title) ||
    'Unknown Company'

  // Title: prefer dedicated element, fall back to generic helpers
  const titleEl = document.querySelector(
    '.job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title, .jobs-details-top-card__job-title',
  )
  const jobTitle =
    titleEl?.textContent?.trim() ||
    extractJobTitleFromDOM() ||
    document.title.split('|')[0].trim() ||
    'Unknown Position'

  console.log('[Pipeline] LinkedIn buildResult:', { company, jobTitle })

  return {
    company,
    jobTitle,
    jobUrl: window.location.href,
    platform: 'linkedin',
    detectedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// LinkedIn-specific zero-debounce observer
// ---------------------------------------------------------------------------
// This fires IMMEDIATELY when any DOM node is added — no 750ms wait.
// It checks if the newly added node is (or contains) a confirmation element.
// Called from main.ts on LinkedIn pages.
// ---------------------------------------------------------------------------

export function startLinkedInModalObserver(
  onDetected: (result: DetectedApplication) => void,
): void {
  if (!window.location.hostname.includes('linkedin.com')) return

  const mo = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        const el = node as Element

        // Check the newly added element and all its descendants
        const text = (el.textContent || '').replace(/\s+/g, ' ').toLowerCase()
        if (
          containsConfirmationPhrase(text) ||
          text.includes('your application was sent') ||
          text.includes('application was sent to') ||
          text.includes('you applied to')
        ) {
          console.log('[Pipeline] LinkedIn modal observer: caught confirmation immediately!')
          const result = buildResult()
          mo.disconnect()
          onDetected(result)
          return
        }
      }
    }
  })

  mo.observe(document.body, { childList: true, subtree: true })
  console.log('[Pipeline] LinkedIn modal observer started')
}
