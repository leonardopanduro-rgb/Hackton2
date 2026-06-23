import type {
  DashboardSummary,
  FeedResponse,
  PageResponse,
  SectorLite,
  SectorStory,
  SignalDto,
  Tropel,
} from '../api/types.ts'

// ── deterministic pseudo-random ──────────────────────────────────────────────
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ── lookup tables ─────────────────────────────────────────────────────────────
const SPECIES = ['BLOBITO', 'CHISPA', 'GRUNON', 'DORMILON', 'GLITCHY'] as const
const VITAL = ['ESTABLE', 'HAMBRIENTO', 'AGITADO', 'MUTANDO', 'CRITICO'] as const
const SIGNAL_TYPE = ['HAMBRE', 'ABANDONO', 'MUTACION', 'FUGA', 'CONFLICTO', 'REPRODUCCION_MASIVA', 'SENAL_CORRUPTA'] as const
const SEVERITY = ['LEVE', 'MODERADO', 'GRAVE', 'CRITICO'] as const
const STATUS = ['RECIBIDA', 'PROCESANDO', 'ATENDIDA'] as const
const CLIMATE = ['PIXEL_FOREST', 'NEON_CAVE', 'CLOUD_AQUARIUM', 'RETRO_ARCADE'] as const
const COLOR_TOKENS = ['emerald', 'teal', 'cyan', 'sky', 'violet', 'purple', 'amber', 'orange', 'rose', 'red']
const GUARDIAN_NAMES = ['Ada', 'Bertha', 'Carmen', 'Diana', 'Elena', 'Fernanda', 'Gloria', 'Hilda', 'Iris', 'Julia']
const SECTOR_NAMES = [
  'Bosque Norte', 'Caverna Neon', 'Acuario Alto', 'Arcade Retro',
  'Valle Sur', 'Pico Este', 'Laguna Oeste', 'Cima Central',
  'Grieta Profunda', 'Pantano Pixelado', 'Cresta Digital', 'Zona Cero',
]
const RAW_CONTENTS = [
  'Patron de energia por debajo del umbral critico.',
  'Actividad anomala detectada en el sector adyacente.',
  'Nivel de caos excede parametros normales de operacion.',
  'Senal de mutacion registrada en las ultimas 3 horas.',
  'Tropel sin guardian asignado desde el ciclo anterior.',
  'Reproduccion no autorizada detectada en zona restringida.',
  'Fuga de energia en el nucleo del sector.',
  'Conflicto territorial registrado entre dos tropeles.',
  'Patron de abandono detectado en coordenadas del sector.',
  'Senal corrupta: datos incompletos o malformados.',
]
const ASSET_KEYS = [
  'pixel-forest-dawn', 'neon-cave-pulse', 'cloud-aquarium-depth', 'retro-arcade-boot',
  'pixel-forest-noon', 'neon-cave-glow', 'cloud-aquarium-wave', 'retro-arcade-peak',
]
const STAGE_TITLES = [
  'Primer pulso', 'Expansion inicial', 'Crisis emergente', 'Punto de quiebre',
  'Recuperacion temprana', 'Estabilizacion', 'Consolidacion', 'Estado final',
]
const STAGE_NARRATIVES = [
  'La actividad despierta entre pixeles verdes mientras los tropeles comienzan su ciclo.',
  'Las senales se multiplican y el sector responde con energia creciente.',
  'Una anomalia interrumpe el flujo normal y los operadores deben actuar.',
  'El caos alcanza su punto maximo y la estabilidad del sector esta en juego.',
  'Los primeros signos de recuperacion aparecen tras la intervencion de los guardianes.',
  'El sector recobra su ritmo y los niveles de energia se normalizan.',
  'Las metricas se consolidan y el sector entra en fase de mantenimiento.',
  'El ciclo concluye y el sector reporta su estado definitivo al sistema central.',
]

// ── base date ─────────────────────────────────────────────────────────────────
const BASE = new Date('2026-06-20T10:00:00Z').getTime()

function isoAt(offsetMs: number): string {
  return new Date(BASE + offsetMs).toISOString()
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!
}

// ── generated data ────────────────────────────────────────────────────────────
const rand = rng(42)

export const SECTORS: SectorLite[] = Array.from({ length: 12 }, (_, i) => ({
  id: `sec_${String(i + 1).padStart(3, '0')}`,
  sectorCode: `SEC-${String(i + 1).padStart(2, '0')}`,
  name: SECTOR_NAMES[i]!,
  climate: CLIMATE[i % CLIMATE.length]!,
  capacity: 10 + Math.floor(rand() * 15),
  currentLoad: 5 + Math.floor(rand() * 10),
  stabilityLevel: 40 + Math.floor(rand() * 55),
}))

