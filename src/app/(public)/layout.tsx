import { cookies } from 'next/headers'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { TenantProvider } from '@/contexts/TenantContext'
import { PublicLayout } from '@/components/layout/PublicLayout'

export default async function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const tenantSlug = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const emp = isServerSupabaseConfigured()
    ? (
        await (await createServerSupabaseClient())
          .from('empresas')
          .select('id,nome,slug,whatsapp,email,cidade,estado')
          .eq('slug', tenantSlug)
          .eq('ativa', true)
          .maybeSingle()
      ).data
    : null

  return (
    <TenantProvider
      value={{
        empresaId: emp?.id ?? '',
        empresaNome: emp?.nome ?? 'Imobiliária',
        slug: emp?.slug ?? tenantSlug,
        whatsapp: emp?.whatsapp ?? null,
        email: emp?.email ?? null,
        cidade: emp?.cidade ?? null,
        estado: emp?.estado ?? null,
      }}
    >
      <PublicLayout>{children}</PublicLayout>
    </TenantProvider>
  )
}
