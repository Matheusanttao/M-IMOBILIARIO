'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import {
  createImovel,
  fetchImovelByIdForAdmin,
  replaceImovelImagens,
  updateImovel,
} from '@/services/imoveis'
import { uploadManyToCloudinary, cloudinaryConfigured } from '@/services/cloudinary'
import { propertyFormSchema, type PropertyFormValues } from '@/lib/validators'
import type { ImovelImagemRow } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { PROPERTY_TYPES, PURPOSES, IMOVEL_STATUS_LABELS } from '@/lib/constants'

const statusOptions = (
  Object.entries(IMOVEL_STATUS_LABELS) as [keyof typeof IMOVEL_STATUS_LABELS, string][]
).map(([value, label]) => ({ value, label }))

export function PropertyForm() {
  const params = useParams<{ id: string }>()
  const paramId = params?.id
  const router = useRouter()
  const isNew = paramId === 'novo' || !paramId

  const [loadingProperty, setLoadingProperty] = useState(!isNew)
  const [existingImages, setExistingImages] = useState<ImovelImagemRow[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as Resolver<PropertyFormValues>,
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'apartamento',
      finalidade: 'venda',
      preco: 0,
      cidade: '',
      bairro: '',
      endereco: '',
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      area: 80,
      status: 'disponivel',
      destaque: false,
    },
  })

  useEffect(() => {
    if (isNew || !paramId) {
      setLoadingProperty(false)
      return
    }
    let cancelled = false
    fetchImovelByIdForAdmin(paramId)
      .then((p) => {
        if (cancelled || !p) return
        reset({
          titulo: p.titulo,
          descricao: p.descricao ?? '',
          tipo: p.tipo,
          finalidade: p.finalidade,
          preco: p.preco,
          cidade: p.cidade,
          bairro: p.bairro,
          endereco: p.endereco ?? '',
          quartos: p.quartos,
          suites: p.suites,
          banheiros: p.banheiros,
          vagas: p.vagas,
          area: p.area ?? 80,
          status: p.status,
          destaque: p.destaque,
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

  async function generateWithAI() {
    setAiLoading(true)
    setServerError(null)
    try {
      const values = getValues()
      const res = await fetch('/api/ai/descricao', {
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
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? 'Erro ao gerar descrição com IA')
        return
      }
      if (data.descricao) {
        setValue('descricao', data.descricao, { shouldDirty: true })
      }
    } catch {
      setServerError('Erro de conexão ao gerar descrição.')
    } finally {
      setAiLoading(false)
    }
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list?.length) return
    setNewFiles((prev) => [...prev, ...Array.from(list)])
    e.target.value = ''
  }

  function removeNewFile(i: number) {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i))
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
        cidade: data.cidade,
        bairro: data.bairro,
        endereco: data.endereco || null,
        quartos: data.quartos,
        suites: data.suites,
        banheiros: data.banheiros,
        vagas: data.vagas,
        area: data.area,
        status: data.status,
        destaque: data.destaque,
      }

      if (isNew) {
        const created = await createImovel(base)
        imovelId = created.id
      } else if (paramId) {
        await updateImovel(paramId, base)
        imovelId = paramId
      }

      if (!imovelId) throw new Error('ID do imóvel inválido.')

      const uploaded =
        newFiles.length && cloudinaryConfigured()
          ? await uploadManyToCloudinary(newFiles, (done, total) => {
              setUploadProgress(`Enviando fotos ${done}/${total}…`)
            })
          : []
      setUploadProgress(null)

      const rows = [
        ...existingImages.map((img) => ({
          url: img.url,
          public_id: img.public_id,
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
      router.push('/admin')
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-primary">
          {isNew ? 'Novo imóvel' : 'Editar imóvel'}
        </h1>
        <Link
          href="/admin"
          className="text-sm font-medium text-primary underline hover:text-accent"
        >
          Voltar
        </Link>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8"
      >
        <Input label="Título" {...register('titulo')} error={errors.titulo?.message} />
        <div>
          <Textarea
            label="Descrição"
            rows={5}
            {...register('descricao')}
            error={errors.descricao?.message}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={aiLoading}
            onClick={generateWithAI}
          >
            {aiLoading ? 'Gerando…' : '✨ Gerar com IA'}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            options={PROPERTY_TYPES}
            {...register('tipo')}
            error={errors.tipo?.message}
          />
          <Select
            label="Finalidade"
            options={PURPOSES}
            {...register('finalidade')}
            error={errors.finalidade?.message}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <Input label="Cidade" {...register('cidade')} error={errors.cidade?.message} />
        <Input
          label="Bairro"
          {...register('bairro')}
          error={errors.bairro?.message}
        />
        <Input label="Endereço (opcional)" {...register('endereco')} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            options={statusOptions}
            {...register('status')}
            error={errors.status?.message}
          />
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
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
              Destaque na página inicial
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Fotos</p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-surface/50 px-4 py-8 transition hover:border-accent">
            <Upload className="mb-2 size-8 text-accent" />
            <span className="text-sm text-muted">Clique para adicionar imagens</span>
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
              Cloudinary não configurado — uploads desabilitados até definir as variáveis de ambiente.
            </p>
          ) : null}
          {uploadProgress ? (
            <p className="mt-2 text-sm text-muted">{uploadProgress}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {newFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
        </div>

        {serverError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isSubmitting}>
            Salvar
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
