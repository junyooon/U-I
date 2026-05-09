import { useAuthStore } from '../store/auth'

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string }
    useAuthStore.getState().setToken(data.access_token)
    return data.access_token
  } catch {
    return null
  }
}

export async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    const newToken = await refreshToken()
    if (!newToken) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    // Retry with new token
    const retry = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options?.headers,
      },
    })
    if (!retry.ok) throw new Error(`${retry.status}`)
    return retry.json() as Promise<T>
  }

  if (!res.ok) throw new Error(`${res.status}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: { message?: string } }).error?.message ?? `${res.status}`)
  }
  return res.json() as Promise<T>
}
