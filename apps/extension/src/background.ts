// ---------------------------------------------------------------------------
// Pipeline Background Service Worker (MV3)
// ---------------------------------------------------------------------------
// Responsibilities:
//  - Receive messages from content scripts (APPLICATION_DETECTED, JOB_POSTING_DETECTED, etc.)
//  - Persist auth token and API URL in chrome.storage.local
//  - Call the Pipeline API; on failure, queue for retry on next SW activation
// ---------------------------------------------------------------------------

import type {
  MessageToBackground,
  DetectedApplication,
  DetectedJobPosting,
  StoredAuth,
  PendingReview,
  ApplicationSource,
} from './shared/types'

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function storageGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve as () => void))
}

function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve))
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = 'http://localhost:3001'

export async function getApiUrl(): Promise<string> {
  const result = await storageGet<string>('pipeline_api_url')
  return (result['pipeline_api_url'] as string) ?? DEFAULT_API_URL
}

async function getAuth(): Promise<StoredAuth | null> {
  const result = await storageGet<StoredAuth>('pipeline_auth')
  return (result['pipeline_auth'] as StoredAuth) ?? null
}

/**
 * Gets auth, falling back to directly fetching the session from the web app.
 * This handles the case where the auth-bridge postMessage dance never completed
 * (e.g., the web app tab wasn't open when the extension was reloaded).
 */
