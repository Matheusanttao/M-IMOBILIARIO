import { TenantProvider } from '@/contexts/TenantContext'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { getPublicEmpresa } from '@/lib/tenant'

export default async function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const emp = await getPublicEmpresa()

  return (
    <TenantProvider
      value={{
        empresaId: emp?.id ?? '',
        empresaNome: emp?.nome ?? 'Imobiliária',
        slug: emp?.slug ?? '',
        whatsapp: emp?.whatsapp ?? null,
        email: emp?.email ?? null,
        cidade: emp?.cidade ?? null,
        estado: emp?.estado ?? null,
        financiamentoUrl: emp?.financiamento_url ?? null,
      }}
    >
      <PublicLayout>{children}</PublicLayout>
    </TenantProvider>
  )
}
