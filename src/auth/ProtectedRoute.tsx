import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.tsx'
import { LoadingBlock } from '../components/StateBlocks.tsx'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'checking') {
    return (
      <main className="min-h-screen bg-stone-50 p-6 text-stone-950">
        <LoadingBlock label="Restaurando sesion" />
      </main>
    )
  }

  if (auth.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
