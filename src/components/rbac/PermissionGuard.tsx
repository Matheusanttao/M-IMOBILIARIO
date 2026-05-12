'use client'

import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { AcaoRBAC, ModuloRBAC } from '@/lib/rbac'

type PermissionGuardProps = {
  modulo: ModuloRBAC
  acao: AcaoRBAC
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  modulo,
  acao,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, loading } = usePermissions()
  if (loading) return null
  if (!can(modulo, acao)) return <>{fallback}</>
  return <>{children}</>
}
