import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
  getErrorMessage,
  getSignal,
  isAbortError,
  patchSignalStatus,
} from '../api/client.ts'
import { patchableSignalStatusOptions, type PatchableSignalStatus, type SignalDto } from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge, Button } from '../components/ui.tsx'
import { rememberSignalUpdate } from '../signals/feedMemory.ts'
import { formatDateTime, severityTone, statusTone } from '../utils/options.ts'

interface LocationState {
  from?: string
}

export function SignalDetailPage() {
  const { token } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const [signal, setSignal] = useState<SignalDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PatchableSignalStatus | null>(null)

  useEffect(() => {
    if (!token || !id) {
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    getSignal(token, id, controller.signal)
      .then((response) => setSignal(response))
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [id, token])

  function goBack(): void {
    navigate(locationState?.from ?? '/signals')
  }

  async function updateStatus(status: PatchableSignalStatus): Promise<void> {
    if (!token || !id || pendingStatus) {
      return
    }
    setPendingStatus(status)
    setActionError(null)
    setSuccess(null)
    try {
      const updated = await patchSignalStatus(token, id, status)
      setSignal(updated)
      rememberSignalUpdate(updated)
      setSuccess(`Estado actualizado a ${updated.status}.`)
    } catch (requestError: unknown) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setPendingStatus(null)
    }
  }

  if (loading) {
    return <LoadingBlock label="Cargando detalle" />
  }

  if (error || !signal) {
    return (
      <ErrorBlock
        message={error ?? 'No se encontro la senal solicitada.'}
        action={<Button variant="secondary" onClick={goBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver</Button>}
      />
    )
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al feed
        </Button>
        <div className="flex gap-2">
          <Badge tone={severityTone(signal.severity)}>{signal.severity}</Badge>
          <Badge tone={statusTone(signal.status)}>{signal.status}</Badge>
        </div>
      </div>

      <article className="rounded border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-800">{signal.signalType}</p>
            <h1 className="mt-2 text-2xl font-semibold">{signal.tropel.name}</h1>
            <p className="mt-1 text-sm text-stone-600">{signal.tropel.species} · {signal.id}</p>
          </div>
          <p className="text-sm text-stone-600">Creada: {formatDateTime(signal.createdAt)}</p>
        </div>

        <p className="mt-6 rounded border border-stone-200 bg-stone-50 p-4 text-stone-800">{signal.rawContent}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {patchableSignalStatusOptions.map((status) => (
            <Button
              key={status}
              type="button"
              variant={status === 'ATENDIDA' ? 'primary' : 'secondary'}
              disabled={pendingStatus !== null || signal.status === status}
              onClick={() => void updateStatus(status)}
            >
              {pendingStatus === status ? 'Actualizando...' : status}
            </Button>
          ))}
        </div>

        {success ? (
          <p className="mt-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {success}
          </p>
        ) : null}
        {actionError ? <div className="mt-4"><ErrorBlock message={actionError} /></div> : null}
      </article>
    </section>
  )
}
