'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Bath,
  Bed,
  Car,
  Check,
  Eye,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  PlayCircle,
  Share2,
  Sofa,
  Sparkles,
  Video,
} from 'lucide-react'
import { useImovel } from '@/hooks/useImovel'
import { PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { buildWhatsAppUrl, formatCurrencyBRL } from '@/lib/utils'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { LeadForm } from '@/components/forms/LeadForm'
import { MapaImoveis } from '@/components/mapa/MapaImoveis'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useTenant } from '@/contexts/TenantContext'
import { addFavorite } from '@/services/favoritos'
import { incrementImovelVisualizacoes } from '@/services/imoveis'

const envWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

export function ImovelDetailView() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const { empresaId, whatsapp: tenantWa } = useTenant()
  const { imovel, loading, error } = useImovel(slug)

  const wa = tenantWa?.replace(/\D/g, '') || envWa.replace(/\D/g, '')
  const [pageUrl, setPageUrl] = useState('')
  const [favoriteStatus, setFavoriteStatus] = useState<string | null>(null)
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    setPageUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

  useEffect(() => {
    if (!imovel?.id || typeof window === 'undefined') return

    const key = `imovel_viewed:${imovel.id}`
    if (window.sessionStorage.getItem(key)) return

    window.sessionStorage.setItem(key, '1')
    incrementImovelVisualizacoes(imovel.id).catch(() => {
      window.sessionStorage.removeItem(key)
    })
  }, [imovel?.id])

  useEffect(() => {
    if (!imovel) return
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: imovel.titulo,
      description: (imovel.descricao ?? '').slice(0, 5000),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      offers: {
        '@type': 'Offer',
        price: imovel.preco,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: imovel.cidade,
        streetAddress: imovel.endereco ?? undefined,
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'imovel-jsonld'
    script.text = JSON.stringify(schema)
    const existing = document.getElementById('imovel-jsonld')
    existing?.remove()
    document.head.appendChild(script)
    return () => {
      document.getElementById('imovel-jsonld')?.remove()
    }
  }, [imovel])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-sm text-white/60">Carregando imóvel…</p>
      </div>
    )
  }

  if (error || !imovel) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg text-red-200">{error ?? 'Imóvel não encontrado.'}</p>
        <Link
          href="/imoveis"
          className="mt-6 inline-block font-medium text-accent underline"
        >
          Voltar para listagem
        </Link>
      </div>
    )
  }

  const images = imovel.imovel_imagens ?? []
  const titulo = imovel.titulo
  const imovelId = imovel.id
  const waText = `Olá! Tenho interesse no imóvel: ${titulo} (${pageUrl || ''})`
  const waUrl = wa ? buildWhatsAppUrl(wa, waText) : '#'
  const isAluguel = imovel.finalidade === 'aluguel'
  const hasCoordinates = imovel.latitude != null && imovel.longitude != null

  const specs = [
    {
      icon: Maximize2,
      label: 'Área',
      value: imovel.area != null ? `${imovel.area}` : '—',
      suffix: imovel.area != null ? 'm²' : '',
    },
    { icon: Bed, label: 'Quartos', value: String(imovel.quartos), suffix: '' },
    ...(imovel.suites > 0
      ? [{ icon: Sofa, label: 'Suítes', value: String(imovel.suites), suffix: '' }]
      : []),
    { icon: Bath, label: 'Banheiros', value: String(imovel.banheiros), suffix: '' },
    { icon: Car, label: 'Vagas', value: String(imovel.vagas), suffix: '' },
  ]

  async function addFavorito() {
    const source = await addFavorite(imovelId)
    setFavorited(true)
    setFavoriteStatus(
      source === 'database'
        ? 'Favorito salvo na sua conta.'
        : 'Favorito salvo neste navegador.',
    )
  }

  function shareNative() {
    if (navigator.share && pageUrl) {
      void navigator.share({ title: titulo, url: pageUrl })
    } else if (pageUrl) {
      void navigator.clipboard.writeText(pageUrl)
      alert('Link copiado.')
    }
  }

  return (
    <div className="relative overflow-hidden bg-background pb-16 pt-6 sm:pb-24 sm:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-white/45">
          <Link href="/" className="transition hover:text-accent">
            Início
          </Link>
          <span>/</span>
          <Link href="/imoveis" className="transition hover:text-accent">
            Imóveis
          </Link>
          <span>/</span>
          <span className="truncate text-white/75">{imovel.titulo}</span>
        </nav>

        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <PropertyGallery images={images} />

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                <Sparkles className="size-3.5" />
                {PURPOSE_LABELS[imovel.finalidade]}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                {PROPERTY_TYPE_LABELS[imovel.tipo]}
              </span>
              {imovel.destaque ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                  <Sparkles className="size-3.5" />
                  Destaque
                </span>
              ) : null}
              {typeof imovel.visualizacoes === 'number' &&
              imovel.visualizacoes > 0 ? (
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/45">
                  <Eye className="size-3.5" />
                  {imovel.visualizacoes} visualizações
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {imovel.titulo}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-white/60">
              <MapPin className="size-4 shrink-0 text-accent" />
              <span>
                {imovel.endereco ? `${imovel.endereco}, ` : ''}
                {imovel.bairro}, {imovel.cidade}
              </span>
            </p>

            <div className="mt-6 flex items-end gap-2">
              <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                {formatCurrencyBRL(imovel.preco)}
              </p>
              {isAluguel ? (
                <span className="mb-1.5 text-sm text-white/50">/ mês</span>
              ) : null}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {specs.map((item) => (
                <div
                  key={item.label}
                  className="group rounded-2xl border border-white/10 bg-card/80 p-4 transition hover:border-accent/40 hover:bg-card-hover"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                    <item.icon className="size-5" />
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-wide text-white/45">
                    {item.label}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-white">
                    {item.value}
                    {item.suffix ? (
                      <span className="ml-1 text-xs font-normal text-white/50">
                        {item.suffix}
                      </span>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>

            {imovel.video_url || imovel.tour_virtual_url ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {imovel.video_url ? (
                  <a
                    href={imovel.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-accent/40 hover:text-accent"
                  >
                    <PlayCircle className="size-4 text-accent" />
                    Ver vídeo
                  </a>
                ) : null}
                {imovel.tour_virtual_url ? (
                  <a
                    href={imovel.tour_virtual_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-accent/40 hover:text-accent"
                  >
                    <Video className="size-4 text-accent" />
                    Tour virtual 360°
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="mt-10 rounded-2xl border border-white/10 bg-card/60 p-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Sobre o imóvel
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-white/65">
                {imovel.descricao ?? 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addFavorito}
                className="gap-2"
              >
                <Heart
                  className={`size-4 ${favorited ? 'fill-current text-red-400' : ''}`}
                />
                {favorited ? 'Favoritado' : 'Favoritar'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={shareNative}
                className="gap-2"
              >
                <Share2 className="size-4" />
                Compartilhar
              </Button>
              <Link
                href="/comparar"
                className="text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Adicionar ao comparador
              </Link>
            </div>
            {favoriteStatus ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-300/90">
                <Check className="size-4" />
                {favoriteStatus}
              </p>
            ) : null}

            {hasCoordinates ? (
              <div className="mt-10">
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-white">
                  <MapPin className="size-5 text-accent" />
                  Localização
                </h2>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <MapaImoveis
                    imoveis={[
                      {
                        id: imovel.id,
                        titulo: imovel.titulo,
                        latitude: imovel.latitude,
                        longitude: imovel.longitude,
                        slug: imovel.slug,
                      },
                    ]}
                    height="340px"
                  />
                </div>
                <p className="mt-3 text-sm text-white/55">
                  Localização aproximada: {imovel.bairro}, {imovel.cidade}.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <Card className="overflow-hidden border-white/10 bg-card shadow-2xl shadow-black/40">
                <div className="border-b border-white/10 bg-gradient-to-br from-accent/15 via-transparent to-transparent px-6 py-5">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    {isAluguel ? 'Valor do aluguel' : 'Valor de venda'}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-white">
                    {formatCurrencyBRL(imovel.preco)}
                  </p>
                </div>
                <CardContent className="space-y-3">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                    Fale com um corretor
                  </h2>
                  {wa ? (
                    <a href={waUrl} target="_blank" rel="noreferrer">
                      <Button
                        variant="accent"
                        className="w-full gap-2"
                        type="button"
                      >
                        <MessageCircle className="size-5" />
                        Conversar no WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <p className="text-sm text-white/60">
                      WhatsApp indisponível no momento. Envie sua mensagem pelo
                      formulário abaixo.
                    </p>
                  )}
                  <p className="text-center text-xs text-white/45">
                    Resposta rápida em horário comercial
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-card shadow-2xl shadow-black/40">
                <CardContent className="pt-6">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Tenho interesse
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Deixe seus dados e retornaremos o quanto antes.
                  </p>
                  <div className="mt-4">
                    <LeadForm imovelId={imovel.id} empresaId={empresaId} />
                  </div>
                </CardContent>
              </Card>

              {pageUrl ? (
                <Card className="border-white/10 bg-card shadow-xl shadow-black/30">
                  <CardContent className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2">
                      <QRCodeSVG value={pageUrl} size={84} level="M" />
                    </div>
                    <p className="text-sm text-white/60">
                      Aponte a câmera para abrir esta página no celular.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
