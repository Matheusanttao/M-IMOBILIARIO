import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '@/services/supabase'

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
          <strong>Supabase não configurado.</strong> {SUPABASE_SETUP_MESSAGE}
        </span>
      </p>
    </div>
  )
}
