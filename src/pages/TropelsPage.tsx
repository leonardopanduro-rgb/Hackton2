import { useEffect, useMemo, useRef, useState } from 'react'
import { getErrorMessage, getSectors, getTropels, isAbortError } from '../api/client.ts'
import {
  pageSizeOptions,
  speciesOptions,
  tropelSortOptions,
  vitalStateOptions,
  type PageResponse,
  type SectorLite,
  type Tropel,
  type TropelQuery,
} from '../api/types.ts'
import { useAuth } from '../auth/AuthProvider.tsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks.tsx'
import { Badge, Button, Select, TextInput } from '../components/ui.tsx'
import { formatDateTime, severityTone } from '../utils/options.ts'
import { includesNumber, includesOption } from '../utils/options.ts'
import { useSearchParams } from 'react-router-dom'

const defaultQuery: TropelQuery = {
  page: 0,
  size: 20,
  species: '',
  vitalState: '',
  sectorId: '',
  q: '',
  sort: 'updatedAt,desc',
}

function parseQuery(params: URLSearchParams): TropelQuery {
  const pageValue = Number(params.get('page') ?? defaultQuery.page)
  const sizeValue = Number(params.get('size') ?? defaultQuery.size)
  const species = params.get('species') ?? ''
  const vitalState = params.get('vitalState') ?? ''
  const sort = params.get('sort') ?? defaultQuery.sort

  return {
    page: Number.isInteger(pageValue) && pageValue >= 0 ? pageValue : defaultQuery.page,
    size: includesNumber(pageSizeOptions, sizeValue) ? sizeValue : defaultQuery.size,
    species: includesOption(speciesOptions, species) ? species : '',
    vitalState: includesOption(vitalStateOptions, vitalState) ? vitalState : '',
    sectorId: params.get('sectorId') ?? '',
    q: (params.get('q') ?? '').slice(0, 80),
    sort: includesOption(tropelSortOptions, sort) ? sort : defaultQuery.sort,
  }
}

function setParam(params: URLSearchParams, key: string, value: string): void {
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
}

export function TropelsPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseQuery(searchParams), [searchParams])
  const queryKey = useMemo(() => JSON.stringify(query), [query])
  const requestSeq = useRef(0)
  const [page, setPage] = useState<PageResponse<Tropel> | null>(null)
  const [sectors, setSectors] = useState<SectorLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return undefined
    }
    const controller = new AbortController()
    getSectors(token, controller.signal)
      .then((response) => setSectors(response.items))
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError)) {
          setSectors([])
        }
      })
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token) {
      return undefined
    }
    const controller = new AbortController()
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    setLoading(true)
    setError(null)

    getTropels(token, query, controller.signal)
      .then((response) => {
        if (requestSeq.current === seq) {
          setPage(response)
        }
      })
      .catch((requestError: unknown) => {
        if (!isAbortError(requestError) && requestSeq.current === seq) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (requestSeq.current === seq) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [query, queryKey, token])

  function updateQuery(patch: Partial<TropelQuery>, resetPage: boolean): void {
    const next = new URLSearchParams(searchParams)
    const merged = { ...query, ...patch, page: resetPage ? 0 : (patch.page ?? query.page) }
    setParam(next, 'page', merged.page === 0 ? '' : String(merged.page))
    setParam(next, 'size', merged.size === defaultQuery.size ? '' : String(merged.size))
    setParam(next, 'species', merged.species)
    setParam(next, 'vitalState', merged.vitalState)
    setParam(next, 'sectorId', merged.sectorId)
    setParam(next, 'q', merged.q.trim())
    setParam(next, 'sort', merged.sort === defaultQuery.sort ? '' : merged.sort)
    setSearchParams(next, { replace: true })
  }

  const totalPages = page?.totalPages ?? 0
  const content = page?.content ?? []

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Atlas de Tropeles</h1>
        <p className="mt-1 text-sm text-stone-600">Paginacion, filtros y ordenamiento desde el servidor.</p>
      </div>

      <div className="grid gap-3 rounded border border-stone-200 bg-white p-4 lg:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
        <TextInput
          value={query.q}
          maxLength={80}
          placeholder="Buscar"
          onChange={(event) => updateQuery({ q: event.target.value }, true)}
        />
        <Select value={query.species} onChange={(event) => updateQuery({ species: event.target.value as TropelQuery['species'] }, true)}>
          <option value="">Especie</option>
          {speciesOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Select
          value={query.vitalState}
          onChange={(event) => updateQuery({ vitalState: event.target.value as TropelQuery['vitalState'] }, true)}
        >
          <option value="">Estado vital</option>
          {vitalStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Select value={query.sectorId} onChange={(event) => updateQuery({ sectorId: event.target.value }, true)}>
          <option value="">Sector</option>
          {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.sectorCode}</option>)}
        </Select>
        <Select value={query.sort} onChange={(event) => updateQuery({ sort: event.target.value as TropelQuery['sort'] }, true)}>
          {tropelSortOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Select value={query.size} onChange={(event) => updateQuery({ size: Number(event.target.value) as TropelQuery['size'] }, true)}>
          {pageSizeOptions.map((option) => <option key={option} value={option}>{option} filas</option>)}
        </Select>
      </div>

      <div className="min-h-[34rem] rounded border border-stone-200 bg-white">
        {error ? <div className="p-4"><ErrorBlock message={error} /></div> : null}
        {loading && !page ? <div className="p-4"><LoadingBlock label="Cargando tropeles" /></div> : null}
        {!loading && !error && content.length === 0 ? (
          <div className="p-4"><EmptyBlock title="Sin resultados" message="No hay tropeles para los filtros actuales." /></div>
        ) : null}
        {page ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Especie</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Energia</th>
                  <th className="px-4 py-3">Caos</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {content.map((tropel) => (
                  <tr key={tropel.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-950">{tropel.name}</td>
                    <td className="px-4 py-3"><Badge tone="info">{tropel.species}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={severityTone(tropel.vitalState)}>{tropel.vitalState}</Badge></td>
                    <td className="px-4 py-3">{tropel.energyLevel}</td>
                    <td className="px-4 py-3">{tropel.chaosIndex}</td>
                    <td className="px-4 py-3">{tropel.sector.sectorCode}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDateTime(tropel.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading ? <div className="border-t border-stone-100 p-3 text-sm text-stone-600">Actualizando vista...</div> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          {page ? `${page.totalElements} resultados · pagina ${page.currentPage + 1} de ${Math.max(totalPages, 1)}` : 'Sin datos'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={query.page <= 0 || loading} onClick={() => updateQuery({ page: query.page - 1 }, false)}>
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={loading || totalPages === 0 || query.page >= totalPages - 1}
            onClick={() => updateQuery({ page: query.page + 1 }, false)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </section>
  )
}
