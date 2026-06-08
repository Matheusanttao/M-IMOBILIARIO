import Link from 'next/link'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <Link href="/" className="font-display text-lg font-semibold text-primary">
          Portal do Cliente
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
