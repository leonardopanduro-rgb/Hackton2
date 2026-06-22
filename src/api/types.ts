export const speciesOptions = ['BLOBITO', 'CHISPA', 'GRUNON', 'DORMILON', 'GLITCHY'] as const
export const vitalStateOptions = ['ESTABLE', 'HAMBRIENTO', 'AGITADO', 'MUTANDO', 'CRITICO'] as const
export const signalTypeOptions = [
  'HAMBRE',
  'ABANDONO',
  'MUTACION',
  'FUGA',
  'CONFLICTO',
  'REPRODUCCION_MASIVA',
  'SENAL_CORRUPTA',
] as const
export const severityOptions = ['LEVE', 'MODERADO', 'GRAVE', 'CRITICO'] as const
export const signalStatusOptions = ['RECIBIDA', 'PROCESANDO', 'ATENDIDA'] as const
export const patchableSignalStatusOptions = ['PROCESANDO', 'ATENDIDA'] as const
export const climateOptions = ['PIXEL_FOREST', 'NEON_CAVE', 'CLOUD_AQUARIUM', 'RETRO_ARCADE'] as const
export const tropelSortOptions = ['name,asc', 'updatedAt,desc', 'chaosIndex,desc'] as const
export const pageSizeOptions = [10, 20, 50] as const

export type Species = (typeof speciesOptions)[number]
export type VitalState = (typeof vitalStateOptions)[number]
export type SignalType = (typeof signalTypeOptions)[number]
export type Severity = (typeof severityOptions)[number]
export type SignalStatus = (typeof signalStatusOptions)[number]
export type PatchableSignalStatus = (typeof patchableSignalStatusOptions)[number]
export type Climate = (typeof climateOptions)[number]
export type TropelSort = (typeof tropelSortOptions)[number]
export type PageSize = (typeof pageSizeOptions)[number]

export interface ApiErrorBody {
  error: string
  message: string
  timestamp?: string
  path?: string
  details?: Record<string, unknown>
}

export interface User {
  id: string
  displayName: string
  email: string
  teamCode: string
  role: 'OPERATOR' | string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: User
}

export interface DashboardSummary {
  totalTropels: number
  criticalTropels: number
  openSignals: number
  sectorStabilityAvg: number
  signalsBySeverity: Record<Severity, number>
  generatedAt: string
}

export interface SectorLite {
  id: string
  sectorCode: string
  name: string
  climate: Climate
  capacity: number
  currentLoad: number
  stabilityLevel: number
}

export interface Tropel {
  id: string
  name: string
  species: Species
  vitalState: VitalState
  energyLevel: number
  chaosIndex: number
  mutationStage: number
  guardianName: string
  sector: Pick<SectorLite, 'id' | 'name' | 'sectorCode'>
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  currentPage: number
  size: number
}

export interface SignalDto {
  id: string
  signalType: SignalType
  severity: Severity
  status: SignalStatus
  rawContent: string
  tropel: Pick<Tropel, 'id' | 'name' | 'species'>
  createdAt: string
  updatedAt: string
}

export interface FeedResponse {
  items: SignalDto[]
  nextCursor: string | null
  hasMore: boolean
  totalEstimate: number
}

export interface SectorsResponse {
  items: SectorLite[]
}

export interface StoryStageMetrics {
  stability: number
  energy: number
  alerts: number
  [key: string]: number
}

export interface StoryStage {
  id: string
  order: number
  title: string
  narrative: string
  dominantEvent: SignalType
  metrics: StoryStageMetrics
  assetKey: string
  colorToken: string
  progress: number
}

export interface SectorStory {
  sector: Pick<SectorLite, 'id' | 'name' | 'climate'>
  stages: StoryStage[]
}

export interface TropelQuery {
  page: number
  size: PageSize
  species: Species | ''
  vitalState: VitalState | ''
  sectorId: string
  q: string
  sort: TropelSort
}

export interface FeedQuery {
  signalType: SignalType | ''
  severity: Severity | ''
  status: SignalStatus | ''
  q: string
}
