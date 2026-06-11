'use client'

import { buildWhatsAppUrl } from '@/lib/utils'
import { useTenant } from '@/contexts/TenantContext'

const envWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

export function WhatsAppFloatingButton() {
  const { whatsapp, empresaNome } = useTenant()
  const wa = whatsapp?.replace(/\D/g, '') || envWa.replace(/\D/g, '')

  if (!wa) return null

  return (
    <a
      href={buildWhatsAppUrl(
        wa,
        `Olá, ${empresaNome}! Gostaria de mais informações sobre os imóveis.`,
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:bg-accent-hover"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-7 fill-current"
      >
        <path d="M16.01 3.2A12.73 12.73 0 0 0 5.08 22.45L3.2 29.33l7.04-1.85A12.73 12.73 0 1 0 16.01 3.2Zm0 23.3c-2.02 0-4-.58-5.7-1.68l-.41-.26-4.18 1.1 1.12-4.08-.27-.42A10.56 10.56 0 1 1 16 26.5Zm5.78-7.9c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.54 1.13 3.03 1.28 3.24.16.21 2.22 3.38 5.38 4.74.75.32 1.34.52 1.8.66.76.24 1.45.21 1.99.13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  )
}
