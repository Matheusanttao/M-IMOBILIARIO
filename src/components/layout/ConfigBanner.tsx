import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function ConfigBanner() {
  if (isSupabaseConfigured()) return null

  return (
    <div
      role="alert"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
    >
      <p className="mx-auto flex max-w-4xl items-start justify-center gap-2 text-left sm:items-center sm:text-center">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 sm:mt-0" />
        <span>
          <strong>Serviço temporariamente indisponível.</strong> Tente novamente em alguns instantes.
        </span>
      </p>
    </div>
  )
}
