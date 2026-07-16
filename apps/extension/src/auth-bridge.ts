// ---------------------------------------------------------------------------
// Pipeline Auth Bridge Script
// ---------------------------------------------------------------------------
// Injected only into Pipeline's own web app domain to capture auth tokens.

// Listen for auth sync events from the web app
window.addEventListener('message', (e) => {
  // Only accept messages from the same frame
  if (e.source !== window || !e.data) return

  // Listen for login/logout broadcasts from the web app
  if (e.data.type === 'PIPELINE_AUTH_SUCCESS' && typeof e.data.token !== 'undefined') {
    chrome.runtime.sendMessage({ type: 'SYNC_AUTH', payload: { token: e.data.token } }, () => {
      // Ignore errors if background is asleep
      void chrome.runtime.lastError
    })
  }
})

// Request auth state on load in case the web app already broadcasted it before this script ran
window.postMessage({ type: 'PIPELINE_AUTH_REQUEST' }, window.location.origin)
