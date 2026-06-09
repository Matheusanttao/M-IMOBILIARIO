'use client'

import { Suspense, useEffect, useState, useCallback, type ChangeEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cloudinaryConfigured, uploadImageToCloudinary } from '@/services/cloudinary'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'

const financiamentoSchema = z.object({
  titulo: z.string(),
  url: z.string().url('URL inválida').or(z.literal('')),
})

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
  financiamentos: z.array(financiamentoSchema),
  quem_somos_titulo: z.string().nullable(),
  quem_somos_texto: z.string().nullable(),
  quem_somos_imagem_url: z.string().url('URL inválida').or(z.literal('')).nullable(),
  politica_privacidade_titulo: z.string().nullable(),
  politica_privacidade_texto: z.string().nullable(),
  logo_url: z.string().url('URL inválida').or(z.literal('')).nullable(),
})

type ConfigForm = z.infer<typeof configSchema>

const FIELDS_SELECT =
  'id,nome,slug,email,telefone,whatsapp,endereco,cidade,estado,documento,cor_primaria,cor_secundaria,instagram,facebook,financiamentos,quem_somos_titulo,quem_somos_texto,quem_somos_imagem_url,politica_privacidade_titulo,politica_privacidade_texto,logo_url'

function normalizeFinanciamentos(
  value: unknown,
  fallbackUrl?: string | null,
): { titulo: string; url: string }[] {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const titulo = typeof row.titulo === 'string' ? row.titulo : ''
        const url = typeof row.url === 'string' ? row.url : ''
        return titulo || url ? { titulo, url } : null
      })
      .filter((item): item is { titulo: string; url: string } => Boolean(item))
    if (rows.length) return rows
  }

  if (fallbackUrl) {
    return [{ titulo: 'Simular financiamento', url: fallbackUrl }]
  }

  return []
}

function AdminConfigPageInner() {
  const supabase = createClient()
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
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
      financiamentos: [],
      quem_somos_titulo: '',
      quem_somos_texto: '',
      quem_somos_imagem_url: '',
      politica_privacidade_titulo: '',
      politica_privacidade_texto: '',
      logo_url: '',
    },
  })

  const {
    fields: financiamentoFields,
    append: appendFinanciamento,
    remove: removeFinanciamento,
  } = useFieldArray({
    control,
    name: 'financiamentos',
  })

  const corPrimaria = watch('cor_primaria')
  const corSecundaria = watch('cor_secundaria')
  const logoUrl = watch('logo_url')

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
      financiamentos: normalizeFinanciamentos(data.financiamentos),
      quem_somos_titulo: data.quem_somos_titulo ?? '',
      quem_somos_texto: data.quem_somos_texto ?? '',
      quem_somos_imagem_url: data.quem_somos_imagem_url ?? '',
      politica_privacidade_titulo: data.politica_privacidade_titulo ?? '',
      politica_privacidade_texto: data.politica_privacidade_texto ?? '',
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

    const payload: Record<string, unknown> = {
      ...values,
      financiamentos: values.financiamentos
        .map((item) => ({
          titulo: item.titulo.trim(),
          url: item.url.trim(),
        }))
        .filter((item) => item.titulo && item.url),
    }
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

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!cloudinaryConfigured()) {
      setFeedback({
        type: 'error',
        message: 'Configure Cloudinary no .env para enviar a logo.',
      })
      return
    }

    setUploadingLogo(true)
    setFeedback(null)
    try {
      const uploaded = await uploadImageToCloudinary(file)
      setValue('logo_url', uploaded.secure_url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setFeedback({
        type: 'success',
        message: 'Logo enviada. Clique em Salvar Configurações para gravar.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar a logo.',
      })
    } finally {
      setUploadingLogo(false)
    }
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
                label="URL do Logo (100x100 px)"
                type="url"
                placeholder="https://..."
                {...register('logo_url')}
                error={errors.logo_url?.message}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90">
                  {uploadingLogo ? 'Enviando...' : 'Selecionar logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={handleLogoUpload}
                  />
                </label>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Prévia do logo"
                    className="size-16 rounded-xl border border-slate-200 object-contain"
                  />
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted">
                Use uma imagem quadrada. Ao selecionar, ela é enviada ao Cloudinary e a URL é preenchida automaticamente.
              </p>
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

        {/* Quem Somos */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Quem Somos
          </h2>
          <div className="space-y-5">
            <Input
              label="Título da página"
              placeholder="Sobre nós"
              {...register('quem_somos_titulo')}
              error={errors.quem_somos_titulo?.message}
            />
            <Input
              label="Foto do Quem Somos"
              type="url"
              placeholder="https://..."
              {...register('quem_somos_imagem_url')}
              error={errors.quem_somos_imagem_url?.message}
            />
            <Textarea
              label="Texto da página"
              rows={7}
              placeholder="Conte a história da imobiliária, diferenciais e forma de atendimento..."
              {...register('quem_somos_texto')}
              error={errors.quem_somos_texto?.message}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            Este conteúdo aparece na aba Sobre nós do site público.
          </p>
        </section>

        {/* Política de Privacidade */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Política de Privacidade
          </h2>
          <div className="space-y-5">
            <Input
              label="Título da página"
              placeholder="Política de Privacidade"
              {...register('politica_privacidade_titulo')}
              error={errors.politica_privacidade_titulo?.message}
            />
            <Textarea
              label="Texto da política"
              rows={9}
              placeholder="Informe como os dados dos visitantes e clientes são coletados, usados e protegidos..."
              {...register('politica_privacidade_texto')}
              error={errors.politica_privacidade_texto?.message}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            Este conteúdo aparece na página Política de Privacidade do site público.
          </p>
        </section>

        {/* Links */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-semibold text-primary">
            Links do Site
          </h2>
          <div className="space-y-4">
            {financiamentoFields.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted">
                Nenhuma opção de financiamento cadastrada.
              </p>
            ) : null}

            {financiamentoFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_1.4fr_auto]"
              >
                <Input
                  label="Nome"
                  placeholder="Ex.: Caixa"
                  {...register(`financiamentos.${index}.titulo`)}
                  error={errors.financiamentos?.[index]?.titulo?.message}
                />
                <Input
                  label="Link"
                  type="url"
                  placeholder="https://..."
                  {...register(`financiamentos.${index}.url`)}
                  error={errors.financiamentos?.[index]?.url?.message}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeFinanciamento(index)}
                    title="Remover financiamento"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => appendFinanciamento({ titulo: '', url: '' })}
            >
              <Plus className="size-4" />
              Adicionar financiamento
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Cadastre quantas opções quiser. Elas aparecem no site para o cliente escolher.
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
