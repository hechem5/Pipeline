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
//   6. On LinkedIn: also run a zero-debounce modal observer
// ---------------------------------------------------------------------------

import type { MessageToBackground, DetectedApplication } from '../shared/types'
import { getPlatformFromHostname } from './detector'
import { detectLinkedIn, startLinkedInModalObserver } from './platforms/linkedin'
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
    __pipeline_li_observer_started?: boolean
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
// Send detected application to background
// ---------------------------------------------------------------------------

function sendDetected(detected: DetectedApplication): void {
  const url = window.location.href
  if (hasDetectedUrl(url)) return
  markDetected(url)

  const platform = getPlatformFromHostname(window.location.hostname)
  const message: MessageToBackground = {
    type: 'APPLICATION_DETECTED',
    payload: detected,
  }
  chrome.runtime.sendMessage(message, () => { void chrome.runtime.lastError })
  console.log('[Pipeline] ✅ Application confirmed:', detected.company, '—', detected.jobTitle, `(${platform})`)
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
  const detected =
    detectLinkedIn() ??
    detectGreenhouse() ??
    detectLever() ??
    detectWorkday() ??
    detectICIMS() ??
    detectIndeed() ??
    detectGeneric()

  if (detected) {
    sendDetected(detected)
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
// LinkedIn: zero-debounce modal observer
// ---------------------------------------------------------------------------
// The general 750ms debounce is too slow to reliably catch LinkedIn's
// confirmation modal (it appears and may be dismissed in under 750ms).
// This dedicated observer fires IMMEDIATELY on every DOM insertion,
// checks if the new node contains confirmation text, and fires if so.
// ---------------------------------------------------------------------------

if (window.location.hostname.includes('linkedin.com') && !window.__pipeline_li_observer_started) {
  window.__pipeline_li_observer_started = true
  startLinkedInModalObserver((result) => {
    sendDetected(result)
  })
}

// ---------------------------------------------------------------------------
// Initial run
// ---------------------------------------------------------------------------

runDetection()
