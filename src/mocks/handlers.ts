import { http, HttpResponse } from 'msw'
import {
  DASHBOARD,
  SECTOR_STORIES,
  SECTORS,
  SIGNALS,
  TROPELS,
  feedPage,
  paginate,
} from './seed.ts'
import type { SignalDto, Species, TropelSort, VitalState } from '../api/types.ts'

const VALID_SIZES = [10, 20, 50]
const VALID_SORTS = ['name,asc', 'updatedAt,desc', 'chaosIndex,desc']

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ error: code, message, timestamp: new Date().toISOString() }, { status })
}

// in-memory signal store so PATCH persists during the session
const signalStore = new Map<string, SignalDto>(SIGNALS.map((s) => [s.id, { ...s }]))

export const handlers = [
  // ── auth ──────────────────────────────────────────────────────────────────
  http.post('*/auth/login', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    if (!body.teamCode || !body.email || !body.password) {
      return error(400, 'VALIDATION_ERROR', 'Faltan credenciales.')
    }
    return HttpResponse.json({
      token: 'mock-jwt-token',
      expiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      user: {
        id: 'usr_001',
        displayName: 'Operator Mock',
        email: body.email,
        teamCode: body.teamCode,
        role: 'OPERATOR',
      },
    })
  }),

  http.get('*/auth/me', () => {
    return HttpResponse.json({
      id: 'usr_001',
      displayName: 'Operator Mock',
      email: 'operator@tuckersoft.com',
      teamCode: 'TEAM-001',
      role: 'OPERATOR',
    })
  }),

  // ── dashboard ─────────────────────────────────────────────────────────────
  http.get('*/dashboard/summary', () => {
    return HttpResponse.json({ ...DASHBOARD, generatedAt: new Date().toISOString() })
  }),

  // ── sectors ───────────────────────────────────────────────────────────────
  http.get('*/sectors', () => {
    return HttpResponse.json({ items: SECTORS })
  }),

  http.get('*/sectors/:id/story', ({ params }) => {
    const story = SECTOR_STORIES[params.id as string]
    if (!story) return error(404, 'NOT_FOUND', 'Sector no encontrado.')
    return HttpResponse.json(story)
  }),

  // ── tropels ───────────────────────────────────────────────────────────────
  http.get('*/tropels', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const sort = (url.searchParams.get('sort') ?? 'updatedAt,desc') as TropelSort
    const species = url.searchParams.get('species') ?? ''
    const vitalState = url.searchParams.get('vitalState') ?? ''
    const sectorId = url.searchParams.get('sectorId') ?? ''
    const q = (url.searchParams.get('q') ?? '').toLowerCase()

    if (!VALID_SIZES.includes(size)) return error(400, 'VALIDATION_ERROR', 'Parametro size invalido.')
    if (!VALID_SORTS.includes(sort)) return error(400, 'VALIDATION_ERROR', 'Parametro sort invalido.')

    let items = [...TROPELS]
    if (species) items = items.filter((t) => t.species === (species as Species))
    if (vitalState) items = items.filter((t) => t.vitalState === (vitalState as VitalState))
    if (sectorId) items = items.filter((t) => t.sector.id === sectorId)
    if (q) items = items.filter((t) => t.name.toLowerCase().includes(q) || t.guardianName.toLowerCase().includes(q))

    if (sort === 'name,asc') items.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'updatedAt,desc') items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    else if (sort === 'chaosIndex,desc') items.sort((a, b) => b.chaosIndex - a.chaosIndex)

    return HttpResponse.json(paginate(items, page, size))
  }),

  http.get('*/tropels/:id', ({ params }) => {
    const tropel = TROPELS.find((t) => t.id === params.id)
    if (!tropel) return error(404, 'NOT_FOUND', 'Tropel no encontrado.')
    return HttpResponse.json(tropel)
  }),

  // ── signals ───────────────────────────────────────────────────────────────
  http.get('*/signals/feed', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 15), 30)
    const signalType = url.searchParams.get('signalType') ?? ''
    const severity = url.searchParams.get('severity') ?? ''
    const status = url.searchParams.get('status') ?? ''
    const q = (url.searchParams.get('q') ?? '').toLowerCase()

    let items = [...signalStore.values()]
    if (signalType) items = items.filter((s) => s.signalType === signalType)
    if (severity) items = items.filter((s) => s.severity === severity)
    if (status) items = items.filter((s) => s.status === status)
    if (q) items = items.filter((s) => s.rawContent.toLowerCase().includes(q) || s.tropel.name.toLowerCase().includes(q))

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))

    return HttpResponse.json(feedPage(items, cursor, limit))
  }),

  http.get('*/signals/:id', ({ params }) => {
    const signal = signalStore.get(params.id as string)
    if (!signal) return error(404, 'NOT_FOUND', 'Senal no encontrada.')
    return HttpResponse.json(signal)
  }),

  http.patch('*/signals/:id/status', async ({ params, request }) => {
    const signal = signalStore.get(params.id as string)
    if (!signal) return error(404, 'NOT_FOUND', 'Senal no encontrada.')

    const body = await request.json() as Record<string, string>
    if (!['PROCESANDO', 'ATENDIDA'].includes(body.status ?? '')) {
      return error(400, 'VALIDATION_ERROR', 'Estado invalido. Use PROCESANDO o ATENDIDA.')
    }

    const updated: SignalDto = { ...signal, status: body.status as SignalDto['status'], updatedAt: new Date().toISOString() }
    signalStore.set(updated.id, updated)
    return HttpResponse.json(updated)
  }),
]
