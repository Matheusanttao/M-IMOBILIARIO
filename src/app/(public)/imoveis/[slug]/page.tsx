import type { Metadata } from 'next'
import { ImovelDetailView } from '@/components/public/ImovelDetailView'

export const metadata: Metadata = {
  title: 'Detalhe do imóvel',
}

export default function ImovelSlugPage() {
  return <ImovelDetailView />
}
