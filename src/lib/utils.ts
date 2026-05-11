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
  images: { image_url: string; is_cover: boolean }[] | undefined,
): string | null {
  if (!images?.length) return null
  const cover = images.find((i) => i.is_cover)
  return cover?.image_url ?? images[0]?.image_url ?? null
}

export function buildWhatsAppUrl(phoneDigits: string, text: string) {
  const n = phoneDigits.replace(/\D/g, '')
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${n}?text=${encoded}`
}
