'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Building2, LockKeyhole } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/client'

export function AdminLoginForm({ version }: { version: string }) {
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div
        aria-hidden
        className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-[-16rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-primary/40 blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/40 lg:grid-cols-[1fr_26rem]">
        <section className="hidden min-h-[34rem] flex-col justify-between bg-gradient-to-br from-primary via-slate-900 to-slate-950 p-10 text-white lg:flex">
          <div>
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-primary shadow-lg shadow-black/20">
              <Building2 className="size-6" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Painel imobiliário
            </p>
            <h1 className="mt-4 max-w-md font-display text-4xl font-bold leading-tight">
              Gerencie imóveis, leads e atendimentos em um só lugar.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              Acesso restrito para administradores e equipe autorizada.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Use suas credenciais para entrar no painel administrativo.
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-primary">Área admin</h1>
                <p className="mt-0.5 text-sm text-muted">Entre com seu e-mail e senha.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-primary">
                  {loginStatus}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}
              <Button type="submit" className="mt-2 w-full shadow-lg shadow-primary/15" loading={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="pt-2 text-center text-xs text-slate-400">Versão {version}</p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
