'use client'

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperClass } from 'swiper'
import { Keyboard, Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules'
import { ChevronLeft, ChevronRight, Expand, ImageIcon, X } from 'lucide-react'
import type { ImovelImagemRow } from '@/types'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'

const PLACEHOLDER_IMAGE = '/placeholder-imovel.jpg'

function safeImageUrl(url: string | null | undefined) {
  const value = url?.trim()
  if (!value) return PLACEHOLDER_IMAGE
  return value
}

function fallbackImage(e: SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget
  if (target.src.endsWith(PLACEHOLDER_IMAGE)) return
  target.src = PLACEHOLDER_IMAGE
}

export function PropertyGallery({ images }: { images: ImovelImagemRow[] }) {
  const sorted = useMemo(() => {
    const list = [...images]
    list.sort(
      (a, b) => Number(b.is_capa) - Number(a.is_capa) || a.ordem - b.ordem,
    )
    return list
  }, [images])

  const [thumbs, setThumbs] = useState<SwiperClass | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!sorted.length) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-card text-white/45">
        <ImageIcon className="size-10 text-white/25" />
        <span className="text-sm">Sem imagens cadastradas</span>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl shadow-black/40">
        <Swiper
          modules={[Navigation, Pagination, Thumbs, Keyboard]}
          thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}
          navigation={{
            prevEl: '.gallery-prev',
            nextEl: '.gallery-next',
          }}
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          className="property-gallery aspect-[16/10]"
        >
          {sorted.map((img) => (
            <SwiperSlide key={img.id}>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block size-full cursor-zoom-in"
                aria-label="Ampliar imagem"
              >
                <img
                  src={safeImageUrl(img.url)}
                  alt="Imagem do imóvel"
                  onError={fallbackImage}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
          <ImageIcon className="size-3.5 text-accent" />
          {activeIndex + 1} / {sorted.length}
        </span>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-md transition hover:border-accent/60 hover:text-accent"
          aria-label="Ver em tela cheia"
        >
          <Expand className="size-4" />
        </button>

        <button
          type="button"
          className="gallery-prev absolute left-4 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 backdrop-blur-md transition hover:border-accent/60 hover:text-accent group-hover:opacity-100"
          aria-label="Imagem anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          className="gallery-next absolute right-4 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 backdrop-blur-md transition hover:border-accent/60 hover:text-accent group-hover:opacity-100"
          aria-label="Próxima imagem"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {sorted.length > 1 ? (
        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbs}
          watchSlidesProgress
          slidesPerView={4}
          spaceBetween={10}
          breakpoints={{
            640: { slidesPerView: 5 },
            1024: { slidesPerView: 6 },
          }}
          className="property-thumbs"
        >
          {sorted.map((img) => (
            <SwiperSlide key={img.id} className="!h-auto">
              <div className="aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-white/10 opacity-55 transition hover:opacity-90">
                <img
                  src={safeImageUrl(img.url)}
                  alt="Miniatura do imóvel"
                  onError={fallbackImage}
                  className="size-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}

      {lightboxOpen ? (
        <Lightbox
          images={sorted}
          startIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  )
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: ImovelImagemRow[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 text-white/85">
        <span className="text-sm font-medium tracking-wide">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:border-accent/60 hover:text-accent"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Swiper
          modules={[Navigation, Zoom, Keyboard]}
          initialSlide={startIndex}
          zoom
          keyboard={{ enabled: true }}
          navigation={{ prevEl: '.lb-prev', nextEl: '.lb-next' }}
          onSlideChange={(s) => setIndex(s.activeIndex)}
          className="size-full"
        >
          {images.map((img) => (
            <SwiperSlide key={img.id} className="flex items-center justify-center">
              <div className="swiper-zoom-container flex size-full items-center justify-center p-4">
                <img
                  src={safeImageUrl(img.url)}
                  alt="Imagem ampliada do imóvel"
                  onError={fallbackImage}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          className="lb-prev absolute left-4 top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-accent/60 hover:text-accent"
          aria-label="Imagem anterior"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          className="lb-next absolute right-4 top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-accent/60 hover:text-accent"
          aria-label="Próxima imagem"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
