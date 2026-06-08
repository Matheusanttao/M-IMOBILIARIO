'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Bath,
  Bed,
  Car,
  MapPin,
  Maximize2,
  MessageCircle,
  Tag,
} from 'lucide-react'
import { useImovel } from '@/hooks/useImovel'
import { PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { buildWhatsAppUrl, formatCurrencyBRL } from '@/lib/utils'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { LeadForm } from '@/components/forms/LeadForm'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useTenant } from '@/contexts/TenantContext'

const envWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

export function ImovelDetailView() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const { empresaId, whatsapp: tenantWa } = useTenant()
  const { imovel, loading, error } = useImovel(empresaId, slug)

  const wa = tenantWa?.replace(/\D/g, '') || envWa.replace(/\D/g, '')
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    setPageUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-background">
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

  function addFavorito() {
    const key = 'mimob_fav_ids'
    const raw = localStorage.getItem(key)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(imovelId)) {
      ids.push(imovelId)
      localStorage.setItem(key, JSON.stringify(ids))
    }
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
    <div className="bg-background pb-16 pt-8 sm:pb-24 sm:pt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/" className="hover:text-accent">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link href="/imoveis" className="hover:text-accent">
            Imóveis
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/75">{imovel.titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <PropertyGallery images={images} />
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge
                variant="accent"
                className="border-accent/50 bg-accent/15 text-accent"
              >
                {PURPOSE_LABELS[imovel.finalidade]}
              </Badge>
              <Badge className="border-white/15 bg-white/5 text-white/75">
                {PROPERTY_TYPE_LABELS[imovel.tipo]}
              </Badge>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              {imovel.titulo}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-white/60">
              <MapPin className="size-4" />
              {imovel.endereco ? `${imovel.endereco}, ` : ''}
              {imovel.bairro}, {imovel.cidade}
            </p>
            <p className="mt-6 font-display text-4xl font-bold text-white">
              {formatCurrencyBRL(imovel.preco)}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  icon: Maximize2,
                  label: 'Área',
                  value: imovel.area != null ? `${imovel.area} m²` : '—',
                },
                { icon: Bed, label: 'Quartos', value: String(imovel.quartos) },
                { icon: Bath, label: 'Banheiros', value: String(imovel.banheiros) },
                { icon: Car, label: 'Vagas', value: String(imovel.vagas) },
              ].map((item) => (
                <Card key={item.label} className="border-white/10 bg-card shadow-xl shadow-black/10">
                  <CardContent className="flex flex-col items-center py-4 text-center">
                    <item.icon className="size-5 text-accent" />
                    <span className="mt-1 text-xs uppercase tracking-wide text-white/50">
                      {item.label}
                    </span>
                    <span className="mt-1 font-semibold text-white">{item.value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-white">Descrição</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-white/62">
                {imovel.descricao ?? 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={addFavorito}>
                Favoritar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={shareNative}>
                Compartilhar
              </Button>
              <Link href="/comparar" className="text-sm font-medium text-accent underline">
                Comparador
              </Link>
            </div>

            {pageUrl ? (
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-4">
                <div className="rounded-xl bg-white p-2">
                  <QRCodeSVG value={pageUrl} size={96} level="M" />
                </div>
                <p className="text-sm text-white/60">QR Code desta página — divulgue em vitrines e mídias.</p>
              </div>
            ) : null}

            <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              <Tag className="mx-auto mb-2 size-6 text-accent" />
              Localização aproximada: {imovel.cidade}, {imovel.bairro}.
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 border-white/10 bg-card shadow-xl shadow-black/20">
              <CardContent className="space-y-4 pt-6">
                <h2 className="font-display text-lg font-semibold text-white">
                  Contato rápido
                </h2>
                {wa ? (
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <Button variant="accent" className="w-full gap-2" type="button">
                      <MessageCircle className="size-5" />
                      WhatsApp
                    </Button>
                  </a>
                ) : (
                  <p className="text-sm text-white/60">
                    WhatsApp indisponível no momento. Envie sua mensagem pelo formulário de interesse.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card shadow-xl shadow-black/20">
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
          </div>
        </div>
      </div>
    </div>
  )
}
