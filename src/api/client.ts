import type {
  ApiErrorBody,
  DashboardSummary,
  FeedQuery,
  FeedResponse,
  LoginResponse,
  PageResponse,
  PatchableSignalStatus,
  SectorStory,
  SectorsResponse,
  SignalDto,
  Tropel,
  TropelQuery,
} from './types.ts'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL
export const apiBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly body?: ApiErrorBody

  constructor(message: string, status: number, code: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

interface RequestOptions {
  token?: string
  signal?: AbortSignal
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.error === 'string' && typeof candidate.message === 'string'
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined
  }
  return response.json() as Promise<unknown>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError('Configura VITE_API_BASE_URL para conectar la consola.', 0, 'CONFIG_ERROR')
  }

  const headers = new Headers()
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  const payload = await parseJson(response)
  if (!response.ok) {
    const body = isErrorBody(payload) ? payload : undefined
    const message = body?.message ?? `Request failed with status ${response.status}`
    const code = body?.error ?? 'REQUEST_ERROR'
    throw new ApiError(message, response.status, code, body)
  }

  return payload as T
}

function appendOptional(params: URLSearchParams, key: string, value: string): void {
  if (value.trim() !== '') {
    params.set(key, value.trim())
  }
}

export function login(teamCode: string, email: string, password: string, signal?: AbortSignal) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { teamCode, email, password },
    signal,
  })
}

export function me(token: string, signal?: AbortSignal) {
  return apiRequest<LoginResponse['user']>('/auth/me', { token, signal })
}

export function getDashboard(token: string, signal?: AbortSignal) {
  return apiRequest<DashboardSummary>('/dashboard/summary', { token, signal })
}

export function getSectors(token: string, signal?: AbortSignal) {
  return apiRequest<SectorsResponse>('/sectors', { token, signal })
}

export function getTropels(token: string, query: TropelQuery, signal?: AbortSignal) {
  const params = new URLSearchParams()
  params.set('page', String(query.page))
  params.set('size', String(query.size))
  params.set('sort', query.sort)
  appendOptional(params, 'species', query.species)
  appendOptional(params, 'vitalState', query.vitalState)
  appendOptional(params, 'sectorId', query.sectorId)
  appendOptional(params, 'q', query.q)
  return apiRequest<PageResponse<Tropel>>(`/tropels?${params.toString()}`, { token, signal })
}

export function getSignalFeed(
  token: string,
  query: FeedQuery,
  cursor: string | null,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  params.set('limit', '15')
  if (cursor) {
    params.set('cursor', cursor)
  }
  appendOptional(params, 'signalType', query.signalType)
  appendOptional(params, 'severity', query.severity)
  appendOptional(params, 'status', query.status)
  appendOptional(params, 'q', query.q)
  return apiRequest<FeedResponse>(`/signals/feed?${params.toString()}`, { token, signal })
}

export function getSignal(token: string, id: string, signal?: AbortSignal) {
  return apiRequest<SignalDto>(`/signals/${encodeURIComponent(id)}`, { token, signal })
}

export function patchSignalStatus(
  token: string,
  id: string,
  status: PatchableSignalStatus,
  signal?: AbortSignal,
) {
  return apiRequest<SignalDto>(`/signals/${encodeURIComponent(id)}/status`, {
    token,
    method: 'PATCH',
    body: { status },
    signal,
  })
}

export function getSectorStory(token: string, id: string, signal?: AbortSignal) {
  return apiRequest<SectorStory>(`/sectors/${encodeURIComponent(id)}/story`, { token, signal })
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    if (window.location.hostname === '127.0.0.1') {
      return 'No se pudo conectar con la API. Abre la app como http://localhost:5173, no como 127.0.0.1.'
    }
    return 'No se pudo conectar con la API. Revisa conexion, CORS o URL del backend.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocurrio un error inesperado.'
}
