import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAbortError, login as loginRequest, me } from '../api/client.ts'
import type { LoginResponse } from '../api/types.ts'
import { clearStoredSession, readStoredSession, writeStoredSession } from './session.ts'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  session: LoginResponse | null
  token: string | null
  login: (teamCode: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [session, setSession] = useState<LoginResponse | null>(() => readStoredSession())

  useEffect(() => {
    const stored = readStoredSession()
    if (!stored) {
      setStatus('anonymous')
      setSession(null)
      return undefined
    }

    const controller = new AbortController()
    setStatus('checking')
    me(stored.token, controller.signal)
      .then((user) => {
        const nextSession = { ...stored, user }
        writeStoredSession(nextSession)
        setSession(nextSession)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return
        }
        clearStoredSession()
        setSession(null)
        setStatus('anonymous')
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (teamCode: string, email: string, password: string) => {
    const response = await loginRequest(teamCode, email, password)
    writeStoredSession(response)
    setSession(response)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      token: session?.token ?? null,
      login,
      logout,
    }),
    [login, logout, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
