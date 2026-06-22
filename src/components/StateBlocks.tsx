import { AlertTriangle, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingBlock({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded border border-stone-200 bg-white/80 p-6 text-stone-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBlock({
  title = 'No se pudo completar la operacion',
  message,
  action,
}: {
  title?: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-rose-800">{message}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function EmptyBlock({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
      <h2 className="text-base font-semibold text-stone-950">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-stone-600">{message}</p>
    </div>
  )
}
