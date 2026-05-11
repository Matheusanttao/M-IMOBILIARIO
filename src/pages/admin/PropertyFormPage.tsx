import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import {
  createProperty,
  fetchPropertyForAdmin,
  replacePropertyImages,
  updateProperty,
} from '@/services/properties'
import { uploadManyToCloudinary, cloudinaryConfigured } from '@/services/cloudinary'
import { propertyFormSchema, type PropertyFormValues } from '@/lib/validators'
import type { PropertyImageRow } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { PROPERTY_TYPES, PURPOSES } from '@/lib/constants'

export function PropertyFormPage() {
  const { id: paramId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = paramId === 'novo' || !paramId

  const [loadingProperty, setLoadingProperty] = useState(!isNew)
  const [existingImages, setExistingImages] = useState<PropertyImageRow[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as Resolver<PropertyFormValues>,
    defaultValues: {
      title: '',
      description: '',
      type: 'apartamento',
      purpose: 'venda',
      price: 0,
      city: '',
      neighborhood: '',
      address: '',
      bedrooms: 0,
      bathrooms: 0,
      parking_spaces: 0,
      area: 80,
      status: 'ativo',
      featured: false,
    },
  })

  useEffect(() => {
    if (isNew || !paramId) {
      setLoadingProperty(false)
      return
    }
    let cancelled = false
    fetchPropertyForAdmin(paramId)
      .then((p) => {
        if (cancelled || !p) return
        if (!p) {
          setServerError('Imóvel não encontrado.')
          return
        }
        reset({
          title: p.title,
          description: p.description ?? '',
          type: p.type,
          purpose: p.purpose,
          price: p.price,
          city: p.city,
          neighborhood: p.neighborhood,
          address: p.address ?? '',
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          parking_spaces: p.parking_spaces,
          area: p.area ?? 80,
          status: p.status,
          featured: p.featured,
        })
        setExistingImages(p.property_images ?? [])
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
    setNewFiles((prev) => [...prev, ...Array.from(list)])
    e.target.value = ''
  }

  function removeNewFile(i: number) {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  function removeExisting(img: PropertyImageRow) {
    setExistingImages((prev) => prev.filter((x) => x.id !== img.id))
  }

  async function onSubmit(data: PropertyFormValues) {
    setServerError(null)
    if (newFiles.length > 0 && !cloudinaryConfigured()) {
      setServerError('Configure Cloudinary no .env para enviar fotos.')
      return
    }
    try {
      let propertyId = paramId

      const base = {
        title: data.title,
        description: data.description,
        type: data.type,
        purpose: data.purpose,
        price: data.price,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address || null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parking_spaces: data.parking_spaces,
        area: data.area,
        status: data.status,
        featured: data.featured,
      }

      if (isNew) {
        const created = await createProperty(base)
        propertyId = created.id
      } else if (paramId) {
        await updateProperty(paramId, base)
        propertyId = paramId
      }

      if (!propertyId) throw new Error('ID do imóvel inválido.')

      const uploaded =
        newFiles.length && cloudinaryConfigured()
          ? await uploadManyToCloudinary(newFiles, (done, total) => {
              setUploadProgress(`Enviando fotos ${done}/${total}…`)
            })
          : []
      setUploadProgress(null)

      const rows = [
        ...existingImages.map((img) => ({
          image_url: img.image_url,
          public_id: img.public_id,
          is_cover: false,
        })),
        ...uploaded.map((u) => ({
          image_url: u.secure_url,
          public_id: u.public_id,
          is_cover: false,
        })),
      ].map((r, index) => ({ ...r, is_cover: index === 0 }))

      await replacePropertyImages(propertyId, rows)

      setNewFiles([])
      navigate('/admin')
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
          to="/admin"
          className="text-sm font-medium text-primary underline hover:text-accent"
        >
          Voltar
        </Link>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8"
      >
        <Input label="Título" {...register('title')} error={errors.title?.message} />
        <Textarea
          label="Descrição"
          rows={5}
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            options={PROPERTY_TYPES}
            {...register('type')}
            error={errors.type?.message}
          />
          <Select
            label="Finalidade"
            options={PURPOSES}
            {...register('purpose')}
            error={errors.purpose?.message}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Preço (R$)"
            type="number"
            step="1"
            {...register('price')}
            error={errors.price?.message}
          />
          <Input
            label="Área (m²)"
            type="number"
            step="0.01"
            {...register('area')}
            error={errors.area?.message}
          />
        </div>

        <Input label="Cidade" {...register('city')} error={errors.city?.message} />
        <Input
          label="Bairro"
          {...register('neighborhood')}
          error={errors.neighborhood?.message}
        />
        <Input label="Endereço (opcional)" {...register('address')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Quartos"
            type="number"
            {...register('bedrooms')}
            error={errors.bedrooms?.message}
          />
          <Input
            label="Banheiros"
            type="number"
            {...register('bathrooms')}
            error={errors.bathrooms?.message}
          />
          <Input
            label="Vagas"
            type="number"
            {...register('parking_spaces')}
            error={errors.parking_spaces?.message}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
            ]}
            {...register('status')}
            error={errors.status?.message}
          />
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
              <Controller
                name="featured"
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
              <div key={img.id} className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                <img src={img.image_url} alt="" className="size-full object-cover" />
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
              <div key={`${file.name}-${i}`} className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100">
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
          <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
