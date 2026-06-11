'use client'

import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { BedDouble, CheckCircle2, Home, Images, MapPin, Upload, UserRound, X } from 'lucide-react'
import {
  createImovel,
  fetchImovelByIdForAdmin,
  replaceImovelImagens,
  updateImovel,
} from '@/services/imoveis'
import {
  fetchProprietarios,
  fetchProprietariosDoImovel,
  replaceProprietariosImovel,
} from '@/services/proprietarios'
import { uploadManyToCloudinary, cloudinaryConfigured } from '@/services/cloudinary'
import { propertyFormSchema, type PropertyFormValues } from '@/lib/validators'
import { createClient } from '@/lib/supabase/client'
import type { ImovelImagemRow, ProprietarioRow } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { PROPERTY_TYPES, PURPOSES, IMOVEL_STATUS_LABELS } from '@/lib/constants'

const statusOptions = (
  Object.entries(IMOVEL_STATUS_LABELS) as [keyof typeof IMOVEL_STATUS_LABELS, string][]
).map(([value, label]) => ({ value, label }))

const PLACEHOLDER_IMAGE = '/placeholder-imovel.jpg'
const MAX_IMAGE_SIZE_MB = 10

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

function fallbackImage(e: SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget
  if (target.src.endsWith(PLACEHOLDER_IMAGE)) return
  target.src = PLACEHOLDER_IMAGE
}

function safeImagePreviewUrl(url: string | null | undefined) {
  if (!url?.trim()) return PLACEHOLDER_IMAGE
  try {
    const parsed = new URL(url)
    if (['http:', 'https:', 'blob:'].includes(parsed.protocol)) return url
  } catch {
    return PLACEHOLDER_IMAGE
  }
  return PLACEHOLDER_IMAGE
}

interface CaptadorOption {
  id: string
  nome: string
}

