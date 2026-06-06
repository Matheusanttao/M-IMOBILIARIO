import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const tid = id ?? props.name
    return (
      <div className="w-full space-y-1.5 text-left">
        {label ? (
          <label htmlFor={tid} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={tid}
          className={cn(
            'min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
            error && 'border-red-400 focus:ring-red-200',
            className,
          )}
          {...props}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
