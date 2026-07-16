// ---------------------------------------------------------------------------
// Pipeline main content script
// ---------------------------------------------------------------------------
// Runs on every page matched in manifest.json.
// Responsibilities:
//   1. Detect which platform we're on
//   2. Run the platform-specific confirmation detector + generic fallback
//   3. Run the job posting detector
//   4. Send detected data to the background service worker
//   5. Watch for SPA navigation via MutationObserver + popstate
// ---------------------------------------------------------------------------

import type { MessageToBackground } from '../shared/types'
import { getPlatformFromHostname } from './detector'
import { detectLinkedIn } from './platforms/linkedin'
import { detectGreenhouse } from './platforms/greenhouse'
import { detectLever } from './platforms/lever'
import { detectWorkday } from './platforms/workday'
import { detectICIMS } from './platforms/icims'
import { detectIndeed } from './platforms/indeed'
import { detectGeneric } from './platforms/generic'
import { runJobPostingDetector } from './job-posting-detector'
import { autofillForm } from './autofill'

// ---------------------------------------------------------------------------
// SPA guard — avoid firing multiple times for the same URL
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __pipeline_detected?: Set<string>
  }
}

if (!window.__pipeline_detected) {
  window.__pipeline_detected = new Set<string>()
}

function hasDetectedUrl(url: string): boolean {
  return window.__pipeline_detected!.has(url)
}

function markDetected(url: string): void {
  window.__pipeline_detected!.add(url)
}

// ---------------------------------------------------------------------------
// Core detection logic
// ---------------------------------------------------------------------------

function runDetection(): void {
  const url = window.location.href
  if (hasDetectedUrl(url)) return

  const hostname = window.location.hostname
  const platform = getPlatformFromHostname(hostname)

  // Run the appropriate platform detector, then generic as fallback
  let detected =
    detectLinkedIn() ??
    detectGreenhouse() ??
    detectLever() ??
    detectWorkday() ??
    detectICIMS() ??
    detectIndeed() ??
    detectGeneric()

  if (detected) {
    markDetected(url)
    const message: MessageToBackground = {
      type: 'APPLICATION_DETECTED',
      payload: detected,
    }
    chrome.runtime.sendMessage(message, () => {
      // Ignore errors — background may not be ready on very first install
      void chrome.runtime.lastError
    })
    console.log(
      '[Pipeline] Application confirmed:',
      detected.company,
      '—',
      detected.jobTitle,
      `(${platform})`,
    )
    return
  }

  // Always run the job posting detector (for Feature 2)
  // (It has its own internal dedup via sessionStorage)
  runJobPostingDetector()
}

// ---------------------------------------------------------------------------
// Autofill message listener (triggered from web app "Approve & Send")
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AUTOFILL_REQUEST') {
    const { platform, coverLetter } = message.payload as {
      platform: string
      coverLetter: string
    }
    autofillForm(platform as Parameters<typeof autofillForm>[0], coverLetter)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true // keep message channel open
  }
  return false
})

// Listen for auth sync events from the web app
window.addEventListener('PIPELINE_AUTH_SYNC', (e: Event) => {
  const detail = (e as CustomEvent).detail
  if (detail && typeof detail.token !== 'undefined') {
    chrome.runtime.sendMessage({ type: 'SYNC_AUTH', payload: { token: detail.token } }, () => {
      void chrome.runtime.lastError
    })
  }
})

// Request auth state in case we loaded after the page rendered
window.dispatchEvent(new CustomEvent('PIPELINE_AUTH_REQUEST'))

// ---------------------------------------------------------------------------
// Debounce helper for MutationObserver
// ---------------------------------------------------------------------------

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout>
  return () => {
    clearTimeout(timer)
    timer = setTimeout(fn, ms)
  }
}

// ---------------------------------------------------------------------------
// SPA navigation watcher
// ---------------------------------------------------------------------------

const debouncedDetect = debounce(runDetection, 750)

// Watch DOM mutations (React/Vue/Angular SPA route changes)
const observer = new MutationObserver(debouncedDetect)
observer.observe(document.body, { childList: true, subtree: true })

// Also listen for history API navigation
window.addEventListener('popstate', debouncedDetect)

// Patch pushState/replaceState to catch programmatic navigation
const originalPushState = history.pushState.bind(history)
const originalReplaceState = history.replaceState.bind(history)

history.pushState = function (...args) {
  originalPushState(...args)
  debouncedDetect()
}
history.replaceState = function (...args) {
  originalReplaceState(...args)
  debouncedDetect()
}

// ---------------------------------------------------------------------------
// Initial run
// ---------------------------------------------------------------------------

runDetection()
