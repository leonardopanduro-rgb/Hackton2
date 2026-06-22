import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800',
        variant === 'secondary' && 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
        variant === 'danger' && 'border-rose-700 bg-rose-700 text-white hover:bg-rose-800',
        className,
      )}
      {...props}
    />
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'min-h-10 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'min-h-10 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100',
        className,
      )}
      {...props}
    />
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'
}) {
  return (
    <span
      className={clsx(
        'inline-flex min-h-6 items-center rounded px-2 text-xs font-semibold',
        tone === 'neutral' && 'bg-stone-100 text-stone-700',
        tone === 'good' && 'bg-emerald-100 text-emerald-800',
        tone === 'warn' && 'bg-amber-100 text-amber-800',
        tone === 'bad' && 'bg-rose-100 text-rose-800',
        tone === 'info' && 'bg-sky-100 text-sky-800',
      )}
    >
      {children}
    </span>
  )
}
