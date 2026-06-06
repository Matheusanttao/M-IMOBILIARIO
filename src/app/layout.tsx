import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Providers } from '@/app/providers'
import '@/app/globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'M. Imobiliário — Plataforma SaaS',
    template: '%s | M. Imobiliário',
  },
  description:
    'Encontre imóveis para venda e aluguel. Plataforma imobiliária moderna com CRM, leads e multiempresa.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'M. Imobiliário',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'M. Imobiliário',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
