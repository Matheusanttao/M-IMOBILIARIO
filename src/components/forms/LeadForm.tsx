'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadFormValues } from '@/lib/validators'
import { createLead } from '@/services/leads'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useState } from 'react'

export function LeadForm({
  imovelId,
  empresaId,
}: {
  imovelId: string
  empresaId: string
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
  })

  async function onSubmit(data: LeadFormValues) {
    setServerError(null)
    setSuccess(false)
    try {
      await createLead({
        imovel_id: imovelId,
        empresa_id: empresaId,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        message: data.message,
      })
      setSuccess(true)
      reset()
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Não foi possível enviar.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register('name')} error={errors.name?.message} />
      <Input label="Telefone" {...register('phone')} error={errors.phone?.message} />
      <Input
        label="E-mail (opcional)"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Textarea
        label="Mensagem"
        rows={4}
        {...register('message')}
        error={errors.message?.message}
      />
      {serverError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Mensagem enviada! Em breve entraremos em contato.
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Enviar interesse
      </Button>
    </form>
  )
}
