import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import type { PropertyImageRow } from '@/types'

import 'swiper/css'
import 'swiper/css/pagination'

export function PropertyGallery({ images }: { images: PropertyImageRow[] }) {
  const sorted = useMemo(() => {
    const list = [...images]
    list.sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
    return list
  }, [images])

  if (!sorted.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        Sem imagens cadastradas
      </div>
    )
  }

  return (
    <Swiper
      modules={[Pagination]}
      pagination={{ clickable: true }}
      className="property-gallery overflow-hidden rounded-2xl shadow-lg"
    >
      {sorted.map((img) => (
        <SwiperSlide key={img.id}>
          <div className="aspect-[16/10] bg-slate-100">
            <img
              src={img.image_url}
              alt=""
              className="size-full object-cover"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
