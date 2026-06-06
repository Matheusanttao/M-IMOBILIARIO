'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface TenantContextValue {
  empresaId: string
  empresaNome: string
  slug: string
  whatsapp: string | null
  email: string | null
  cidade: string | null
  estado: string | null
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  children,
  value,
}: {
  children: ReactNode
  value: TenantContextValue
}) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant deve ser usado dentro de TenantProvider')
  }
  return ctx
}
