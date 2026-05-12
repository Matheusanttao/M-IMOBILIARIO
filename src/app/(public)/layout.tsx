import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TenantProvider } from '@/contexts/TenantContext'
import { PublicLayout } from '@/components/layout/PublicLayout'

export default async function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const tenantSlug = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const supabase = await createServerSupabaseClient()
  const { data: emp } = await supabase
    .from('empresas')
    .select('id,nome,slug,whatsapp')
    .eq('slug', tenantSlug)
    .eq('ativa', true)
    .maybeSingle()

  return (
    <TenantProvider
      value={{
        empresaId: emp?.id ?? '',
        empresaNome: emp?.nome ?? 'Imobiliária',
        slug: emp?.slug ?? tenantSlug,
        whatsapp: emp?.whatsapp ?? null,
      }}
    >
      <PublicLayout>{children}</PublicLayout>
    </TenantProvider>
  )
}
