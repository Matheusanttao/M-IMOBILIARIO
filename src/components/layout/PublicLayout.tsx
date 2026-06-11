import type { ReactNode } from 'react'
import { ConfigBanner } from '@/components/layout/ConfigBanner'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFloatingButton } from '@/components/public/WhatsAppFloatingButton'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ConfigBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  )
}
