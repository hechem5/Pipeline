// ---------------------------------------------------------------------------
// Autofill helper — Feature 2 (AI-tailored apply)
// ---------------------------------------------------------------------------
//
// AUTOFILL CONTRACT — READ BEFORE MODIFYING:
//
// This function fills job application form fields with tailored content.
// It MUST stop after filling fields. It MUST NOT:
//   - Call .click() on the platform's submit button
//   - Call .submit() on any form
//   - Dispatch a 'submit' or 'click' event on any form or button
//
// The user must physically click the submit button themselves.
// This is intentional — it is both an ethical and ToS safeguard.
//
// ---------------------------------------------------------------------------

import type { PlatformName } from '../shared/types'

/**
 * Fires synthetic 'input' and 'change' events on a field so that the
 * framework (React/Vue/Angular) registers the programmatic fill.
 *
 * This does NOT dispatch 'submit' or 'click' events.
 */
function dispatchFillEvents(field: HTMLInputElement | HTMLTextAreaElement): void {
  field.dispatchEvent(new Event('input', { bubbles: true }))
  field.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Sets the value of a field and notifies the framework.
 * Works for both plain DOM inputs and React-controlled inputs.
 */
function setFieldValue(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  // Use the React internal setter to bypass controlled-component overrides
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value',
  )?.set

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(field, value)
  } else {
    field.value = value
  }

  dispatchFillEvents(field)
}

/**
 * Finds a cover-letter-like textarea among all textareas on the page.
 * A textarea is considered a cover letter field if its associated label
 * (aria-label, placeholder, or nearby <label>) contains:
 * "cover", "letter", "message", "note", or "comments".
 */
function findCoverLetterTextarea(): HTMLTextAreaElement | null {
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea'))
  if (textareas.length === 0) return null

  const keywords = ['cover', 'letter', 'message', 'note', 'comments', 'additional']

  for (const ta of textareas) {
    const hints = [
      ta.placeholder,
      ta.getAttribute('aria-label'),
      ta.getAttribute('name'),
      ta.getAttribute('id'),
      // Look for a <label> pointing to this textarea
      ta.id
        ? document.querySelector<HTMLLabelElement>(`label[for="${ta.id}"]`)?.textContent ?? ''
        : '',
    ]
      .join(' ')
      .toLowerCase()

    if (keywords.some((kw) => hints.includes(kw))) return ta
  }

  // If exactly one textarea exists, treat it as the cover letter field
  if (textareas.length === 1) return textareas[0]

  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fills the cover letter (and any other supported fields) on the active job
 * application form.
 *
 * AUTOFILL CONTRACT: this function fills fields and then STOPS.
 * It does NOT submit the form or click any buttons.
 */
export async function autofillForm(
  platform: PlatformName,
  coverLetter: string,
): Promise<void> {
  let filled = false

  if (platform === 'linkedin') {
    // LinkedIn Easy Apply cover letter textarea inside the apply modal
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '.jobs-easy-apply-content textarea',
    )
    if (textarea) {
      setFieldValue(textarea, coverLetter)
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      filled = true
    }
  }

  if (platform === 'greenhouse') {
    // Greenhouse standard cover_letter field
    const textarea = document.querySelector<HTMLTextAreaElement>('#cover_letter')
    if (textarea) {
      setFieldValue(textarea, coverLetter)
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      filled = true
    }
  }

  if (platform === 'lever') {
    // Lever uses #comments for the cover letter / additional info field
    const textarea =
      document.querySelector<HTMLTextAreaElement>('#comments') ??
      document.querySelector<HTMLTextAreaElement>('[name="comments"]')
    if (textarea) {
      setFieldValue(textarea, coverLetter)
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      filled = true
    }
  }

  // Generic fallback — try to find a cover-letter-like textarea
  if (!filled) {
    const textarea = findCoverLetterTextarea()
    if (textarea) {
      setFieldValue(textarea, coverLetter)
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      filled = true
    }
  }

  // AUTOFILL STOP POINT
  // Everything above this line is field-filling only.
  // Do NOT add any .click(), .submit(), or event dispatch beyond 'input'/'change'.

  if (filled) {
    console.log(
      "[Pipeline] Form filled. Please click the platform's submit button to send your application.",
    )
  } else {
    console.warn(
      '[Pipeline] Autofill: could not locate a cover letter field on this page.',
    )
  }
}
