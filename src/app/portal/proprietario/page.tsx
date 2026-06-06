import Link from 'next/link'

export default function PortalProprietarioPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-primary">Portal do proprietário</h1>
      <p className="mt-4 text-muted">
        Acompanhe imóveis, contratos, repasses e atendimentos usando a conta
        vinculada à imobiliária.
      </p>
      <Link href="/admin/login" className="mt-8 inline-block text-primary underline">
        Ir para login
      </Link>
    </div>
  )
}
