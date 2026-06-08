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
        logoUrl: emp?.logo_url ?? null,
        whatsapp: emp?.whatsapp ?? null,
        email: emp?.email ?? null,
        cidade: emp?.cidade ?? null,
        estado: emp?.estado ?? null,
        financiamentoUrl: emp?.financiamento_url ?? null,
        quemSomosTitulo: emp?.quem_somos_titulo ?? null,
        quemSomosTexto: emp?.quem_somos_texto ?? null,
        politicaPrivacidadeTitulo: emp?.politica_privacidade_titulo ?? null,
        politicaPrivacidadeTexto: emp?.politica_privacidade_texto ?? null,
      }}
    >
      <PublicLayout>{children}</PublicLayout>
    </TenantProvider>
  )
}
