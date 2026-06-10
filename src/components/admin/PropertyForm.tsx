'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, Upload, X } from 'lucide-react'
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
  const [captadores, setCaptadores] = useState<CaptadorOption[]>([])
  const [proprietarios, setProprietarios] = useState<ProprietarioRow[]>([])
  const [propertyEmpresaId, setPropertyEmpresaId] = useState<string | null>(null)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    getValues,
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
  const hasCepForCoordinates = cepValue.replace(/\D/g, '').length >= 8

  useEffect(() => {
    if (hasCepForCoordinates) return
    setValue('latitude', null, { shouldDirty: true })
    setValue('longitude', null, { shouldDirty: true })
  }, [hasCepForCoordinates, setValue])

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
    const files = Array.from(list)
    setServerError(null)
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

  async function generateDescription() {
    const values = getValues()
    if (!values.titulo.trim() || !values.cidade.trim() || !values.bairro.trim()) {
      setServerError('Informe título, cidade e bairro antes de gerar a descrição com IA.')
      return
    }

    setServerError(null)
    setGeneratingDescription(true)
    try {
      const response = await fetch('/api/ai/descricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: values.titulo,
          tipo: values.tipo,
          finalidade: values.finalidade,
          cidade: values.cidade,
          bairro: values.bairro,
          quartos: values.quartos,
          banheiros: values.banheiros,
          vagas: values.vagas,
          area: values.area,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as {
        descricao?: string
        error?: string
      }
      if (!response.ok) {
        throw new Error(body.error ?? 'Não foi possível gerar a descrição.')
      }
      if (!body.descricao?.trim()) {
        throw new Error('A IA não retornou uma descrição válida.')
      }
      setValue('descricao', body.descricao, { shouldDirty: true, shouldValidate: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Erro ao gerar descrição.')
    } finally {
      setGeneratingDescription(false)
    }
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
        className="space-y-4 [&_input]:py-2 [&_select]:py-2 [&_textarea]:py-2"
      >
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Cadastro
              </p>
              <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">
                {isNew ? 'Novo imóvel' : 'Editar imóvel'}
              </h1>
            </div>
          </div>
        </div>

        {serverError ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-primary">
                    Dados principais
                  </h2>
                  <p className="text-xs text-muted">Informações exibidas no catálogo.</p>
                </div>
                <div className="w-40">
                  <Select
                    label="Status"
                    options={statusOptions}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Input label="Título" {...register('titulo')} error={errors.titulo?.message} />
                </div>
                <Select
                  label="Finalidade"
                  options={PURPOSES}
                  {...register('finalidade')}
                  error={errors.finalidade?.message}
                />
                <Select
                  label="Tipo"
                  options={PROPERTY_TYPES}
                  {...register('tipo')}
                  error={errors.tipo?.message}
                />
                <div className="space-y-2 lg:col-span-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void generateDescription()}
                      disabled={generatingDescription || isSubmitting}
                      className="gap-2"
                    >
                      <Sparkles className="size-4" />
                      {generatingDescription ? 'Gerando...' : 'Gerar com IA'}
                    </Button>
                  </div>
                  <Textarea
                    label="Descrição"
                    rows={3}
                    className="min-h-[96px]"
                    {...register('descricao')}
                    error={errors.descricao?.message}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-display text-lg font-semibold text-primary">Valores e localização</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  <p className="rounded-xl bg-surface/70 px-4 py-3 text-xs text-muted sm:col-span-2 xl:col-span-4">
                    Informe o CEP para liberar latitude e longitude. Sem CEP, o imóvel
                    não será enviado para o mapa por coordenadas.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-display text-lg font-semibold text-primary">Características</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <label className="flex min-h-[66px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-surface/50 px-4 text-sm font-medium text-slate-700">
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
                  Destaque
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-display text-lg font-semibold text-primary">Responsáveis</h2>
              <div className="mt-4 space-y-4">
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Input
                    label="Participação (%)"
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    {...register('proprietario_percentual')}
                    error={errors.proprietario_percentual?.message}
                  />
                  <label className="flex min-h-[66px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-surface/50 px-4 text-sm font-medium text-slate-700">
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
                    Principal
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

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-primary">Fotos</h2>
                  <p className="text-xs text-muted">{imageCount} imagem(ns) adicionada(s)</p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-surface/50 px-4 py-4 transition hover:border-accent">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Upload className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-700">Adicionar imagens</span>
                  <span className="block text-xs text-muted">Clique ou selecione vários arquivos</span>
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
                <p className="mt-2 text-xs text-amber-700">
                  Cloudinary não configurado para upload de arquivos.
                </p>
              ) : null}
              {uploadProgress ? (
                <p className="mt-2 text-sm text-muted">{uploadProgress}</p>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1 2xl:grid-cols-[1fr_auto]">
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
                <div className="mt-4 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                    >
                      <img src={img.url} alt="" className="size-full object-cover" />
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
                      <img src={url} alt="" className="size-full object-cover" />
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
            </section>
          </aside>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Revise as informações antes de salvar o cadastro do imóvel.
            </p>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button type="submit" loading={isSubmitting}>
                Salvar imóvel
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/admin/imoveis')}>
                Cancelar
              </Button>
              <Link
                href="/admin/imoveis"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