export function PropertyForm() {
  const params = useParams<{ id: string }>()
  const paramId = params?.id
  const router = useRouter()
  const isNew = paramId === 'novo' || !paramId

  const [loadingProperty, setLoadingProperty] = useState(!isNew)
  const [existingImages, setExistingImages] = useState<ImovelImagemRow[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [manualImageUrls, setManualImageUrls] = useState<string[]>([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [cepStatus, setCepStatus] = useState<string | null>(null)
  const [captadores, setCaptadores] = useState<CaptadorOption[]>([])
  const [proprietarios, setProprietarios] = useState<ProprietarioRow[]>([])
  const [propertyEmpresaId, setPropertyEmpresaId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as Resolver<PropertyFormValues>,
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'apartamento',
      finalidade: 'venda',
      preco: 0,
      cep: '',
      cidade: '',
      bairro: '',
      endereco: '',
      latitude: null,
      longitude: null,
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      area: 80,
      status: 'disponivel',
      destaque: false,
      captador_id: '',
      proprietario_id: '',
      proprietario_percentual: 100,
      proprietario_principal: true,
    },
  })
  const cepValue = watch('cep') ?? ''
  const cepDigits = cepValue.replace(/\D/g, '')
  const hasCepForCoordinates = cepDigits.length >= 8

  useEffect(() => {
    if (hasCepForCoordinates) return
    setValue('latitude', null, { shouldDirty: true })
    setValue('longitude', null, { shouldDirty: true })
  }, [hasCepForCoordinates, setValue])

  useEffect(() => {
    if (cepDigits.length !== 8) {
      setCepStatus(null)
      return
    }

    const controller = new AbortController()
    setCepStatus('Buscando endereço pelo CEP...')

    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível consultar o CEP.')
        return (await response.json()) as ViaCepResponse
      })
      .then((data) => {
        if (data.erro) {
          setCepStatus('CEP não encontrado. Preencha o endereço manualmente.')
          return
        }

        if (data.localidade) {
          setValue('cidade', data.localidade, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        if (data.bairro) {
          setValue('bairro', data.bairro, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        if (data.logradouro) {
          setValue('endereco', data.logradouro, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }

        const cidadeUf = [data.localidade, data.uf].filter(Boolean).join(' - ')
        setCepStatus(
          cidadeUf
            ? `Endereço encontrado: ${cidadeUf}. Complete número e complemento, se necessário.`
            : 'Endereço encontrado. Complete os dados que faltarem.',
        )
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return
        setCepStatus('Não foi possível buscar o CEP. Preencha manualmente.')
      })

    return () => {
      controller.abort()
    }
  }, [cepDigits, setValue])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase
      .from('usuarios')
      .select('id,nome')
      .eq('role', 'captador')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (!cancelled) setCaptadores((data as CaptadorOption[]) ?? [])
      })

    fetchProprietarios({ ativo: true, pageSize: 100 })
      .then(({ rows }) => {
        if (!cancelled) setProprietarios(rows)
      })
      .catch(() => {
        if (!cancelled) setProprietarios([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isNew || !paramId) {
      setLoadingProperty(false)
      return
    }
    let cancelled = false
    Promise.all([
      fetchImovelByIdForAdmin(paramId),
      fetchProprietariosDoImovel(paramId),
    ])
      .then(([p, proprietarioLinks]) => {
        if (cancelled || !p) return
        const proprietarioLink =
          proprietarioLinks.find((link) => link.principal) ?? proprietarioLinks[0]
        setPropertyEmpresaId(p.empresa_id)
        reset({
          titulo: p.titulo,
          descricao: p.descricao ?? '',
          tipo: p.tipo,
          finalidade: p.finalidade,
          preco: p.preco,
          cep: p.cep ?? '',
          cidade: p.cidade,
          bairro: p.bairro,
          endereco: p.endereco ?? '',
          latitude: p.latitude,
          longitude: p.longitude,
          quartos: p.quartos,
          suites: p.suites,
          banheiros: p.banheiros,
          vagas: p.vagas,
          area: p.area ?? 80,
          status: p.status,
          destaque: p.destaque,
          captador_id: p.captador_id ?? '',
          proprietario_id: proprietarioLink?.proprietario_id ?? p.proprietario_id ?? '',
          proprietario_percentual: proprietarioLink?.percentual ?? 100,
          proprietario_principal: proprietarioLink?.principal ?? true,
        })
        setExistingImages(p.imovel_imagens ?? [])
      })
      .catch(() => {
        if (!cancelled) setServerError('Não foi possível carregar o imóvel.')
      })
      .finally(() => {
        if (!cancelled) setLoadingProperty(false)
      })
    return () => {
      cancelled = true
    }
  }, [isNew, paramId, reset])

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list?.length) return
    const selectedFiles = Array.from(list)
    const files = selectedFiles.filter((file) => {
      if (!file.type.startsWith('image/')) return false
      return file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024
    })
    setServerError(null)
    if (!files.length) {
      setServerError(
        `Selecione apenas imagens de até ${MAX_IMAGE_SIZE_MB}MB cada.`,
      )
      e.target.value = ''
      return
    }
    if (files.length < selectedFiles.length) {
      setServerError(
        `Alguns arquivos foram ignorados. Use apenas imagens de até ${MAX_IMAGE_SIZE_MB}MB.`,
      )
    }
    setNewFiles((prev) => [...prev, ...files])
    setUploadProgress(
      `${files.length} imagem(ns) selecionada(s). Clique em Salvar para concluir.`,
    )
    e.target.value = ''
  }

  function removeNewFile(i: number) {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addImageUrl() {
    const url = imageUrlInput.trim()
    if (!url) return

    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error()
      }
    } catch {
      setServerError('Informe uma URL de imagem válida.')
      return
    }

    const alreadyAdded = [...manualImageUrls, ...existingImages.map((img) => img.url)]
      .map((item) => item.trim().toLowerCase())
      .includes(url.toLowerCase())
    if (alreadyAdded) {
      setServerError('Esta imagem já foi adicionada.')
      return
    }

    setServerError(null)
    setManualImageUrls((prev) => [...prev, url])
    setImageUrlInput('')
  }

  function removeManualUrl(i: number) {
    setManualImageUrls((prev) => prev.filter((_, idx) => idx !== i))
  }

  function removeExisting(img: ImovelImagemRow) {
    setExistingImages((prev) => prev.filter((x) => x.id !== img.id))
  }

  async function onSubmit(data: PropertyFormValues) {
    setServerError(null)
    if (newFiles.length > 0 && !cloudinaryConfigured()) {
      setServerError('Configure Cloudinary no .env para enviar fotos.')
      return
    }
    try {
      let imovelId = paramId

      const base = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        finalidade: data.finalidade,
        preco: data.preco,
        cep: data.cep?.trim() || null,
        cidade: data.cidade,
        bairro: data.bairro,
        endereco: data.endereco || null,
        latitude: data.cep?.trim() ? data.latitude ?? null : null,
        longitude: data.cep?.trim() ? data.longitude ?? null : null,
        localizacao_aproximada: Boolean(
          data.cep?.trim() && data.latitude != null && data.longitude != null,
        ),
        quartos: data.quartos,
        suites: data.suites,
        banheiros: data.banheiros,
        vagas: data.vagas,
        area: data.area,
        status: data.status,
        destaque: data.destaque,
        proprietario_id: data.proprietario_id || null,
        captador_id: data.captador_id || null,
      }

      let empresaId = propertyEmpresaId
      if (isNew) {
        const created = await createImovel(base)
        imovelId = created.id
        empresaId = created.empresa_id
      } else if (paramId) {
        const updated = await updateImovel(paramId, base)
        imovelId = paramId
        empresaId = updated.empresa_id
      }

      if (!imovelId) throw new Error('ID do imóvel inválido.')
      if (data.proprietario_id && !empresaId) {
        throw new Error('Empresa do imóvel não encontrada para vincular proprietário.')
      }

      await replaceProprietariosImovel(
        imovelId,
        data.proprietario_id && empresaId
          ? [
              {
                empresa_id: empresaId,
                proprietario_id: data.proprietario_id,
                percentual: data.proprietario_percentual || 100,
                principal: data.proprietario_principal ?? true,
              },
            ]
          : [],
      )

      let uploaded: { secure_url: string; public_id: string }[] = []

      if (newFiles.length && cloudinaryConfigured()) {
        try {
          uploaded = await uploadManyToCloudinary(newFiles, (done, total) => {
            setUploadProgress(`Enviando fotos ${done}/${total}…`)
          })
        } catch (e) {
          setUploadProgress(null)
          throw new Error(
            e instanceof Error
              ? e.message
              : 'Cloudinary recusou o upload. Verifique se o preset está como unsigned.',
          )
        }
      }
      setUploadProgress(null)

      const rows = [
        ...existingImages.map((img) => ({
          url: img.url,
          public_id: img.public_id,
          is_capa: false,
          ordem: 0,
        })),
        ...manualImageUrls.map((url) => ({
          url,
          public_id: `manual:${url}`,
          is_capa: false,
          ordem: 0,
        })),
        ...uploaded.map((u) => ({
          url: u.secure_url,
          public_id: u.public_id,
          is_capa: false,
          ordem: 0,
        })),
      ].map((r, index) => ({ ...r, is_capa: index === 0, ordem: index }))

      await replaceImovelImagens(imovelId, rows)

      setNewFiles([])
      setManualImageUrls([])
      router.push('/admin/imoveis')
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Erro ao salvar.')
    }
  }

  if (loadingProperty) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Carregando…
      </div>
    )
  }

  const imageCount = existingImages.length + manualImageUrls.length + newFiles.length

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 [&_input]:py-3 [&_select]:py-3 [&_textarea]:py-3"
      >
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-primary via-slate-900 to-slate-800 px-5 py-6 text-white sm:px-7 sm:py-7">
            <div className="flex flex-col gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                  Cadastro de imóveis
                </p>
                <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                  {isNew ? 'Novo imóvel' : 'Editar imóvel'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Organize as informações do anúncio, adicione fotos e revise os
                  dados antes de publicar no catálogo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm text-slate-500 sm:grid-cols-3 sm:px-7">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-accent" />
              Status, valores e localização
            </div>
            <div className="flex items-center gap-2">
              <Images className="size-4 text-accent" />
              Fotos do anúncio
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-accent" />
              Responsáveis e proprietário
            </div>
          </div>
        </div>

        {serverError ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </p>
        ) : null}

        <div className="space-y-6">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Home className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-primary">
                        Dados principais
                      </h2>
                      <p className="text-xs text-muted">
                        Informações que aparecem no catálogo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div>
                    <Input label="Título" {...register('titulo')} error={errors.titulo?.message} />
                  </div>
                  <Select
                    label="Tipo"
                    options={PROPERTY_TYPES}
                    {...register('tipo')}
                    error={errors.tipo?.message}
                  />
                  <Select
                    label="Status"
                    options={statusOptions}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                  <Select
                    label="Finalidade"
                    options={PURPOSES}
                    {...register('finalidade')}
                    error={errors.finalidade?.message}
                  />
                  <div className="lg:col-span-4">
                    <Textarea
                      label="Descrição"
                      rows={4}
                      className="min-h-[132px]"
                      {...register('descricao')}
                      error={errors.descricao?.message}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-primary">
                      Valores e localização
                    </h2>
                    <p className="text-xs text-muted">
                      Preço, endereço e dados para o mapa do imóvel.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                <Input
                  label="Preço (R$)"
                  type="number"
                  step="1"
                  {...register('preco')}
                  error={errors.preco?.message}
                />
                <Input
                  label="Área (m²)"
                  type="number"
                  step="0.01"
                  {...register('area')}
                  error={errors.area?.message}
                />
                <Input
                  label="CEP"
                  inputMode="numeric"
                  placeholder="00000-000"
                  {...register('cep')}
                  error={errors.cep?.message}
                />
                {cepStatus ? (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-muted sm:col-span-2 xl:col-span-4">
                    {cepStatus}
                  </p>
                ) : null}
                <Input label="Cidade" {...register('cidade')} error={errors.cidade?.message} />
                <Input label="Bairro" {...register('bairro')} error={errors.bairro?.message} />
                <div className="sm:col-span-2 xl:col-span-2">
                  <Input
                    label="Endereço completo (opcional)"
                    placeholder="Rua, número e complemento"
                    {...register('endereco')}
                  />
                </div>
                {hasCepForCoordinates ? (
                  <div className="grid gap-4 rounded-xl border border-amber-100 bg-amber-50/70 p-4 sm:col-span-2 sm:grid-cols-2 xl:col-span-4">
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-amber-900">
                        Coordenadas do endereço
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Preencha latitude e longitude apenas quando tiver o CEP/endereço
                        completo para localizar o imóvel no mapa.
                      </p>
                    </div>
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      placeholder="-23.55052"
                      {...register('latitude')}
                      error={errors.latitude?.message}
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      placeholder="-46.633308"
                      {...register('longitude')}
                      error={errors.longitude?.message}
                    />
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-muted sm:col-span-2 xl:col-span-4">
                    Informe o CEP para liberar latitude e longitude. Sem CEP, o imóvel
                    não será enviado para o mapa por coordenadas.
                  </p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BedDouble className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-primary">
                      Características
                    </h2>
                    <p className="text-xs text-muted">
                      Estrutura, cômodos e destaque do anúncio.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
                <Input
                  label="Quartos"
                  type="number"
                  {...register('quartos')}
                  error={errors.quartos?.message}
                />
                <Input
                  label="Suítes"
                  type="number"
                  {...register('suites')}
                  error={errors.suites?.message}
                />
                <Input
                  label="Banheiros"
                  type="number"
                  {...register('banheiros')}
                  error={errors.banheiros?.message}
                />
                <Input
                  label="Vagas"
                  type="number"
                  {...register('vagas')}
                  error={errors.vagas?.message}
                />
                <label className="flex min-h-[74px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-accent/40 hover:bg-accent/5">
                  <Controller
                    name="destaque"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="size-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                    )}
                  />
                  Mostrar em destaque
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-primary">
                      Responsáveis
                    </h2>
                    <p className="text-xs text-muted">
                      Captador e proprietário vinculados.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <Select
                    label="Captador"
                    options={[
                      { value: '', label: 'Nenhum captador vinculado' },
                      ...captadores.map((captador) => ({
                        value: captador.id,
                        label: captador.nome,
                      })),
                    ]}
                    {...register('captador_id')}
                    error={errors.captador_id?.message}
                  />
                  <p className="text-xs text-muted">Quem captou/conversou com o proprietário.</p>
                </div>

                <Select
                  label="Proprietário"
                  options={[
                    { value: '', label: 'Nenhum proprietário vinculado' },
                    ...proprietarios.map((proprietario) => ({
                      value: proprietario.id,
                      label: proprietario.nome,
                    })),
                  ]}
                  {...register('proprietario_id')}
                  error={errors.proprietario_id?.message}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Participação (%)"
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    {...register('proprietario_percentual')}
                    error={errors.proprietario_percentual?.message}
                  />
                  <label className="flex min-h-[74px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-accent/40 hover:bg-accent/5">
                    <Controller
                      name="proprietario_principal"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value ?? true}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                      )}
                    />
                    Proprietário principal
                  </label>
                </div>

                {!proprietarios.length ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Nenhum proprietário ativo. Cadastre em{' '}
                    <Link href="/admin/proprietarios/novo" className="font-semibold underline">
                      Clientes
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Images className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-primary">Fotos</h2>
                    <p className="text-xs text-muted">
                      {imageCount} imagem(ns) adicionada(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition hover:border-accent hover:bg-accent/5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Upload className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      Adicionar imagens
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Clique ou selecione vários arquivos
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickFiles}
                  />
                </label>

                {!cloudinaryConfigured() ? (
                  <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Cloudinary não configurado para upload de arquivos.
                  </p>
                ) : null}
                {uploadProgress ? (
                  <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-muted">
                    {uploadProgress}
                  </p>
                ) : null}

                <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    label="URL da imagem"
                    type="url"
                    placeholder="https://..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-end"
                    onClick={addImageUrl}
                  >
                    Inserir URL
                  </Button>
                </div>

                {imageCount ? (
                  <div className="mt-5 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                    >
                      <img
                        src={safeImagePreviewUrl(img.url)}
                        alt=""
                        onError={fallbackImage}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        onClick={() => removeExisting(img)}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  {manualImageUrls.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                    >
                      <img
                        src={safeImagePreviewUrl(url)}
                        alt=""
                        onError={fallbackImage}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        onClick={() => removeManualUrl(i)}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        onError={fallbackImage}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        onClick={() => removeNewFile(i)}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>

        <div className="sticky bottom-4 z-20 rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pronto para salvar?
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Revise os dados, fotos e responsáveis antes de publicar o anúncio.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button type="submit" size="lg" loading={isSubmitting}>
                Salvar imóvel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => router.push('/admin/imoveis')}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
