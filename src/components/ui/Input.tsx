import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full space-y-1.5 text-left">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
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
Input.displayName = 'Input'
