import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDatePt(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function getCoverImage(
  images:
    | {
        url?: string
        image_url?: string
        is_capa?: boolean
        is_cover?: boolean
      }[]
    | undefined,
): string | null {
  if (!images?.length) return null
  const cover = images.find((i) => i.is_capa ?? i.is_cover)
  const first = images[0]
  return (
    (cover?.url ?? cover?.image_url ?? first?.url ?? first?.image_url) ?? null
  )
}

export function buildWhatsAppUrl(phoneDigits: string, text: string) {
  const n = phoneDigits.replace(/\D/g, '')
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${n}?text=${encoded}`
}
