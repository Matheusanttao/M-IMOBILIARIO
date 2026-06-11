'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Building2, LockKeyhole } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/client'

const REMEMBER_LOGIN_KEY = 'admin_remember_login'

export function AdminLoginForm({ version }: { version: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') ?? '/admin'
  const [error, setError] = useState<string | null>(null)
  const [loginStatus, setLoginStatus] = useState<string | null>(null)
  const [rememberLogin, setRememberLogin] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_LOGIN_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as Partial<LoginFormValues>
      if (parsed.email) setValue('email', parsed.email)
      if (parsed.password) setValue('password', parsed.password)
      setRememberLogin(Boolean(parsed.email || parsed.password))
    } catch {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
    }
  }, [setValue])

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

    if (rememberLogin) {
      window.localStorage.setItem(
        REMEMBER_LOGIN_KEY,
        JSON.stringify({ email: data.email, password: data.password }),
      )
    } else {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
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

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-white shadow-2xl shadow-black/40 lg:grid-cols-[1fr_30rem]">
        <section className="hidden min-h-[42rem] flex-col justify-between bg-gradient-to-br from-primary via-slate-900 to-slate-950 p-12 text-white lg:flex">
          <div>
            <div className="inline-flex size-16 items-center justify-center rounded-3xl bg-accent text-primary shadow-lg shadow-black/20">
              <Building2 className="size-8" />
            </div>
            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.35em] text-accent">
              Painel imobiliário
            </p>
            <h1 className="mt-5 max-w-xl font-display text-5xl font-bold leading-tight">
              Gerencie imóveis, leads e atendimentos em um só lugar.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
              Acesso restrito para administradores e equipe autorizada.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-base leading-7 text-white/75">
            Use suas credenciais para entrar no painel administrativo.
          </div>
        </section>

        <section className="px-6 py-10 sm:px-12 sm:py-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <LockKeyhole className="size-7" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-primary">Área admin</h1>
                <p className="mt-1 text-base text-muted">Entre com seu e-mail e senha.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 [&_input]:h-12 [&_input]:text-base [&_label]:text-sm">
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
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>
                  <span className="block font-medium text-slate-700">
                    Lembrar e-mail e senha
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Salvar neste navegador para preencher automaticamente.
                  </span>
                </span>
              </label>
              {loginStatus ? (
                <p className="rounded-2xl bg-blue-50 px-4 py-3 text-base font-medium text-primary">
                  {loginStatus}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>
              ) : null}
              <Button type="submit" className="mt-3 h-12 w-full text-base shadow-lg shadow-primary/15" loading={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="pt-3 text-center text-sm text-slate-400">Versão {version}</p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
