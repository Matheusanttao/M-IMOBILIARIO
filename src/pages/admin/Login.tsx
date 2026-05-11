import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'

export function Login() {
  const { user, loading, signIn } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname

  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!loading && user) {
    return <Navigate to={from && from !== '/admin/login' ? from : '/admin'} replace />
  }

  async function onSubmit(data: LoginFormValues) {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) setServerError(error)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 font-display text-2xl font-semibold text-primary">
          M<span className="text-accent">.</span> Imobiliário
        </Link>
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <h1 className="text-center font-display text-2xl font-bold text-primary">
            Área administrativa
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Entre com sua conta Supabase Auth
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
            {serverError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={isSubmitting || loading}>
              Entrar
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link to="/" className="text-primary underline hover:text-accent">
              Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
