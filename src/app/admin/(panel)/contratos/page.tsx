'use client'

import { useEffect, useState } from 'react'
import { fetchContratos } from '@/services/contratos'

export default function AdminContratosPage() {
  const [contratos, setContratos] = useState<unknown[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const c = await fetchContratos()
      if (!cancelled) {
        setContratos(c)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Contratos</h1>
      <p className="mt-1 text-muted">Contratos vinculados aos imóveis.</p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase text-muted">
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Imóvel</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((row) => {
              const r = row as Record<string, unknown>
              return (
              <tr key={String(r.id)} className="border-b border-slate-50">
                <td className="px-3 py-2">R$ {Number(r.valor).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2">{String(r.tipo)}</td>
                <td className="px-3 py-2">{String(r.status)}</td>
                <td className="px-3 py-2">
                  {(r.imoveis as { titulo?: string } | null)?.titulo ?? '—'}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
