import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPinned } from 'lucide-react'
import { getErrorMessage, getSectors, isAbortError } from '../api/client.ts'
import type { SectorLite } from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge, Button } from '../components/ui.tsx'

export function SectorsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [sectors, setSectors] = useState<SectorLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    getSectors(token, controller.signal)
      .then((response) => setSectors(response.items))
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [token])

  function openStory(id: string): void {
    const go = () => navigate(`/sectors/${id}/story`)
    if (document.startViewTransition) {
      document.startViewTransition(go)
      return
    }
    go()
  }

  if (loading) {
    return <LoadingBlock label="Cargando sectores" />
  }

  if (error) {
    return <ErrorBlock message={error} />
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Sectores</h1>
        <p className="mt-1 text-sm text-stone-600">Cada historia usa las 8 etapas entregadas por el backend.</p>
      </div>
      {sectors.length === 0 ? (
        <EmptyBlock title="Sin sectores" message="El workspace no devolvio sectores disponibles." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sectors.map((sector) => (
            <article key={sector.id} className="story-card rounded border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="info">{sector.sectorCode}</Badge>
                  <h2 className="mt-3 text-lg font-semibold">{sector.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">{sector.climate}</p>
                </div>
                <MapPinned className="h-5 w-5 text-teal-700" aria-hidden="true" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Carga" value={`${sector.currentLoad}/${sector.capacity}`} />
                <Metric label="Estabilidad" value={`${sector.stabilityLevel}%`} />
                <Metric label="Clima" value={sector.climate.replace('_', ' ')} />
              </div>
              <Button className="mt-4 w-full" type="button" onClick={() => openStory(sector.id)}>
                Abrir historia
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-stone-50 p-2">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-stone-900">{value}</p>
    </div>
  )
}
