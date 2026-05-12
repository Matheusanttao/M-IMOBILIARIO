import { Suspense } from 'react'
import { ImoveisListing } from '@/components/public/ImoveisListing'

export default function ImoveisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-surface">
          Carregando…
        </div>
      }
    >
      <ImoveisListing />
    </Suspense>
  )
}
