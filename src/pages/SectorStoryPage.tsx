import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react'
import { getErrorMessage, getSectorStory, isAbortError } from '../api/client.ts'
import type { SectorStory, StoryStage } from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge, Button } from '../components/ui.tsx'
import { useReducedMotion } from '../hooks/useReducedMotion.ts'
import { severityTone } from '../utils/options.ts'

const METRIC_LABELS: Record<string, string> = {
  stability: 'Estabilidad',
  energy: 'Energia',
  alerts: 'Alertas',
}

const colorTokens: Record<string, string> = {
  emerald: '#047857',
  teal: '#0f766e',
  cyan: '#0891b2',
  sky: '#0284c7',
  violet: '#7c3aed',
  purple: '#9333ea',
  amber: '#d97706',
  orange: '#ea580c',
  rose: '#e11d48',
  red: '#dc2626',
}

function colorForToken(token: string): string {
  return colorTokens[token.toLowerCase()] ?? '#0f766e'
}

export function SectorStoryPage() {
  const { token } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const stageRefs = useRef<Array<HTMLElement | null>>([])
  const [story, setStory] = useState<SectorStory | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !id) {
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    getSectorStory(token, id, controller.signal)
      .then((response) => {
        setStory({
          ...response,
          stages: [...response.stages].sort((left, right) => left.order - right.order),
        })
        setActiveIndex(0)
      })
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [id, token])

  const stages = story?.stages ?? []
  const activeStage = stages[activeIndex] ?? stages[0] ?? null
  const progress = useMemo(() => {
    if (!activeStage || stages.length <= 1) {
      return 0
    }
    return Math.round((activeStage.progress || activeIndex / (stages.length - 1)) * 100)
  }, [activeIndex, activeStage, stages.length])

  useEffect(() => {
    if (stages.length === 0) {
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]
        const index = visible?.target.getAttribute('data-stage-index')
        if (index !== undefined && index !== null) {
          setActiveIndex(Number(index))
        }
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0.25, 0.5, 0.75] },
    )

    for (const node of stageRefs.current) {
      if (node) {
        observer.observe(node)
      }
    }

    return () => observer.disconnect()
  }, [stages.length])

  function focusStage(index: number): void {
    const safeIndex = Math.min(Math.max(index, 0), stages.length - 1)
    const node = stageRefs.current[safeIndex]
    if (!node) {
      return
    }
    setActiveIndex(safeIndex)
    node.focus({ preventScroll: true })
    node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      focusStage(activeIndex + 1)
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      focusStage(activeIndex - 1)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      focusStage(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      focusStage(stages.length - 1)
    }
  }

  function goBack(): void {
    const back = () => navigate('/sectors')
    if (document.startViewTransition && !reducedMotion) {
      document.startViewTransition(back)
      return
    }
    back()
  }

  if (loading) {
    return <LoadingBlock label="Cargando historia" />
  }

  if (error || !story || !activeStage) {
    return (
      <ErrorBlock
        message={error ?? 'No se pudo cargar la historia del sector.'}
        action={<Button variant="secondary" onClick={goBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver</Button>}
      />
    )
  }

  return (
    <section className="story-page grid gap-5" onKeyDown={handleKeyDown}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Sectores
        </Button>
        <Badge tone="info">{story.sector.climate}</Badge>
      </div>

      <div className="story-layout">
        <aside className="story-visual-wrap" aria-label="Visual del sector activo">
          <StoryVisual stage={activeStage} sectorName={story.sector.name} progress={progress} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" disabled={activeIndex === 0} onClick={() => focusStage(activeIndex - 1)}>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={activeIndex >= stages.length - 1}
              onClick={() => focusStage(activeIndex + 1)}
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Siguiente
            </Button>
          </div>
        </aside>

        <div className="story-stages">
          {stages.map((stage, index) => (
            <article
              key={stage.id}
              ref={(node) => {
                stageRefs.current[index] = node
              }}
              data-stage-index={index}
              tabIndex={0}
              className={index === activeIndex ? 'story-stage story-stage-active' : 'story-stage'}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Etapa {stage.order + 1}/8</Badge>
                <Badge tone={severityTone(stage.dominantEvent)}>{stage.dominantEvent}</Badge>
              </div>
              <h1 className="story-heading mt-4 text-3xl font-semibold">{stage.title}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">{stage.narrative}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {Object.entries(stage.metrics).map(([key, value]) => (
                  <div key={key} className="rounded border border-stone-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-stone-500">{METRIC_LABELS[key] ?? key}</p>
                    <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
          <Button type="button" variant="secondary" className="mb-10 w-fit" onClick={() => focusStage(0)}>
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            Inicio
          </Button>
        </div>
      </div>
    </section>
  )
}

function StoryVisual({ stage, sectorName, progress }: { stage: StoryStage; sectorName: string; progress: number }) {
  const color = colorForToken(stage.colorToken)
  return (
    <div className="story-visual" style={{ borderColor: color, background: `linear-gradient(145deg, ${color}24, #ffffff 42%, #fff7ed)` }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-500">{sectorName}</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">{stage.assetKey}</h2>
        </div>
        <Badge tone="info">{progress}%</Badge>
      </div>
      <div className="story-map" style={{ borderColor: color }}>
        <div className="story-core" style={{ backgroundColor: color }} />
        <span className="story-marker story-marker-a" style={{ backgroundColor: color }} />
        <span className="story-marker story-marker-b" style={{ backgroundColor: color }} />
        <span className="story-marker story-marker-c" style={{ backgroundColor: color }} />
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded bg-stone-200">
        <div className="h-full rounded bg-teal-700 transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <VisualMetric label="Estabilidad" value={stage.metrics.stability} />
        <VisualMetric label="Energia" value={stage.metrics.energy} />
        <VisualMetric label="Alertas" value={stage.metrics.alerts} />
      </dl>
    </div>
  )
}

function VisualMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-white/80 p-2">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-stone-950">{value}</dd>
    </div>
  )
}
