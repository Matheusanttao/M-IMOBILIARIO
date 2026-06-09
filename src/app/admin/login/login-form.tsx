'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/client'

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') ?? '/admin'
  const [error, setError] = useState<string | null>(null)
  const [loginStatus, setLoginStatus] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormValues) {
    setError(null)
    setLoginStatus('Verificando credenciais...')
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_SETUP_MESSAGE)
      setLoginStatus(null)
      return
    }
    const supabase = createClient()
    const { data: authData, error: e } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (e) {
      setError(e.message)
      setLoginStatus(null)
      return
    }

    setLoginStatus('Carregando perfil...')
    const userId = authData.user?.id
    if (!userId) {
      setError('Login realizado, mas não foi possível carregar o usuário.')
      setLoginStatus(null)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('role, ativo, empresa_id')
      .eq('id', userId)
      .maybeSingle()

    if (perfilError || !perfil) {
      await supabase.auth.signOut()
      setError('Usuário sem perfil no sistema. Rode o script SQL atualizado no Supabase e tente entrar novamente.')
      setLoginStatus(null)
      return
    }

    if (!perfil.ativo) {
      await supabase.auth.signOut()
      setError('Usuário desativado. Fale com o administrador.')
      setLoginStatus(null)
      return
    }

    if (perfil.role) {
      window.sessionStorage.setItem('admin_user_role', perfil.role)
    }

    setLoginStatus('Preparando painel...')
    if (perfil.empresa_id) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('slug')
        .eq('id', perfil.empresa_id)
        .eq('ativa', true)
        .maybeSingle()

      if (empresa?.slug) {
        document.cookie = `tenant_slug=${encodeURIComponent(empresa.slug)}; path=/; max-age=31536000; samesite=lax`
      }
    }

    setLoginStatus('Entrando no painel...')
    router.replace(next)
    router.refresh()
  }

  const loading = isSubmitting || Boolean(loginStatus)

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-primary">Área admin</h1>
        <p className="mt-1 text-sm text-muted">Entre com seu e-mail e senha.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            disabled={loading}
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            disabled={loading}
            {...register('password')}
            error={errors.password?.message}
          />
          {loginStatus ? (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-primary">
              {loginStatus}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
