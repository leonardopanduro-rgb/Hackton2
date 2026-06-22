import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { getErrorMessage, getSignalFeed, isAbortError } from '../api/client.ts'
import {
  severityOptions,
  signalStatusOptions,
  signalTypeOptions,
  type FeedQuery,
  type SignalDto,
} from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge, Button, Select, TextInput } from '../components/ui.tsx'
import { getFeedSnapshot, setFeedSnapshot } from '../signals/feedMemory.ts'
import { formatDateTime, severityTone, statusTone } from '../utils/options.ts'
import { includesOption } from '../utils/options.ts'

interface FeedState {
  items: SignalDto[]
  nextCursor: string | null
  hasMore: boolean
  totalEstimate: number
  loadingInitial: boolean
  loadingMore: boolean
  error: string | null
}

const emptyFeed: FeedState = {
  items: [],
  nextCursor: null,
  hasMore: true,
  totalEstimate: 0,
  loadingInitial: false,
  loadingMore: false,
  error: null,
}

function parseFeedQuery(params: URLSearchParams): FeedQuery {
  const signalType = params.get('signalType') ?? ''
  const severity = params.get('severity') ?? ''
  const status = params.get('status') ?? ''
  return {
    signalType: includesOption(signalTypeOptions, signalType) ? signalType : '',
    severity: includesOption(severityOptions, severity) ? severity : '',
    status: includesOption(signalStatusOptions, status) ? status : '',
    q: (params.get('q') ?? '').slice(0, 80),
  }
}

function setParam(params: URLSearchParams, key: string, value: string): void {
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
}

function dedupeSignals(existing: SignalDto[], incoming: SignalDto[]): SignalDto[] {
  const seen = new Set(existing.map((item) => item.id))
  const merged = [...existing]
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      merged.push(item)
    }
  }
  return merged
}

