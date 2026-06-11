'use client'

import { MessageCircle } from 'lucide-react'
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
      className="fixed bottom-4 right-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
    >
      <MessageCircle className="size-7" />
    </a>
  )
}
