import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getErrorMessage } from '../api/client.ts'
import { Button, TextInput } from '../components/ui.tsx'
import { useAuth } from './AuthProvider.tsx'

interface LocationState {
  from?: { pathname?: string; search?: string }
}

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const [teamCode, setTeamCode] = useState(import.meta.env.VITE_TEAM_CODE ?? '')
  const [email, setEmail] = useState(import.meta.env.VITE_EMAIL ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (auth.status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await auth.login(teamCode.trim(), email.trim(), password)
      const from = locationState?.from
      navigate(`${from?.pathname ?? '/dashboard'}${from?.search ?? ''}`, { replace: true })
    } catch (loginError: unknown) {
      setError(getErrorMessage(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1f5ee_0,#fafaf9_34%,#fff7ed_72%)] px-4 py-8 text-stone-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-teal-200 bg-white/70 px-3 py-2 text-sm font-semibold text-teal-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            TropelCare Control Room
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-stone-950 md:text-6xl">
            Consola operativa para senales y sectores Tropel.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            Autenticacion por equipo, datos reales del workspace y rutas protegidas listas para la evaluacion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded border border-stone-200 bg-white p-5 shadow-xl shadow-stone-200/70">
          <h2 className="text-xl font-semibold">Ingreso del equipo</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Team code
              <TextInput value={teamCode} onChange={(event) => setTeamCode(event.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Email
              <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Password
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>
          {error ? <p className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
          <Button className="mt-5 w-full" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Entrar'}
          </Button>
        </form>
      </section>
    </main>
  )
}