export function SignalsFeedPage() {
  const { token } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseFeedQuery(searchParams), [searchParams])
  const queryKey = useMemo(() => JSON.stringify(query), [query])
  const queryRef = useRef(query)
  const generationRef = useRef(0)
  const inFlightRef = useRef<AbortController | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<FeedState>(emptyFeed)
  const scrollKey = `signals.scroll:${location.pathname}${location.search}`

  function updateQuery(patch: Partial<FeedQuery>): void {
    const next = new URLSearchParams(searchParams)
    const merged = { ...query, ...patch }
    setParam(next, 'signalType', merged.signalType)
    setParam(next, 'severity', merged.severity)
    setParam(next, 'status', merged.status)
    setParam(next, 'q', merged.q.trim())
    setSearchParams(next, { replace: true })
  }

  function rememberScroll(): void {
    setFeedSnapshot(queryKey, {
      items: state.items,
      nextCursor: state.nextCursor,
      hasMore: state.hasMore,
      totalEstimate: state.totalEstimate,
    })
    window.sessionStorage.setItem(scrollKey, String(window.scrollY))
  }

  useEffect(() => {
    queryRef.current = query
  }, [query])

  const requestPage = useCallback((cursor: string | null, mode: 'initial' | 'more'): void => {
    if (!token || inFlightRef.current) {
      return
    }

    const controller = new AbortController()
    const generation = generationRef.current
    inFlightRef.current = controller
    setState((current) => ({
      ...current,
      loadingInitial: mode === 'initial',
      loadingMore: mode === 'more',
      error: null,
    }))

    getSignalFeed(token, queryRef.current, cursor, controller.signal)
      .then((response) => {
        if (generation !== generationRef.current) {
          return
        }
        setState((current) => {
          const items = mode === 'initial' ? response.items : dedupeSignals(current.items, response.items)
          const nextState = {
            items,
            nextCursor: response.nextCursor,
            hasMore: response.hasMore,
            totalEstimate: response.totalEstimate,
            loadingInitial: false,
            loadingMore: false,
            error: null,
          }
          setFeedSnapshot(queryKey, nextState)
          return nextState
        })
      })
      .catch((requestError: unknown) => {
        if (isAbortError(requestError) || generation !== generationRef.current) {
          return
        }
        setState((current) => ({
          ...current,
          loadingInitial: false,
          loadingMore: false,
          error: getErrorMessage(requestError),
        }))
      })
      .finally(() => {
        if (inFlightRef.current === controller) {
          inFlightRef.current = null
        }
      })
  }, [queryKey, token])

  useEffect(() => {
    generationRef.current += 1
    inFlightRef.current?.abort()
    inFlightRef.current = null

    const snapshot = getFeedSnapshot(queryKey)
    if (snapshot) {
      setState({ ...snapshot, loadingInitial: false, loadingMore: false, error: null })
      return undefined
    }

    setState({ ...emptyFeed, loadingInitial: true })
    requestPage(null, 'initial')
    return () => {
      inFlightRef.current?.abort()
    }
  }, [queryKey, requestPage, token])

  useEffect(() => {
    const saved = window.sessionStorage.getItem(scrollKey)
    if (!saved || state.items.length === 0) {
      return undefined
    }
    const scrollY = Number(saved)
    if (!Number.isFinite(scrollY)) {
      return undefined
    }
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }))
    return () => window.cancelAnimationFrame(frame)
  }, [scrollKey, state.items.length])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !state.hasMore || state.loadingInitial || state.loadingMore || state.error) {
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && state.nextCursor) {
          requestPage(state.nextCursor, 'more')
        }
      },
      { rootMargin: '360px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [requestPage, state.error, state.hasMore, state.loadingInitial, state.loadingMore, state.nextCursor])

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Feed de Senales</h1>
        <p className="mt-1 text-sm text-stone-600">Cursor real, deduplicacion por ID y una sola pagina en vuelo.</p>
      </div>

      <div className="grid gap-3 rounded border border-stone-200 bg-white p-4 md:grid-cols-4">
        <TextInput
          value={query.q}
          maxLength={80}
          placeholder="Buscar"
          onChange={(event) => updateQuery({ q: event.target.value })}
        />
        <Select
          value={query.signalType}
          onChange={(event) => updateQuery({ signalType: event.target.value as FeedQuery['signalType'] })}
        >
          <option value="">Tipo</option>
          {signalTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Select value={query.severity} onChange={(event) => updateQuery({ severity: event.target.value as FeedQuery['severity'] })}>
          <option value="">Severidad</option>
          {severityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Select value={query.status} onChange={(event) => updateQuery({ status: event.target.value as FeedQuery['status'] })}>
          <option value="">Estado</option>
          {signalStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
      </div>

      {state.loadingInitial ? <LoadingBlock label="Cargando senales" /> : null}
      {!state.loadingInitial && state.items.length === 0 && !state.error ? (
        <EmptyBlock title="Sin senales" message="No hay senales para los filtros actuales." />
      ) : null}

      <div className="grid gap-3" aria-live="polite">
        {state.items.map((signal) => (
          <article key={signal.id} className="rounded border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info">{signal.signalType}</Badge>
                  <Badge tone={severityTone(signal.severity)}>{signal.severity}</Badge>
                  <Badge tone={statusTone(signal.status)}>{signal.status}</Badge>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{signal.tropel.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">{signal.rawContent}</p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
                to={`/signals/${signal.id}`}
                state={{ from: `${location.pathname}${location.search}` }}
                onClick={rememberScroll}
              >
                Detalle
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-3">
              <span>ID: {signal.id}</span>
              <span>Especie: {signal.tropel.species}</span>
              <span>Creada: {formatDateTime(signal.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>

      {state.error ? (
        <ErrorBlock
          message={state.error}
          action={
            <Button type="button" variant="secondary" onClick={() => requestPage(state.nextCursor, state.items.length ? 'more' : 'initial')}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          }
        />
      ) : null}

      <div ref={sentinelRef} className="min-h-12">
        {state.loadingMore ? <LoadingBlock label="Cargando mas senales" /> : null}
        {!state.hasMore && state.items.length > 0 ? (
          <p className="rounded border border-stone-200 bg-white p-3 text-center text-sm text-stone-600">
            Fin de lista · {state.items.length} de {state.totalEstimate}
          </p>
        ) : null}
      </div>
    </section>
  )
}
