import { Link, useParams } from 'react-router-dom'
import {
  Bath,
  Bed,
  Car,
  MapPin,
  Maximize2,
  MessageCircle,
  Tag,
} from 'lucide-react'
import { useProperty } from '@/hooks/useProperty'
import { PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { buildWhatsAppUrl, formatCurrencyBRL } from '@/lib/utils'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { LeadForm } from '@/components/forms/LeadForm'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const wa = import.meta.env.VITE_WHATSAPP_NUMBER ?? ''

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const { property, loading, error } = useProperty(id)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-surface">
        <Spinner size="lg" />
        <p className="text-sm text-muted">Carregando imóvel…</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg text-red-700">{error ?? 'Imóvel não encontrado.'}</p>
        <Link
          to="/imoveis"
          className="mt-6 inline-block font-medium text-primary underline hover:text-accent"
        >
          Voltar para listagem
        </Link>
      </div>
    )
  }

  const images = property.property_images ?? []
  const waText = `Olá! Tenho interesse no imóvel: ${property.title} (${window.location.href})`
  const waUrl = wa ? buildWhatsAppUrl(wa, waText) : '#'

  return (
    <div className="bg-surface pb-16 pt-8 sm:pb-24 sm:pt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-muted">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link to="/imoveis" className="hover:text-primary">
            Imóveis
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{property.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <PropertyGallery images={images} />
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="accent">{PURPOSE_LABELS[property.purpose]}</Badge>
              <Badge>{PROPERTY_TYPE_LABELS[property.type]}</Badge>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-primary sm:text-4xl">
              {property.title}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-muted">
              <MapPin className="size-4" />
              {property.address ? `${property.address}, ` : ''}
              {property.neighborhood}, {property.city}
            </p>
            <p className="mt-6 font-display text-4xl font-bold text-primary">
              {formatCurrencyBRL(property.price)}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  icon: Maximize2,
                  label: 'Área',
                  value: property.area != null ? `${property.area} m²` : '—',
                },
                { icon: Bed, label: 'Quartos', value: String(property.bedrooms) },
                { icon: Bath, label: 'Banheiros', value: String(property.bathrooms) },
                { icon: Car, label: 'Vagas', value: String(property.parking_spaces) },
              ].map((item) => (
                <Card key={item.label} className="border-slate-100">
                  <CardContent className="flex flex-col items-center py-4 text-center">
                    <item.icon className="size-5 text-accent" />
                    <span className="mt-1 text-xs uppercase tracking-wide text-muted">
                      {item.label}
                    </span>
                    <span className="mt-1 font-semibold text-primary">{item.value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-primary">Descrição</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                {property.description ?? 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-muted">
              <Tag className="mx-auto mb-2 size-6 text-accent" />
              Mapa em breve — localização aproximada: {property.city}, {property.neighborhood}.
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 border-slate-100 shadow-lg">
              <CardContent className="space-y-4 pt-6">
                <h2 className="font-display text-lg font-semibold text-primary">
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
                  <p className="text-sm text-muted">
                    Configure <code className="rounded bg-slate-100 px-1">VITE_WHATSAPP_NUMBER</code>{' '}
                    no .env para habilitar o WhatsApp.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-lg">
              <CardContent className="pt-6">
                <h2 className="font-display text-lg font-semibold text-primary">
                  Tenho interesse
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Deixe seus dados e retornaremos o quanto antes.
                </p>
                <div className="mt-4">
                  <LeadForm propertyId={property.id} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