async function getAuthWithFallback(): Promise<StoredAuth | null> {
  let auth = await getAuth()
  if (auth?.token) return auth

  // Fallback: try to pull the JWT directly from the NextAuth session endpoint.
  // This avoids the fragile postMessage bridge being the single point of failure.
  const webAppUrls = ['http://localhost:3000', 'http://localhost:3002']
  for (const baseUrl of webAppUrls) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/session`, {
        credentials: 'include',
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) continue
      const data = await res.json() as { apiToken?: string }
      if (data?.apiToken) {
        auth = { token: data.apiToken }
        await storageSet({ pipeline_auth: auth })
        console.log('[Pipeline] Auth token recovered from web app session ✅')
        return auth
      }
    } catch {
      // Web app not reachable — skip
    }
  }

  return null
}

async function apiFetch(path: string, body: unknown, token: string): Promise<Response> {
  const apiUrl = await getApiUrl()
  return fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000), // 8-second timeout
  })
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function setBadge(text: string, bgColor: string): void {
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color: bgColor })
}

async function incrementTodayBadge(): Promise<void> {
  const result = await storageGet<{ count: number; date: string }>('pipeline_today_badge')
  const stored = result['pipeline_today_badge'] as { count: number; date: string } | undefined
  const today = new Date().toDateString()

  const newCount = stored?.date === today ? (stored.count ?? 0) + 1 : 1
  await storageSet({ pipeline_today_badge: { count: newCount, date: today } })
  setBadge(String(newCount), '#4ADE80')
}

async function updatePendingReviewBadge(): Promise<void> {
  const result = await storageGet<PendingReview[]>('pending_reviews')
  const reviews = (result['pending_reviews'] as PendingReview[]) ?? []
  if (reviews.length > 0) {
    setBadge(String(reviews.length), '#4ADE80')
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleApplicationDetected(
  payload: DetectedApplication,
  source: ApplicationSource,
): Promise<void> {
  const auth = await getAuthWithFallback()

  console.log('[Pipeline] handleApplicationDetected called:', payload.company, payload.jobTitle)
  console.log('[Pipeline] Auth token present?', auth ? 'YES (token length=' + auth.token.length + ')' : 'NO — NOT LOGGED IN')

  if (!auth) {
    // User not logged in — queue locally and alert with badge
    const result = await storageGet<DetectedApplication[]>('pipeline_pending_offline')
    const pending = (result['pipeline_pending_offline'] as DetectedApplication[]) ?? []
    pending.push(payload)
    await storageSet({ pipeline_pending_offline: pending })
    setBadge('!', '#F87171')
    console.log('[Pipeline] No auth token. Detection queued for when user logs in.')
    return
  }

  try {
    const apiUrl = await getApiUrl()
    console.log('[Pipeline] Posting to API:', apiUrl + '/applications')
    const res = await apiFetch('/applications', { ...payload, source }, auth.token)
    console.log('[Pipeline] API response status:', res.status)
    if (!res.ok) {
      const body = await res.text()
      console.error('[Pipeline] API error body:', body)
      throw new Error(`API error ${res.status}: ${body}`)
    }
    await incrementTodayBadge()
    console.log('[Pipeline] ✅ Application logged:', payload.company, payload.jobTitle)
  } catch (err) {
    // Network failure — store for retry on next SW activation
    const result = await storageGet<DetectedApplication[]>('pipeline_retry_queue')
    const queue = (result['pipeline_retry_queue'] as DetectedApplication[]) ?? []
    queue.push(payload)
    await storageSet({ pipeline_retry_queue: queue })
    console.warn('[Pipeline] API unreachable. Queued for retry:', err)
  }
}

async function handleJobPostingDetected(payload: DetectedJobPosting): Promise<void> {
  const auth = await getAuth()
  if (!auth) return // Silently ignore when not logged in

  try {
    const res = await apiFetch('/jobs/match', payload, auth.token)
    if (!res.ok) return

    const data = (await res.json()) as { match: boolean; applicationId: string; fitScore: number }
    if (!data.match) return

    // Store in pending_reviews for the popup to display
    const result = await storageGet<PendingReview[]>('pending_reviews')
    const reviews = (result['pending_reviews'] as PendingReview[]) ?? []
    reviews.push({
      applicationId: data.applicationId,
      company: payload.company,
      jobTitle: payload.jobTitle,
      fitScore: data.fitScore ?? 0,
      createdAt: new Date().toISOString(),
    })
    await storageSet({ pending_reviews: reviews })
    await updatePendingReviewBadge()
    console.log('[Pipeline] Job match found:', payload.company, payload.jobTitle)
  } catch (err) {
    console.warn('[Pipeline] Job match API unreachable:', err)
  }
}

async function retryOfflineQueue(): Promise<void> {
  const auth = await getAuth()
  if (!auth) return

  const result = await storageGet<DetectedApplication[]>('pipeline_retry_queue')
  const queue = (result['pipeline_retry_queue'] as DetectedApplication[]) ?? []
  if (queue.length === 0) return

  console.log('[Pipeline] Retrying', queue.length, 'queued detections...')
  const failed: DetectedApplication[] = []

  for (const item of queue) {
    try {
      const res = await apiFetch('/applications', { ...item, source: 'AUTO_DETECTED' }, auth.token)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      await incrementTodayBadge()
    } catch {
      failed.push(item)
    }
  }

  await storageSet({ pipeline_retry_queue: failed })
}

async function retryPendingOfflineQueue(): Promise<void> {
  const auth = await getAuth()
  if (!auth) return

  const result = await storageGet<DetectedApplication[]>('pipeline_pending_offline')
  const queue = (result['pipeline_pending_offline'] as DetectedApplication[]) ?? []
  if (queue.length === 0) return

  console.log('[Pipeline] Retrying', queue.length, 'unauthenticated queued detections...')
  
  // Clear it immediately, handleApplicationDetected will re-queue to retry_queue if API is down
  await storageSet({ pipeline_pending_offline: [] })
  setBadge('', '#000000') // clear the red '!' badge

  for (const item of queue) {
    await handleApplicationDetected(item, 'AUTO_DETECTED')
  }
}

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: MessageToBackground, _sender, sendResponse) => {
    const { type, payload } = message

    if (type === 'APPLICATION_DETECTED') {
      handleApplicationDetected(payload as DetectedApplication, 'AUTO_DETECTED').then(() =>
        sendResponse({ ok: true }),
      )
      return true // keep channel open for async response
    }

    if (type === 'LOG_MANUAL') {
      handleApplicationDetected(payload as DetectedApplication, 'MANUAL').then(() =>
        sendResponse({ ok: true }),
      )
      return true
    }

    if (type === 'JOB_POSTING_DETECTED') {
      handleJobPostingDetected(payload as DetectedJobPosting).then(() =>
        sendResponse({ ok: true }),
      )
      return true
    }

    if (type === 'GET_AUTH_TOKEN') {
      getAuth().then((auth) => sendResponse({ token: auth?.token ?? null }))
      return true
    }

    if (type === 'SYNC_AUTH') {
      const { token } = payload as { token: string | null }
      console.log('[Pipeline] SYNC_AUTH received. Token present?', token ? 'YES (length=' + token.length + ')' : 'NO (null/logout)')
      if (token) {
        storageSet({ pipeline_auth: { token } }).then(async () => {
          console.log('[Pipeline] Auth token saved to storage ✅')
          // Now that we have auth, retry both queues
          await retryPendingOfflineQueue()
          await retryOfflineQueue()
          sendResponse({ ok: true })
        })
      } else {
        chrome.storage.local.remove('pipeline_auth').then(() => sendResponse({ ok: true }))
      }
      return true
    }

    return false
  },
)

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await storageSet({ pipeline_api_url: DEFAULT_API_URL })
    console.log('[Pipeline] Extension installed. Default API URL set.')
  }
  // Retry any queued detections from a previous session
  await retryOfflineQueue()
})

// Retry queued items each time the SW wakes up (e.g., browser start)
chrome.runtime.onStartup.addListener(async () => {
  await retryOfflineQueue()
})
