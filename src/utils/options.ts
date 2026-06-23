import type { TropelSort } from '../api/types.ts'

export const tropelSortLabels: Record<TropelSort, string> = {
  'name,asc': 'Nombre ascendente',
  'updatedAt,desc': 'Actualizacion reciente',
  'chaosIndex,desc': 'Mayor caos',
}

export function includesOption<const T extends readonly string[]>(options: T, value: string): value is T[number] {
  return (options as readonly string[]).includes(value)
}

export function includesNumber<const T extends readonly number[]>(options: T, value: number): value is T[number] {
  return (options as readonly number[]).includes(value)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function severityTone(severity: string): 'neutral' | 'good' | 'warn' | 'bad' | 'info' {
  if (severity === 'CRITICO') {
    return 'bad'
  }
  if (severity === 'GRAVE') {
    return 'warn'
  }
  if (severity === 'MODERADO') {
    return 'info'
  }
  return 'good'
}

export function statusTone(status: string): 'neutral' | 'good' | 'warn' | 'bad' | 'info' {
  if (status === 'ATENDIDA') {
    return 'good'
  }
  if (status === 'PROCESANDO') {
    return 'info'
  }
  return 'warn'
}
