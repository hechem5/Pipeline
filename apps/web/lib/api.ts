import type { Application, BaseCv, StructuredCv, JobMatchResult } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { body = await res.text() }
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as Record<string, unknown>).message)
        : `HTTP ${res.status}`
    throw new ApiError(message, res.status, body)
  }

  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export interface ApplicationFilters {
  status?: string
  search?: string
  platform?: string
}

export async function getApplications(token: string, filters?: ApplicationFilters): Promise<Application[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.platform) params.set('platform', filters.platform)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<Application[]>(`/applications${qs}`, {}, token)
}

export async function getApplication(token: string, id: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, {}, token)
}

export async function createApplication(token: string, data: Partial<Application>): Promise<Application> {
  return apiFetch<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }, token)
}

export async function updateApplication(token: string, id: string, data: Partial<Application>): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token)
}

export async function deleteApplication(token: string, id: string): Promise<void> {
  return apiFetch<void>(`/applications/${id}`, { method: 'DELETE' }, token)
}

export async function approveAndSend(token: string, id: string, data?: Record<string, unknown>): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}/approve-send`, { method: 'POST', body: JSON.stringify(data ?? {}) }, token)
}

export async function getCv(token: string): Promise<BaseCv> {
  return apiFetch<BaseCv>('/cv', {}, token)
}

export async function uploadCv(token: string, file: File): Promise<StructuredCv> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<StructuredCv>('/cv', { method: 'POST', body: form, headers: {} }, token)
}

export async function matchJob(token: string, data: { jobUrl: string; jobDescription?: string }): Promise<JobMatchResult> {
  return apiFetch<JobMatchResult>('/match-job', { method: 'POST', body: JSON.stringify(data) }, token)
}

export async function registerUser(data: { email: string; password: string }): Promise<{ id: string; email: string }> {
  return apiFetch<{ id: string; email: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteAccount(token: string): Promise<void> {
  return apiFetch<void>('/users/me', { method: 'DELETE' }, token)
}

export async function updateUserSettings(token: string, settings: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/users/settings', { method: 'PATCH', body: JSON.stringify(settings) }, token)
}
