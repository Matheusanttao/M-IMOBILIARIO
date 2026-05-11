import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

let client: SupabaseClient | null = null

/** True quando URL e chave anônima estão definidas no `.env` (reinicie `pnpm dev` após criar/editar o arquivo). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

export const SUPABASE_SETUP_MESSAGE =
  'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env na raiz do projeto (copie de .env.example) e reinicie o servidor com pnpm dev.'

/**
 * Cliente singleton. Só chame após garantir `isSupabaseConfigured()` ou trate o erro.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(SUPABASE_SETUP_MESSAGE)
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return client
}
