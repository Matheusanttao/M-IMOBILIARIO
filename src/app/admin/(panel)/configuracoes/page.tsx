'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

const configSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  slug: z.string(),
  email: z.string().email('E-mail inválido').or(z.literal('')).nullable(),
  telefone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  endereco: z.string().nullable(),
  cidade: z.string().nullable(),
  estado: z
    .string()
    .max(2, 'Use a sigla do estado (ex: SP)')
    .nullable(),
  documento: z.string().nullable(),
  cor_primaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  cor_secundaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  financiamento_url: z.string().url('URL inválida').or(z.literal('')).nullable(),
  logo_url: z.string().url('URL inválida').or(z.literal('')).nullable(),
})

type ConfigForm = z.infer<typeof configSchema>

const FIELDS_SELECT =
  'id,nome,slug,email,telefone,whatsapp,endereco,cidade,estado,documento,cor_primaria,cor_secundaria,instagram,facebook,financiamento_url,logo_url'

function AdminConfigPageInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nome: '',
      slug: '',
      email: '',
      telefone: '',
      whatsapp: '',
      endereco: '',
      cidade: '',
      estado: '',
      documento: '',
      cor_primaria: '#1a365d',
      cor_secundaria: '#d4a853',
      instagram: '',
      facebook: '',
      financiamento_url: '',
      logo_url: '',
    },
  })

  const corPrimaria = watch('cor_primaria')
  const corSecundaria = watch('cor_secundaria')

  const loadEmpresa = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('empresas')
      .select(FIELDS_SELECT)
      .maybeSingle()

    if (error || !data) {
      setFeedback({
        type: 'error',
        message: error?.message ?? 'Empresa não encontrada.',
      })
      setLoading(false)
      return
    }

    setEmpresaId(data.id)
    reset({
      nome: data.nome ?? '',
      slug: data.slug ?? '',
      email: data.email ?? '',
      telefone: data.telefone ?? '',
      whatsapp: data.whatsapp ?? '',
      endereco: data.endereco ?? '',
      cidade: data.cidade ?? '',
      estado: data.estado ?? '',
      documento: data.documento ?? '',
      cor_primaria: data.cor_primaria ?? '#1a365d',
      cor_secundaria: data.cor_secundaria ?? '#d4a853',
      instagram: data.instagram ?? '',
      facebook: data.facebook ?? '',
      financiamento_url: data.financiamento_url ?? '',
      logo_url: data.logo_url ?? '',
    })
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadEmpresa()
  }, [loadEmpresa])

  const onSubmit = async (values: ConfigForm) => {
    if (!empresaId) return
    setFeedback(null)

    const payload: Record<string, unknown> = { ...values }
    delete payload.slug
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') payload[key] = null
    }

    const { error } = await supabase
      .from('empresas')
      .update(payload)
      .eq('id', empresaId)

    if (error) {
      setFeedback({ type: 'error', message: error.message })
      return
    }

    setFeedback({ type: 'success', message: 'Configurações salvas!' })
    reset(values)
    setTimeout(() => setFeedback(null), 4000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {searchParams?.get('inadimplente') ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sua assinatura está <strong>inadimplente</strong>. Entre em contato
          com o atendimento para regularizar o acesso ao painel completo.
        </div>
      ) : null}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">
          Configurações
        </h1>
        <p className="mt-2 text-muted">
          Dados gerais da empresa e personalização visual.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Dados Principais */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Dados Principais
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Nome da empresa"
              {...register('nome')}
              error={errors.nome?.message}
            />
            <Input
              label="Slug"
              {...register('slug')}
              readOnly
              className="cursor-not-allowed bg-slate-50 text-slate-500"
              error={errors.slug?.message}
            />
            <Input
              label="CNPJ / Documento"
              placeholder="00.000.000/0001-00"
              {...register('documento')}
              error={errors.documento?.message}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Telefone"
              placeholder="(00) 0000-0000"
              {...register('telefone')}
              error={errors.telefone?.message}
            />
            <Input
              label="WhatsApp"
              placeholder="(00) 00000-0000"
              {...register('whatsapp')}
              error={errors.whatsapp?.message}
            />
          </div>
        </section>

        {/* Endereço */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">Endereço</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Endereço"
                placeholder="Rua, número, complemento"
                {...register('endereco')}
                error={errors.endereco?.message}
              />
            </div>
            <Input
              label="Cidade"
              {...register('cidade')}
              error={errors.cidade?.message}
            />
            <Input
              label="Estado (UF)"
              placeholder="SP"
              maxLength={2}
              {...register('estado')}
              error={errors.estado?.message}
            />
          </div>
        </section>

        {/* Visual */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Identidade Visual
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 text-left">
              <label className="block text-sm font-medium text-slate-700">
                Cor Primária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('cor_primaria')}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                />
                <Input
                  {...register('cor_primaria')}
                  className="font-mono text-sm"
                  error={errors.cor_primaria?.message}
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="block text-sm font-medium text-slate-700">
                Cor Secundária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('cor_secundaria')}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                />
                <Input
                  {...register('cor_secundaria')}
                  className="font-mono text-sm"
                  error={errors.cor_secundaria?.message}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Input
                label="URL do Logo"
                type="url"
                placeholder="https://..."
                {...register('logo_url')}
                error={errors.logo_url?.message}
              />
            </div>

            {/* Preview */}
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Pré-visualização
              </p>
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  P
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: corSecundaria,
                    color: corPrimaria,
                  }}
                >
                  S
                </div>
                <span className="text-sm text-muted">
                  Primária / Secundária
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Links do Site
          </h2>
          <Input
            label="Link de financiamento"
            type="url"
            placeholder="https://..."
            {...register('financiamento_url')}
            error={errors.financiamento_url?.message}
          />
          <p className="mt-2 text-sm text-muted">
            Quando preenchido, o botão Financiamento aparece no site e redireciona para este link.
          </p>
        </section>

        {/* Redes Sociais */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Redes Sociais
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Instagram"
              placeholder="@sua_imobiliaria"
              {...register('instagram')}
              error={errors.instagram?.message}
            />
            <Input
              label="Facebook"
              placeholder="https://facebook.com/..."
              {...register('facebook')}
              error={errors.facebook?.message}
            />
          </div>
        </section>

        {/* Feedback + Save */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty}
            className="gap-2"
          >
            <Save className="size-4" />
            Salvar Configurações
          </Button>

          {feedback && (
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                feedback.type === 'success'
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              {feedback.message}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default function AdminConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <AdminConfigPageInner />
    </Suspense>
  )
}