export const TROPELS: Tropel[] = Array.from({ length: 120 }, (_, i) => {
  const sector = SECTORS[i % 12]!
  return {
    id: `trp_${String(i + 1).padStart(3, '0')}`,
    name: `${pick(SPECIES, rand)}-${String(i + 1).padStart(3, '0')}`,
    species: pick(SPECIES, rand),
    vitalState: pick(VITAL, rand),
    energyLevel: 10 + Math.floor(rand() * 90),
    chaosIndex: Math.floor(rand() * 100),
    mutationStage: Math.floor(rand() * 5),
    guardianName: pick(GUARDIAN_NAMES, rand),
    sector: { id: sector.id, name: sector.name, sectorCode: sector.sectorCode },
    createdAt: isoAt(i * 3_600_000),
    updatedAt: isoAt(i * 3_600_000 + Math.floor(rand() * 7_200_000)),
  }
})

export const SIGNALS: SignalDto[] = Array.from({ length: 600 }, (_, i) => {
  const tropel = TROPELS[i % 120]!
  return {
    id: `sig_${String(i + 1).padStart(3, '0')}`,
    signalType: pick(SIGNAL_TYPE, rand),
    severity: pick(SEVERITY, rand),
    status: pick(STATUS, rand),
    rawContent: pick(RAW_CONTENTS, rand),
    tropel: { id: tropel.id, name: tropel.name, species: tropel.species },
    createdAt: isoAt((600 - i) * 900_000),
    updatedAt: isoAt((600 - i) * 900_000 + Math.floor(rand() * 1_800_000)),
  }
})

export const SECTOR_STORIES: Record<string, SectorStory> = Object.fromEntries(
  SECTORS.map((sector) => [
    sector.id,
    {
      sector: { id: sector.id, name: sector.name, climate: sector.climate },
      stages: Array.from({ length: 8 }, (_, i) => ({
        id: `stage_${sector.id}_${i}`,
        order: i,
        title: STAGE_TITLES[i]!,
        narrative: STAGE_NARRATIVES[i]!,
        dominantEvent: pick(SIGNAL_TYPE, rand),
        metrics: {
          stability: 30 + Math.floor(rand() * 65),
          energy: 20 + Math.floor(rand() * 75),
          alerts: Math.floor(rand() * 15),
        },
        assetKey: ASSET_KEYS[i]!,
        colorToken: COLOR_TOKENS[i % COLOR_TOKENS.length]!,
        progress: i / 7,
      })),
    },
  ]),
)

// ── dashboard ─────────────────────────────────────────────────────────────────
export const DASHBOARD: DashboardSummary = {
  totalTropels: 120,
  criticalTropels: TROPELS.filter((t) => t.vitalState === 'CRITICO').length,
  openSignals: SIGNALS.filter((s) => s.status === 'RECIBIDA').length,
  sectorStabilityAvg: Math.round(SECTORS.reduce((acc, s) => acc + s.stabilityLevel, 0) / SECTORS.length),
  signalsBySeverity: {
    LEVE: SIGNALS.filter((s) => s.severity === 'LEVE').length,
    MODERADO: SIGNALS.filter((s) => s.severity === 'MODERADO').length,
    GRAVE: SIGNALS.filter((s) => s.severity === 'GRAVE').length,
    CRITICO: SIGNALS.filter((s) => s.severity === 'CRITICO').length,
  },
  generatedAt: new Date().toISOString(),
}

// ── helpers used by handlers ──────────────────────────────────────────────────
export function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const totalElements = items.length
  const totalPages = Math.ceil(totalElements / size)
  const currentPage = Math.min(page, totalPages - 1)
  const start = currentPage * size
  return {
    content: items.slice(start, start + size),
    totalElements,
    totalPages: Math.max(totalPages, 1),
    currentPage,
    size,
  }
}

export function cursorIndex(cursor: string | null): number {
  if (!cursor) return 0
  try {
    const decoded = JSON.parse(atob(cursor)) as { offset: number }
    return decoded.offset
  } catch {
    return 0
  }
}

export function makeCursor(offset: number): string {
  return btoa(JSON.stringify({ offset }))
}

export function feedPage(
  items: SignalDto[],
  cursor: string | null,
  limit: number,
): FeedResponse {
  const offset = cursorIndex(cursor)
  const slice = items.slice(offset, offset + limit)
  const nextOffset = offset + slice.length
  const hasMore = nextOffset < items.length
  return {
    items: slice,
    nextCursor: hasMore ? makeCursor(nextOffset) : null,
    hasMore,
    totalEstimate: items.length,
  }
}
