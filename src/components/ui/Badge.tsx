import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/15 text-primary border-accent/40',
  outline: 'bg-white text-slate-600 border-slate-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  muted: 'bg-slate-100 text-slate-600 border-slate-200',
} as const

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
