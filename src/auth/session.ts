import type { LoginResponse } from '../api/types.ts'

const storageKey = 'tropelcare.session'

export type StoredSession = LoginResponse

export function readStoredSession(): StoredSession | null {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return null
  }
  try {
    const value = JSON.parse(raw) as Partial<StoredSession>
    if (typeof value.token !== 'string' || typeof value.expiresAt !== 'string' || !value.user) {
      clearStoredSession()
      return null
    }
    return value as StoredSession
  } catch {
    clearStoredSession()
    return null
  }
}

export function writeStoredSession(session: StoredSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(storageKey)
}
