import { Suspense } from 'react'
import { AdminLoginForm } from '@/app/admin/login/login-form'

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
          Carregando…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
