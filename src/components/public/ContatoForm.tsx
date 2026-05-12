'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageCircle, Mail, MapPin, Phone } from 'lucide-react'
import { contatoSchema, type ContatoFormValues } from '@/lib/validators'
import { createClient } from '@/lib/supabase/client'
import { buildWhatsAppUrl } from '@/lib/utils'
import { useTenant } from '@/contexts/TenantContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function ContatoForm() {
  const { empresaId, empresaNome, whatsapp } = useTenant()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContatoFormValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: { nome: '', email: '', telefone: '', mensagem: '' },
  })

  async function onSubmit(data: ContatoFormValues) {
    setServerError(null)
    setSuccess(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('leads').insert({
        empresa_id: empresaId,
        imovel_id: null,
        name: data.nome,
        phone: data.telefone,
        email: data.email,
        message: data.mensagem,
        origem: 'contato',
        status: 'novo',
      })
      if (error) throw error
      setSuccess(true)
      reset()
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : 'Não foi possível enviar sua mensagem.',
      )
    }
  }

  const waDigits = whatsapp?.replace(/\D/g, '') ?? ''

  return (
    <div className="grid gap-12 lg:grid-cols-5">
      {/* Form */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
          <h2 className="font-display text-xl font-semibold text-primary">
            Envie sua mensagem
          </h2>
          <p className="mt-1 text-sm text-muted">
            Preencha o formulário e retornaremos em breve.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input
              label="Nome"
              placeholder="Seu nome completo"
              {...register('nome')}
              error={errors.nome?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                {...register('telefone')}
                error={errors.telefone?.message}
              />
            </div>
            <Textarea
              label="Mensagem"
              rows={5}
              placeholder="Como podemos ajudar?"
              {...register('mensagem')}
              error={errors.mensagem?.message}
            />

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </p>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <strong>Mensagem enviada!</strong> Em breve entraremos em contato.
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>
              <Mail className="size-4" />
              Enviar mensagem
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar — contact info */}
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h3 className="font-display text-lg font-semibold text-primary">
            Informações de contato
          </h3>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            {waDigits && (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <span className="block font-medium text-slate-800">WhatsApp</span>
                  <a
                    href={buildWhatsAppUrl(
                      waDigits,
                      `Olá, ${empresaNome}! Gostaria de mais informações.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {whatsapp}
                  </a>
                </div>
              </li>
            )}
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <span className="block font-medium text-slate-800">Endereço</span>
                <span>Consulte nosso escritório para mais detalhes.</span>
              </div>
            </li>
          </ul>
        </div>

        {waDigits && (
          <a
            href={buildWhatsAppUrl(
              waDigits,
              `Olá, ${empresaNome}! Gostaria de mais informações.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
          >
            <MessageCircle className="size-5" />
            Falar pelo WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
