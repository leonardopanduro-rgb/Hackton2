import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Gauge, RadioTower } from 'lucide-react'
import { getDashboard, getErrorMessage, isAbortError } from '../api/client.ts'
import type { DashboardSummary } from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge } from '../components/ui.tsx'
import { formatDateTime } from '../utils/options.ts'

export function DashboardPage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    getDashboard(token, controller.signal)
      .then((data) => setSummary(data))
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [token])

  if (loading) {
    return <LoadingBlock label="Cargando dashboard" />
  }

  if (error) {
    return <ErrorBlock message={error} />
  }

  if (!summary) {
    return <ErrorBlock title="Dashboard vacio" message="El backend no devolvio indicadores." />
  }

  const cards = [
    { label: 'Tropeles', value: summary.totalTropels, icon: RadioTower, tone: 'info' as const },
    { label: 'Criticos', value: summary.criticalTropels, icon: AlertTriangle, tone: 'bad' as const },
    { label: 'Senales abiertas', value: summary.openSignals, icon: Activity, tone: 'warn' as const },
    { label: 'Estabilidad media', value: `${summary.sectorStabilityAvg}%`, icon: Gauge, tone: 'good' as const },
  ]

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-600">Generado: {formatDateTime(summary.generatedAt)}</p>
        </div>
        <Badge tone="neutral">Workspace activo</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-stone-600">{card.label}</p>
                <Badge tone={card.tone}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </Badge>
              </div>
              <p className="mt-4 text-3xl font-semibold text-stone-950">{card.value}</p>
            </article>
          )
        })}
      </div>

      <section className="rounded border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Senales por severidad</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {Object.entries(summary.signalsBySeverity).map(([severity, value]) => (
            <div key={severity} className="rounded border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs font-semibold text-stone-500">{severity}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
