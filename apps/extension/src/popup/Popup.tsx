// ---------------------------------------------------------------------------
// Pipeline Popup — main React component
// NOTE: This file runs in the popup page context.
//       Do NOT use document.querySelector for content-script tasks here.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react'
import type { ApplicationRecord, PendingReview, StoredAuth } from '../shared/types'

// ---------------------------------------------------------------------------
// Design tokens (mirrored from the web app)
// ---------------------------------------------------------------------------
const C = {
  bgBase: '#0C0E12',
  bgSurface: '#13161C',
  bgRaised: '#1B1F28',
  border: '#252A36',
  brand: '#4ADE80',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  statusApplied: '#FCD34D',
  statusInterview: '#38BDF8',
  statusOffer: '#4ADE80',
  statusRejected: '#F87171',
  statusGhosted: '#6B7280',
} as const

// ---------------------------------------------------------------------------
// Chrome storage helpers (promisified)
// ---------------------------------------------------------------------------
function storageGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve as () => void))
}

function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve))
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
function statusColor(status: string): string {
  switch (status) {
    case 'APPLIED': return C.statusApplied
    case 'INTERVIEW_SCHEDULED': return C.statusInterview
    case 'OFFER': return C.statusOffer
    case 'REJECTED': return C.statusRejected
    case 'GHOSTED': return C.statusGhosted
    default: return C.textSec
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'APPLIED': return 'Applied'
    case 'INTERVIEW_SCHEDULED': return 'Interview'
    case 'OFFER': return 'Offer'
    case 'REJECTED': return 'Rejected'
    case 'GHOSTED': return 'Ghosted'
    default: return status
  }
}

function fitScoreColor(score: number): string {
  if (score >= 80) return C.brand
  if (score >= 60) return C.statusApplied
  return C.statusRejected
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch {
    return '—'
  }
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: 360,
    minHeight: 480,
    background: C.bgBase,
    color: C.textPri,
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${C.border}`,
    background: C.bgSurface,
  },
  wordmark: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    fontSize: 16,
    color: C.textPri,
    letterSpacing: '-0.02em',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: C.brand,
    flexShrink: 0,
    boxShadow: `0 0 6px ${C.brand}`,
  },
  settingsBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: C.textSec,
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    background: C.bgSurface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '12px 14px',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: C.textSec,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    background: C.brand,
    color: '#0C0E12',
    borderRadius: 20,
    padding: '1px 6px',
    lineHeight: 1.6,
  },
  emptyState: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center' as const,
    padding: '8px 0',
  },
  reviewRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${C.border}`,
    cursor: 'pointer',
    transition: 'background 0.1s',
    borderRadius: 4,
    gap: 8,
  },
  reviewRowLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    overflow: 'hidden',
  },
  reviewCompany: {
    fontSize: 13,
    fontWeight: 500,
    color: C.textPri,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reviewTitle: {
    fontSize: 11,
    color: C.textSec,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fitScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
  },
  appRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 0',
    borderBottom: `1px solid ${C.border}`,
    gap: 8,
  },
  appRowLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    overflow: 'hidden',
    flex: 1,
  },
  appCompany: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  appTitle: {
    fontSize: 11,
    color: C.textSec,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  appRowRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  statusDot: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.03em',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  appDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: C.textSec,
  },
  viewAll: {
    fontSize: 11,
    color: C.brand,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 'auto',
    marginTop: 8,
    display: 'block',
    textAlign: 'right' as const,
  },
  primaryBtn: {
    background: C.brand,
    color: '#0C0E12',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  secondaryBtn: {
    background: C.bgRaised,
    color: C.textPri,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '9px 16px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.15s',
  },
  input: {
    background: C.bgRaised,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '8px 10px',
    color: C.textPri,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    width: '100%',
    outline: 'none',
  },
  label: {
    fontSize: 11,
    color: C.textSec,
    marginBottom: 4,
    display: 'block',
  },
  footer: {
    padding: '10px 16px',
    textAlign: 'center' as const,
    fontSize: 11,
    color: C.textSec,
    borderTop: `1px solid ${C.border}`,
    marginTop: 'auto',
  },
  footerLink: {
    color: C.textSec,
    textDecoration: 'none',
  },
  authCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  authMsg: {
    fontSize: 14,
    color: C.textSec,
    lineHeight: 1.5,
  },
  apiSection: {
    width: '100%',
    textAlign: 'left' as const,
    marginTop: 8,
  },
}

// ---------------------------------------------------------------------------
// Manual log form
// ---------------------------------------------------------------------------
interface ManualLogFormProps {
  apiUrl: string
  auth: StoredAuth
  onLogged: () => void
}

function ManualLogForm({ apiUrl, auth, onLogged }: ManualLogFormProps) {
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Pre-fill from current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab?.url) setUrl(tab.url)
      if (tab?.title) {
        // Rough heuristic: "Job Title at Company | LinkedIn"
        const match = tab.title.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|–-]|$)/i)
        if (match) {
          setJobTitle(match[1].trim())
          setCompany(match[2].trim())
        }
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !jobTitle.trim()) return
    setSaving(true)
    try {
      await fetch(`${apiUrl}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          jobUrl: url,
          platform: 'generic',
          source: 'MANUAL',
          detectedAt: new Date().toISOString(),
        }),
      })
      onLogged()
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <label style={s.label}>Company</label>
        <input
          id="manual-company"
          style={s.input}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Corp"
          required
        />
      </div>
      <div>
        <label style={s.label}>Job Title</label>
        <input
          id="manual-jobtitle"
          style={s.input}
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Software Engineer"
          required
        />
      </div>
      <div>
        <label style={s.label}>URL</label>
        <input
          id="manual-url"
          style={s.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          id="manual-log-submit"
          type="submit"
          style={{ ...s.primaryBtn, flex: 1 }}
          disabled={saving}
        >
          {saving ? 'Logging…' : 'Log Application'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main Popup component
// ---------------------------------------------------------------------------

export function Popup() {
  const [auth, setAuth] = useState<StoredAuth | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [apiUrl, setApiUrl] = useState('http://localhost:3001')
  const [apiUrlInput, setApiUrlInput] = useState('http://localhost:3001')
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [recentApps, setRecentApps] = useState<ApplicationRecord[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)
  const [dashUrl] = useState('http://localhost:3000')

  // Load auth + stored data from chrome.storage
  useEffect(() => {
    async function checkAuth() {
      const result = await chrome.storage.local.get(['pipeline_auth', 'pipeline_api_url', 'pending_reviews'])
      let storedAuth = result['pipeline_auth'] as StoredAuth | undefined
      
      if (!storedAuth?.token) {
        try {
          const res = await fetch('http://localhost:3000/api/auth/session', { credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            if (data && data.apiToken) {
              storedAuth = { token: data.apiToken }
              await chrome.storage.local.set({ pipeline_auth: storedAuth })
            }
          }
        } catch (e) {
          console.warn('[Pipeline] Could not actively fetch session from web app:', e)
        }
      }

      const storedApiUrl = result['pipeline_api_url'] as string | undefined
      const storedReviews = result['pending_reviews'] as PendingReview[] | undefined

      if (storedApiUrl) {
        setApiUrl(storedApiUrl)
        setApiUrlInput(storedApiUrl)
      }
      if (storedReviews?.length) setPendingReviews(storedReviews)
      if (storedAuth) setAuth(storedAuth)
      setAuthLoading(false)
    }
    checkAuth()
  }, [])

  // Fetch recent applications from the API when logged in
  const fetchRecentApps = useCallback(async () => {
    if (!auth) return
    setAppsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/applications?limit=5&sort=appliedAt:desc`, {
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error('API error')
      const data = (await res.json()) as ApplicationRecord[]
      setRecentApps(data)
    } catch {
      // Show empty state on failure
    } finally {
      setAppsLoading(false)
    }
  }, [auth, apiUrl])

  useEffect(() => {
    if (auth) fetchRecentApps()
  }, [auth, fetchRecentApps])

  async function saveApiUrl() {
    await storageSet({ pipeline_api_url: apiUrlInput })
    setApiUrl(apiUrlInput)
  }

  function openDashboard(path = '') {
    chrome.tabs.create({ url: `${dashUrl}${path}` })
  }

  function handleLogged() {
    setShowManualForm(false)
    setLogSuccess(true)
    setTimeout(() => setLogSuccess(false), 3000)
    fetchRecentApps()
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderHeader() {
    return (
      <header style={s.header}>
        <div style={s.wordmark}>
          <span style={s.greenDot} />
          Pipeline
        </div>
        {auth && (
          <button
            id="settings-btn"
            style={s.settingsBtn}
            title="Open dashboard"
            onClick={() => openDashboard()}
          >
            {/* Simple gear SVG icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </header>
    )
  }

  function renderNotLoggedIn() {
    return (
      <div style={s.authCard}>
        {/* Logo mark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.bgRaised, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={s.greenDot} />
          </div>
          <p style={{ ...s.authMsg, fontWeight: 600, color: C.textPri, fontSize: 15 }}>
            Welcome to Pipeline
          </p>
        </div>
        <p style={s.authMsg}>
          Sign in to automatically track your job applications across the web.
        </p>
        <button
          id="sign-in-btn"
          style={s.primaryBtn}
          onClick={() => chrome.tabs.create({ url: `${dashUrl}/login` })}
        >
          Sign in to Pipeline
        </button>

        {/* API URL config (Local Dev Only) */}
        {import.meta.env.DEV && (
          <div style={{ ...s.apiSection }}>
            <label htmlFor="api-url-input" style={s.label}>API URL (Local Dev)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="api-url-input"
                style={{ ...s.input, flex: 1 }}
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="http://localhost:3001"
              />
              <button
                id="save-api-url-btn"
                style={{ ...s.secondaryBtn, width: 'auto', padding: '8px 12px', fontSize: 12 }}
                type="button"
                onClick={saveApiUrl}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderPendingReviews() {
    return (
      <section style={s.card}>
        <div style={s.sectionHead}>
          <span style={s.sectionTitle}>Ready to Review</span>
          {pendingReviews.length > 0 && (
            <span style={s.badge}>{pendingReviews.length}</span>
          )}
        </div>
        {pendingReviews.length === 0 ? (
          <p style={s.emptyState}>No pending reviews</p>
        ) : (
          <div>
            {pendingReviews.map((r, i) => (
              <div
                key={r.applicationId}
                id={`review-row-${r.applicationId}`}
                style={{
                  ...s.reviewRow,
                  borderBottom: i < pendingReviews.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
                onClick={() => openDashboard(`/review/${r.applicationId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openDashboard(`/review/${r.applicationId}`)}
              >
                <div style={s.reviewRowLeft}>
                  <span style={s.reviewCompany}>{r.company}</span>
                  <span style={s.reviewTitle}>{r.jobTitle}</span>
                </div>
                <span style={{ ...s.fitScore, color: fitScoreColor(r.fitScore) }}>
                  {r.fitScore}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    )
  }

  function renderRecentApps() {
    return (
      <section style={s.card}>
        <div style={s.sectionHead}>
          <span style={s.sectionTitle}>Recent</span>
        </div>
        {appsLoading ? (
          <p style={s.emptyState}>Loading…</p>
        ) : recentApps.length === 0 ? (
          <p style={s.emptyState}>No applications yet</p>
        ) : (
          <>
            <div>
              {recentApps.map((app, i) => (
                <div
                  key={app.id}
                  style={{
                    ...s.appRow,
                    borderBottom: i < recentApps.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div style={s.appRowLeft}>
                    <span style={s.appCompany}>{app.company}</span>
                    <span style={s.appTitle}>{app.jobTitle}</span>
                  </div>
                  <div style={s.appRowRight}>
                    <span style={{ ...s.statusDot, color: statusColor(app.status) }}>
                      <span style={{ ...s.dot, background: statusColor(app.status) }} />
                      {statusLabel(app.status)}
                    </span>
                    <span style={s.appDate}>{formatDate(app.appliedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              id="view-all-btn"
              style={s.viewAll}
              onClick={() => openDashboard('/applications')}
            >
              View all →
            </button>
          </>
        )}
      </section>
    )
  }

  function renderQuickActions() {
    return (
      <section style={s.card}>
        <div style={s.sectionHead}>
          <span style={s.sectionTitle}>Quick Actions</span>
        </div>
        {logSuccess && (
          <p style={{ fontSize: 12, color: C.brand, marginBottom: 10, textAlign: 'center' }}>
            ✓ Application logged!
          </p>
        )}
        {showManualForm && auth ? (
          <ManualLogForm
            apiUrl={apiUrl}
            auth={auth}
            onLogged={handleLogged}
          />
        ) : (
          <button
            id="log-app-btn"
            style={s.primaryBtn}
            onClick={() => setShowManualForm(true)}
          >
            + Log this application
          </button>
        )}
      </section>
    )
  }

  function renderFooter() {
    return (
      <footer style={s.footer}>
        Powered by{' '}
        <a
          href={dashUrl}
          style={s.footerLink}
          onClick={(e) => {
            e.preventDefault()
            openDashboard()
          }}
        >
          Pipeline
        </a>
      </footer>
    )
  }

  // -------------------------------------------------------------------------
  // Root render
  // -------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div style={s.root}>
        {renderHeader()}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.textSec, fontSize: 13 }}>Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {renderHeader()}

      {!auth ? (
        renderNotLoggedIn()
      ) : (
        <div style={s.body}>
          {renderPendingReviews()}
          {renderRecentApps()}
          {renderQuickActions()}
        </div>
      )}

      {renderFooter()}
    </div>
  )
}
